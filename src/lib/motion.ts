import type { Variants, Transition } from "framer-motion";

/**
 * Framer Motion + Next.js SSR: use `initial={false}` on `motion.*` that render on
 * the server so the first client paint matches HTML (avoids hydration warnings).
 */

const easeOutExpo: Transition["ease"] = [0.22, 1, 0.36, 1];
const easeOutBack: Transition["ease"] = [0.34, 1.56, 0.64, 1];
const easeInOutQuart: Transition["ease"] = [0.76, 0, 0.24, 1];

/** Subtle enter for cards, rows, and panels */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: easeOutBack },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

export const staggerContainerFast: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.28, ease: easeOutExpo },
  },
};

/** For list items with slide + fade */
export const listItem: Variants = {
  hidden: { opacity: 0, x: -8, y: 6 },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
};

/** For page-level content wrapper */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: easeInOutQuart },
  },
};

/** For modal/dialog overlays */
export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.25, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: easeInOutQuart },
  },
};

/** For hover lift effect on cards */
export const hoverLift = {
  rest: { y: 0, boxShadow: "0 1px 1px rgba(0,0,0,0.08), 0 22px 52px rgba(0,0,0,0.42)" },
  hover: {
    y: -4,
    boxShadow: "0 1px 1px rgba(0,0,0,0.1), 0 28px 60px rgba(0,0,0,0.5)",
    transition: { duration: 0.3, ease: easeOutExpo },
  },
};

/** Shimmer loading animation */
export const shimmerWave: Variants = {
  hidden: { backgroundPosition: "-200% 0" },
  show: {
    backgroundPosition: "200% 0",
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  },
};
