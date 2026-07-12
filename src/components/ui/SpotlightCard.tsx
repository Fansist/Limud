'use client';

import { useRef, useCallback, type ReactNode, type ElementType } from 'react';

/**
 * SpotlightCard — a card whose border + surface catch a soft brand-tinted
 * light that follows the cursor (the Linear/Vercel "spotlight border" tell).
 *
 * taste skill §3.B compliance: the cursor position is written DIRECTLY to the
 * element's CSS custom properties (--mx/--my) via a ref inside a
 * requestAnimationFrame — NEVER React state. Zero re-renders on mouse move, so
 * it stays smooth on mobile and doesn't churn the tree. The visual itself lives
 * in `.spotlight-card` (globals.css) and degrades to a static premium edge
 * under prefers-reduced-motion / touch (no pointer = props stay at defaults).
 *
 * Drop-in: wrap any card. Pass `as` to keep semantic tags (article, a, li…).
 */
type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  /** Element/tag to render (default div). Use 'article', 'a', etc. */
  as?: ElementType;
  [key: string]: unknown;
};

export default function SpotlightCard({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: SpotlightCardProps) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);

  const handleMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (frame.current != null) return; // throttle to one write per frame
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${clientX - rect.left}px`);
      el.style.setProperty('--my', `${clientY - rect.top}px`);
    });
  }, []);

  return (
    <Tag
      ref={ref}
      onPointerMove={handleMove}
      className={`spotlight-card ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
