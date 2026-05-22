import type { Variants } from "framer-motion";

/**
 * Framer Motion + Next.js SSR: use `initial={false}` on `motion.*` that render on
 * the server so the first client paint matches HTML (avoids hydration warnings).
 */

/** Subtle enter for cards, rows, and panels */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
};
