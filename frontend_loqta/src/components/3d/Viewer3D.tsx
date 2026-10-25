import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Longest side of every model is scaled to this many world units. */
const TARGET_SIZE = 4;

interface SceneProps {
  modelUrl: string;
  rotate: boolean;
  alwaysRotate: boolean;
  loadingLabel: string;
  interactive: boolean;
  onReady?: () => void;
}

function Scene({ modelUrl, rotate, alwaysRotate, loadingLabel, interactive, onReady }: SceneProps) {
  const invalidate = useThree((state) => state.invalidate);
  // Idle rotation stops as soon as the shopper takes control.
  const interactedRef = useRef(false);
  return (
    <>
      <StudioEnvironment />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.6} />
      <directionalLight position={[-6, -3, -4]} intensity={0.5} />
      <Suspense
        fallback={
          <Html center>
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-2"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">{loadingLabel}</p>
            </div>
          </Html>
        }
      >
        <Model
          url={modelUrl}
          rotate={rotate}
          alwaysRotate={alwaysRotate}
          invalidate={invalidate}
          interactedRef={interactedRef}
          onReady={onReady}
        />
      </Suspense>
      {interactive && (
        <OrbitControls
          enablePan={false}
          makeDefault
          enableDamping={false}
          onStart={() => { interactedRef.current = true; }}
          minDistance={3}
          maxDistance={10}
        />
      )}
    </>
  );
}

/**
 * Offline studio lighting: a locally generated environment map gives PBR
 * metals something to reflect, so models are not rendered pitch black.
 * No HDRI download is needed.
 */
function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = target.texture;
    invalidate();

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  return null;
}

function Model({
  url,
  rotate,
  alwaysRotate,
  invalidate,
  interactedRef,
  onReady,
}: {
  url: string;
  rotate: boolean;
  alwaysRotate: boolean;
  invalidate: () => void;
  interactedRef: MutableRefObject<boolean>;
  onReady?: () => void;
}) {
  const gltf = useGLTF(url);
  // Clone the cached scene: the same product may be visible in several
  // canvases at once (home grid + featured row) and a three.js object can
  // only have one parent.
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const fitRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const notifiedReady = useRef(false);

  useEffect(() => {
    if (notifiedReady.current) return;
    notifiedReady.current = true;
    onReady?.();
  }, [onReady]);

  useLayoutEffect(() => {
    const fit = fitRef.current;
    if (!fit) return;

    // Models come from many sources with different units and origins.
    // Normalize size + center so every product is framed the same way.
    scene.position.set(0, 0, 0);
    scene.scale.setScalar(1);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_SIZE / longest;

    // Scale on the parent and compensate the offset so the model's bounding
    // box centre lands exactly on the parent origin — the spin group can then
    // rotate in place without orbiting.
    fit.scale.setScalar(scale);
    fit.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    fit.updateMatrixWorld(true);
    invalidate();
  }, [scene, invalidate]);

  useFrame((_state, delta) => {
    if (rotate && (alwaysRotate || !interactedRef.current) && spinRef.current) {
      // Subtle idle rotation; skipped for prefers-reduced-motion users.
      spinRef.current.rotation.y += delta * 0.25;
      invalidate(); // request the next frame in frameloop="demand" mode
    }
  });

  return (
    <group ref={fitRef}>
      <group ref={spinRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

/** Reports WebGL context loss so the wrapper can show the static fallback. */
function ContextLossReporter({ onFail }: { onFail?: () => void }) {
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    if (!onFail) return;
    const canvas = gl.domElement;
    const handler = (event: Event) => {
      if (!(event as WebGLContextEvent).defaultPrevented) onFail();
    };
    canvas.addEventListener('webglcontextlost', handler);
    return () => canvas.removeEventListener('webglcontextlost', handler);
  }, [gl, onFail]);
  return null;
}

export interface Viewer3DProps {
  modelUrl: string;
  loadingLabel: string;
  reducedMotion: boolean;
  /** Cards render a non-interactive auto-spinning miniature. */
  interactive?: boolean;
  /** Keeps spinning even after the shopper interacts (used by the hero). */
  alwaysRotate?: boolean;
  /** 1 = default framing; 0.75 renders the model 25% smaller. */
  zoom?: number;
  /** Fired once the model is loaded and framed — used to fade it in. */
  onReady?: () => void;
  onFail?: () => void;
}

/**
 * The actual WebGL canvas. Lazy-loaded by Product3DViewer so the heavy
 * three.js bundle is only fetched when a 3D view is actually shown.
 *
 * frameloop="demand": frames are rendered only on user interaction or while
 * the idle rotation is active — saving GPU work on low-end devices.
 */
export default function Viewer3D({
  modelUrl,
  loadingLabel,
  reducedMotion,
  interactive = true,
  alwaysRotate = false,
  zoom = 1,
  onReady,
  onFail,
}: Viewer3DProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.5 / zoom], fov: 45 }}
      // Touch drag rotates the model; vertical swipes still scroll the page.
      style={{ touchAction: interactive ? 'pan-y' : 'auto' }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Scene
        modelUrl={modelUrl}
        rotate={!reducedMotion}
        alwaysRotate={alwaysRotate}
        loadingLabel={loadingLabel}
        interactive={interactive}
        onReady={onReady}
      />
      <ContextLossReporter onFail={onFail} />
    </Canvas>
  );
}
