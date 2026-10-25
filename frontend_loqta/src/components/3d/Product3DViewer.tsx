import React, { Suspense, useRef, useState, Component, useEffect } from 'react';
import { AlertCircle, ImageOff, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useReducedMotion } from '../../lib/useReducedMotion';

// The heavy three.js / R3F bundle is split into its own chunk and only
// requested when a 3D view is actually about to render.
const LazyViewer3D = React.lazy(() => import('./Viewer3D'));

// Error boundary for 3D models
class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface ViewerProps {
  modelUrl?: string;
  fallbackImage?: string;
  productName: string;
  /** Overrides the default card chrome (height / background / border). */
  className?: string;
  /** Show the reset-view button (default true). */
  showReset?: boolean;
  /** Allow drag-to-rotate (default true). */
  interactive?: boolean;
  /** Keep spinning even after interaction (default false). */
  alwaysRotate?: boolean;
  /** 1 = default framing; lower values render the model smaller. */
  zoom?: number;
}

/** Real product photo, or a neutral placeholder when no image exists. */
function FallbackMedia({
  image,
  productName,
  className,
}: {
  image?: string;
  productName: string;
  className: string;
}) {
  if (!image) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`}>
        <ImageOff className="w-12 h-12" aria-hidden="true" />
        <span className="sr-only">{productName}</span>
      </div>
    );
  }
  return <img src={image} alt={productName} className={className} loading="lazy" />;
}

/** Starts true once the viewer has been scrolled into view (micro-optimization: render only near the viewport). */
function useInViewOnce(
  rootMargin = '200px',
): [boolean, React.RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true); // very old browsers: just render
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin]);
  return [inView, ref];
}

export function Product3DViewer({
  modelUrl,
  fallbackImage,
  productName,
  className,
  showReset = true,
  interactive = true,
  alwaysRotate = false,
  zoom = 1,
}: ViewerProps) {
  const { t } = useAppStore();
  const [forceReset, setForceReset] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const [inView, containerRef] = useInViewOnce();

  const showViewer = Boolean(modelUrl) && inView && !hasFailed;

  return (
    // a11y: the container exposes the product name to assistive tech
    <div
      ref={containerRef}
      aria-label={productName}
      className={
        className ??
        'w-full h-[400px] bg-gray-50 rounded-xl overflow-hidden relative border border-gray-200'
      }
    >
      {!showViewer ? (
        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center overflow-hidden relative">
          <FallbackMedia image={fallbackImage} productName={productName} className="w-full h-full object-cover opacity-80" />
          {modelUrl && !hasFailed ? (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center pointer-events-none">
              <div className="w-8 h-8 border-4 border-white/60 border-t-transparent rounded-full animate-spin mb-2" aria-hidden="true" />
              <p className="font-semibold">{t('loading3d')}</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
              <AlertCircle className="w-8 h-8 mb-2" aria-hidden="true" />
              <p className="font-semibold">{t('fallback3d')}</p>
              {/* Honest labeling: a static image is NOT a rotatable 3D model. */}
              <p className="text-xs opacity-75 mt-1">
                {hasFailed ? t('viewer3dFailedDesc') : t('viewer3dMissingDesc')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {showReset && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setForceReset((prev) => prev + 1)}
                className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
                title={t('resetView')}
                aria-label={t('resetView')}
              >
                <RefreshCw className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}
          <ModelErrorBoundary
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                <AlertCircle className="w-8 h-8 mb-2" />
                {t('fallback3d')}
              </div>
            }
          >
            {/* Suspense: show the fallback image until the code chunk + model resolve. */}
            <Suspense
              fallback={
                <FallbackImageOverlay image={fallbackImage} productName={productName} loadingLabel={t('loading3d')} />
              }
            >
              <ViewportErrorBridge onError={() => setHasFailed(true)}>
                <LazyViewer3D
                  key={forceReset}
                  modelUrl={modelUrl!}
                  loadingLabel={t('loading3d')}
                  reducedMotion={reducedMotion}
                  interactive={interactive}
                  alwaysRotate={alwaysRotate}
                  zoom={zoom}
                  onFail={() => setHasFailed(true)}
                />
              </ViewportErrorBridge>
            </Suspense>
          </ModelErrorBoundary>
        </>
      )}
    </div>
  );
}

function FallbackImageOverlay({ image, productName, loadingLabel }: { image?: string; productName: string; loadingLabel: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <FallbackMedia image={image} productName={productName} className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="relative flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2" aria-hidden="true" />
        <p className="text-sm font-medium text-white">{loadingLabel}</p>
      </div>
    </div>
  );
}

/**
 * Render-level (not suspense-level) WebGL errors (device capabilities,
 * WebGL context loss) bubble to this boundary, which switches to the image.
 */
class ViewportErrorBridge extends Component<{ children: React.ReactNode; onError: () => void }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
