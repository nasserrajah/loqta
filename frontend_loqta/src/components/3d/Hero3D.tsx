// import { Suspense, useRef } from 'react';
// import { Canvas, useFrame } from '@react-three/fiber';
// import { useGLTF, Center, ContactShadows } from '@react-three/drei';
// import * as THREE from 'three';

// function Model({ url }: { url: string }) {
//   const { scene } = useGLTF(url);
//   const modelRef = useRef<THREE.Group>(null);
  
//   useFrame((state, delta) => {
//     if (modelRef.current) {
//       modelRef.current.rotation.y += delta * 0.3; // دوران بطيء
//     }
//   });

//   return <primitive ref={modelRef} object={scene} scale={2} />;
// }

// export function Hero3D({ modelUrl }: { modelUrl: string }) {
//   return (
//     <div className="w-full h-full cursor-grab active:cursor-grabbing">
//       <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
//         <ambientLight intensity={0.7} />
//         <directionalLight position={[10, 10, 10]} intensity={1.5} />
//         <Suspense fallback={null}>
//           <Center>
//             <Model url={modelUrl} />
//           </Center>
//           <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2} far={4} />
//         </Suspense>
//       </Canvas>
//     </div>
//   );
// }