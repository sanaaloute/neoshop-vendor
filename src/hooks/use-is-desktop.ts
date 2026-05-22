"use client";

import { useEffect, useState } from "react";

const DESKTOP_BREAKPOINT = 1024;

export function useIsDesktop(breakpoint = DESKTOP_BREAKPOINT) {
  const [desktop, setDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    setDesktop(mq.matches);
    const fn = () => setDesktop(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [breakpoint]);

  return desktop;
}
