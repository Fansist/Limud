/**
 * v18 premium motion primitives — shared Framer Motion variants.
 *
 * Design rules baked in (ECC web/design-quality + ui-ux-pro-max motion tier):
 * - Compositor-only: every variant animates ONLY transform + opacity.
 * - ease-out-expo for entrances (decelerate hard = expensive feel).
 * - Subtle distances (12–20px) and short durations (240–400ms) — "don't overdo it".
 * - Stagger children 40ms apart for a designed, sequential reveal.
 *
 * Reduced motion: wrap the app (or a subtree) in
 *   <MotionConfig reducedMotion="user">…</MotionConfig>
 * and Framer automatically drops transforms for users who ask for less motion.
 * These variants are transform/opacity only, so that downgrade is lossless.
 */
import type { Variants } from 'framer-motion';

// Cubic-bezier control points as a fixed 4-tuple (framer's Easing shape).
// Annotating as Transition['ease'] widens the literal to number[], which
// fails strict assignment — the explicit tuple type is what type-checks.
const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Fade + rise. Use on hero copy, section headers, single cards. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
};

/** Smaller rise for dense grids/list items. */
export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
};

/** Plain fade — for backgrounds/images where movement would distract. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: easeOutExpo } },
};

/** Gentle scale-in — for modals, badges, popovers. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: easeOutExpo },
  },
};

/**
 * Parent container that staggers its children.
 * Put this on the wrapper and give each child `variants={fadeUp}` (or fadeUpSm).
 */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.04 },
  },
};

/** Slower stagger for short hero sequences (headline → sub → CTA). */
export const staggerContainerSlow: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

/**
 * Standard scroll-reveal props. Spread onto a motion element:
 *   <motion.div {...revealOnScroll} variants={fadeUp}>…</motion.div>
 * Reveals once, when 15% enters the viewport.
 */
export const revealOnScroll = {
  initial: 'hidden' as const,
  whileInView: 'show' as const,
  viewport: { once: true, amount: 0.15 },
};

/** Same, but for a staggered group (parent gets this, children get variants). */
export const revealGroup = {
  initial: 'hidden' as const,
  whileInView: 'show' as const,
  viewport: { once: true, amount: 0.15 },
  variants: staggerContainer,
};

/** Tasteful press feedback for interactive cards/buttons (pair with whileHover). */
export const pressable = {
  whileHover: { y: -3, transition: { duration: 0.24, ease: easeOutExpo } },
  whileTap: { scale: 0.985 },
};
