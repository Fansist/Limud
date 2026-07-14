/**
 * v18 premium motion primitives — shared Framer Motion variants.
 *
 * Design rules baked in (ECC web/design-quality + ui-ux-pro-max motion tier):
 * - Compositor-only: every variant animates ONLY transform + opacity.
 * - ease-out-expo for entrances (decelerate hard = expensive feel).
 * - Subtle distances (12–20px) and short durations (240–400ms) — "don't overdo it".
 * - Stagger children 40ms apart for a designed, sequential reveal.
 *
 * Motion posture: this product runs <MotionConfig reducedMotion="never"> — motion
 * is a wanted part of the experience and plays for everyone. Every variant here
 * is transform/opacity only, so it stays cheap and compositor-friendly regardless.
 */
import type { Variants, Transition } from 'framer-motion';

// Cubic-bezier control points as a fixed 4-tuple (framer's Easing shape).
// Annotating as Transition['ease'] widens the literal to number[], which
// fails strict assignment — the explicit tuple type is what type-checks.
const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Spring token for INTERACTIONS (hover / press). A spring settles physically —
// it reads as "responsive control" where a fixed-duration tween reads as
// "mechanical". Entrances stay on the easeOutExpo tween above; springs are for
// things the user directly touches.
const springSnappy: Transition = { type: 'spring', stiffness: 380, damping: 26, mass: 0.6 };

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

/** Larger rise for whole-section reveals — a touch more travel so the
 *  scroll reveal is felt, without being showy. */
export const fadeUpLg: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOutExpo },
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

/**
 * Mount-triggered staggered reveal (parent gets this, children get variants).
 *
 * Use INSTEAD of `revealGroup` when the content MUST become visible even if an
 * IntersectionObserver-based scroll trigger never fires. In production under
 * `prefers-reduced-motion`, `whileInView` reveals proved unreliable and left
 * whole sections stuck at `opacity:0` (the "blank below the hero" bug). This
 * variant animates on MOUNT — the same trigger the always-visible hero uses — so
 * the reveal is guaranteed. Below-the-fold groups simply finish their stagger
 * before they're scrolled into view. Reduced-motion users still get the opacity
 * fade because <MotionConfig reducedMotion="user"> only strips the transforms.
 */
export const revealGroupOnMount = {
  initial: 'hidden' as const,
  animate: 'show' as const,
  variants: staggerContainer,
};

/** Tasteful press feedback for interactive cards/buttons. Spring-driven so the
 *  lift feels physical (it settles rather than just easing). Transform-only. */
export const pressable = {
  whileHover: { y: -4, transition: springSnappy },
  whileTap: { scale: 0.97, transition: springSnappy },
};
