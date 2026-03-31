'use client';

import { useEffect, useState, createContext, useContext, useCallback, memo, useMemo } from 'react';

// ─── DEVICE CAPABILITY DETECTION ─────────────────────────────────────────

type DeviceTier = 'high' | 'medium' | 'low';

function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'high';
  const nav = navigator as any;
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const conn = nav.connection;
  const slow = conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.saveData);
  
  if (cores <= 2 || memory <= 2 || slow) return 'low';
  if (cores <= 4 || memory <= 4) return 'medium';
  return 'high';
}

// ─── PERFORMANCE CONTEXT ─────────────────────────────────────────────────

interface PerfConfig {
  tier: DeviceTier;
  liteMode: boolean;
  enableAnimations: boolean;
  enableParticles: boolean;
  enableBlur: boolean;
  prefersReducedMotion: boolean;
  toggleLiteMode: () => void;
}

const PerfContext = createContext<PerfConfig>({
  tier: 'high',
  liteMode: false,
  enableAnimations: true,
  enableParticles: true,
  enableBlur: true,
  prefersReducedMotion: false,
  toggleLiteMode: () => {},
});

export function usePerf() {
  return useContext(PerfContext);
}

export function PerfProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Omit<PerfConfig, 'toggleLiteMode'>>({
    tier: 'high',
    liteMode: false,
    enableAnimations: true,
    enableParticles: true,
    enableBlur: true,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    const tier = detectDeviceTier();
    const savedLite = localStorage.getItem('limud-lite-mode') === 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const liteMode = savedLite || tier === 'low';
    setConfig({
      tier,
      liteMode,
      enableAnimations: !liteMode && !reducedMotion,
      enableParticles: tier === 'high' && !liteMode,
      enableBlur: tier !== 'low',
      prefersReducedMotion: reducedMotion,
    });

    // Preconnect to critical CDN origins
    const origins = ['https://fonts.gstatic.com', 'https://fonts.googleapis.com'];
    origins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Register service worker for offline caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const toggleLiteMode = useCallback(() => {
    setConfig(prev => {
      const newLite = !prev.liteMode;
      localStorage.setItem('limud-lite-mode', String(newLite));
      return {
        ...prev,
        liteMode: newLite,
        enableAnimations: !newLite && !prev.prefersReducedMotion,
        enableParticles: prev.tier === 'high' && !newLite,
        enableBlur: !newLite,
      };
    });
  }, []);

  const value = useMemo(() => ({ ...config, toggleLiteMode }), [config, toggleLiteMode]);

  return (
    <PerfContext.Provider value={value}>
      {children}
    </PerfContext.Provider>
  );
}

// ─── SKELETON LOADERS (optimized with memo) ─────────────────────────────

export const SkeletonCard = memo(function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
});

export const SkeletonDashboard = memo(function SkeletonDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-40 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-2xl bg-gray-100 dark:bg-gray-800 h-24 animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
});

export const SkeletonList = memo(function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});

// ─── LAZY COMPONENT WRAPPER (Intersection Observer) ─────────────────────

export function LazySection({ children, className, fallback }: {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const { enableAnimations } = usePerf();

  useEffect(() => {
    if (!enableAnimations) { setIsVisible(true); return; }
  }, [enableAnimations]);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node || isVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '100px', threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  if (!isVisible) {
    return <div ref={ref} className={className}>{fallback || <SkeletonCard />}</div>;
  }

  return (
    <div className={className} style={{
      animation: enableAnimations ? 'fadeSlideUp 0.4s ease-out' : 'none',
    }}>
      {children}
    </div>
  );
}

export function LazyMotion({ children, className, delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { enableAnimations } = usePerf();
  const [visible, setVisible] = useState(!enableAnimations);

  useEffect(() => {
    if (!enableAnimations) { setVisible(true); return; }
    const t = setTimeout(() => setVisible(true), delay * 100);
    return () => clearTimeout(t);
  }, [enableAnimations, delay]);

  if (!enableAnimations) return <div className={className}>{children}</div>;

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {children}
    </div>
  );
}

// ─── HAPTIC FEEDBACK (mobile) ────────────────────────────────────────────

export function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator === 'undefined') return;
  if ('vibrate' in navigator) {
    const durations = { light: 10, medium: 20, heavy: 40 };
    navigator.vibrate(durations[style]);
  }
}

