import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useReducedMotion } from '../../lib/useReducedMotion';

// The heavy three.js bundle stays in its own chunk and is only fetched when a
// 3D preview actually scrolls into view.
const LazyViewer3D = React.lazy(() => import('./Viewer3D'));

interface Product3DThumbProps {
  modelUrl?: string;
  image?: string;
  alt: string;
  /** Extra classes for the photo layer (padding / hover zoom). */
  imageClassName?: string;
}

/**
 * Product image slot used by every card in the storefront.
 *
 * - If the product has a 3D model, the model is rendered live (auto-rotating)
 *   and the photo is only shown until the model is ready.
 * - Otherwise the real product photo is shown.
 * - If neither exists, a neutral placeholder is displayed — no invented image.
 *
 * The canvas mounts only while the card is near the viewport, so a grid never
 * keeps more than a handful of WebGL contexts alive.
 */
export function Product3DThumb({ modelUrl, image, alt, imageClassName }: Product3DThumbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setNearViewport(entry.isIntersecting);
      },
      { rootMargin: '120px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleReady = useCallback(() => setReady(true), []);
  const handleFail = useCallback(() => setFailed(true), []);

  // jsdom has no WebGL: never mount a canvas in unit tests.
  const isTestEnv = import.meta.env.MODE === 'test';
  const showModel = Boolean(modelUrl) && nearViewport && !failed && !isTestEnv;
  const modelVisible = ready && !failed;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {image ? (
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
            modelVisible ? 'opacity-0' : 'opacity-100'
          } ${imageClassName ?? ''}`}
        />
      ) : (
        !modelVisible && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300" aria-hidden="true">
            <ImageOff className="w-10 h-10" />
          </div>
        )
      )}

      {showModel && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
            modelVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Suspense fallback={null}>
            <LazyViewer3D
              modelUrl={modelUrl!}
              loadingLabel=""
              reducedMotion={reducedMotion}
              interactive={false}
              onReady={handleReady}
              onFail={handleFail}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
