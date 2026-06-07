import { useEffect, useRef, useState } from "react";

// Animates a number from its previous value up to `target` with an ease-out
// curve. Counts up from 0 on first mount and re-animates whenever the target
// changes (e.g. switching Day/Week/Month). Honors prefers-reduced-motion by
// snapping straight to the value. Returns the live numeric value to format.
export function useCountUp(target, duration = 650) {
  const to = Number(target) || 0;
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const from = fromRef.current;
    if (prefersReduced || from === to) {
      fromRef.current = to;
      setValue(to);
      return undefined;
    }

    let startTs;
    const step = (ts) => {
      if (startTs === undefined) startTs = ts;
      const progress = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [to, duration]);

  return value;
}
