'use client';

/**
 * Aurora — a soft, brand-tinted mesh-gradient atmosphere.
 *
 * Purpose (taste skill §4.8 "hero needs a real visual" + §10 "Mesh Gradient
 * Background"): replaces flat-white backgrounds that read as template-default.
 * Uses Limud's OWN brand hues (blue #3b82f6 + a restrained fuchsia #d946ef),
 * desaturated and soft — NOT the banned "AI-purple slop" (taste §4.2 Lila Rule),
 * because these are the product's real brand colors used with intent.
 *
 * Performance/a11y:
 * - Pure CSS layered radial gradients + a slow transform drift. Compositor-only
 *   (transform/opacity), pointer-events-none, GPU-friendly (taste §6.A/§6.E).
 * - Drift animation is gated behind prefers-reduced-motion: no-preference.
 * - Absolutely positioned, sits behind content; parent should be `relative`.
 */

type AuroraProps = {
  /** Extra classes for positioning (defaults to full-bleed absolute). */
  className?: string;
  /** 0–1 overall strength. Default 0.9. Lower for dense sections. */
  intensity?: number;
};

export default function Aurora({ className = '', intensity = 0.9 }: AuroraProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
      style={{ opacity: intensity }}
    >
      {/* Blob 1 — brand blue, top-left */}
      <div
        className="aurora-blob absolute -left-[10%] -top-[20%] h-[55vh] w-[55vh] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgb(59 130 246 / 0.28), transparent 70%)',
        }}
      />
      {/* Blob 2 — restrained fuchsia, right */}
      <div
        className="aurora-blob absolute right-[-8%] top-[6%] h-[48vh] w-[48vh] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgb(217 70 239 / 0.18), transparent 70%)',
          animationDelay: '-6s',
        }}
      />
      {/* Blob 3 — soft indigo, lower-center, anchors the composition */}
      <div
        className="aurora-blob absolute left-[30%] top-[40%] h-[50vh] w-[50vh] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgb(99 102 241 / 0.16), transparent 70%)',
          animationDelay: '-12s',
        }}
      />
      {/* Fine grain to kill gradient banding (fixed, non-scrolling) */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