// ─── PROGRESS RING ───────────────────────────────────────────────────────

export const ProgressRing = memo(function ProgressRing({ progress, size = 40, stroke = 3, color = '#6366f1' }: {
  progress: number; size?: number; stroke?: number; color?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
});

// ─── MASTERY ANIMATION ──────────────────────────────────────────────────

export function MasteryBurst({ level, show }: { level: number; show: boolean }) {
  const { enableAnimations } = usePerf();
  if (!show || !enableAnimations) return null;

  const particles = level >= 80 ? 12 : level >= 60 ? 8 : 4;
  const color = level >= 80 ? '#22c55e' : level >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: particles }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            left: '50%',
            top: '50%',
            animation: `masteryBurst 0.8s ease-out ${i * 0.05}s forwards`,
            '--angle': `${(360 / particles) * i}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── XP GAIN MICRO-ANIMATION ─────────────────────────────────────────────

export function XPGainToast({ amount, show }: { amount: number; show: boolean }) {
  const { enableAnimations } = usePerf();
  if (!show) return null;

  return (
    <div
      className="fixed bottom-24 right-6 z-50 pointer-events-none"
      style={{
        animation: enableAnimations ? 'xpFloat 1.5s ease-out forwards' : 'none',
      }}
    >
      <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-purple-500/30">
        +{amount} XP ⚡
      </div>
    </div>
  );
}

// ─── CACHED FETCH HELPER ────────────────────────────────────────────────

const fetchCache = new Map<string, { data: any; expiry: number }>();

export async function cachedFetch(url: string, ttlMs: number = 30000): Promise<any> {
  const cached = fetchCache.get(url);
  if (cached && cached.expiry > Date.now()) return cached.data;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();
  
  fetchCache.set(url, { data, expiry: Date.now() + ttlMs });
  // Cap cache size
  if (fetchCache.size > 50) {
    const firstKey = fetchCache.keys().next().value;
    if (firstKey) fetchCache.delete(firstKey);
  }
  
  return data;
}

// ─── DEBOUNCED SEARCH HOOK ──────────────────────────────────────────────

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── INTERSECTION OBSERVER HOOK ─────────────────────────────────────────

export function useInView(options?: IntersectionObserverInit) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '50px', ...options }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return { ref: setRef, inView };
}

// ─── CORE WEB VITALS TRACKING (v10.0) ─────────────────────────────────

interface WebVitalsEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function reportWebVitals() {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  // LCP — Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      if (lastEntry) {
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        const rating = lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor';
        logVital({ name: 'LCP', value: Math.round(lcp), rating });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}

  // FID — First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        const rating = fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor';
        logVital({ name: 'FID', value: Math.round(fid), rating });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {}

  // CLS — Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      const rating = clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor';
      logVital({ name: 'CLS', value: Math.round(clsValue * 1000) / 1000, rating });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {}

  // INP — Interaction to Next Paint (replaces FID in modern browsers)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const inp = entry.duration;
        const rating = inp < 200 ? 'good' : inp < 500 ? 'needs-improvement' : 'poor';
        logVital({ name: 'INP', value: Math.round(inp), rating });
      }
    });
    inpObserver.observe({ type: 'event', buffered: true });
  } catch {}
}

function logVital(vital: WebVitalsEntry) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${vital.name}: ${vital.value}ms (${vital.rating})`);
  }

  // Send to analytics endpoint (fire-and-forget)
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify({
        type: 'web_vital',
        ...vital,
        url: window.location.pathname,
        timestamp: Date.now(),
      }));
    }
  } catch {}
}

// Auto-init on module load
if (typeof window !== 'undefined') {
  // Wait for load to capture accurate LCP
  if (document.readyState === 'complete') {
    reportWebVitals();
  } else {
    window.addEventListener('load', reportWebVitals, { once: true });
  }
}
