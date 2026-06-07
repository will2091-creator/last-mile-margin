import { useEffect, useRef, useState } from "react";

// How long to wait for a step's target element to mount before giving up.
// Pages are lazy-loaded behind <Suspense>, so an anchor can take a few frames
// to appear after a tab switch.
const POLL_BUDGET_MS = 1800;

// Resolves the viewport rect of the current step's `[data-tour]` target,
// scrolling it into view and keeping the rect fresh on resize/scroll/layout
// changes. Returns { rect, resolved }: `resolved` flips true once the element
// is found (rect set) OR the budget expires (rect stays null so the overlay can
// auto-advance past a step whose anchor never mounts).
export function useTourAnchor({ anchor, fallbackAnchor, active, stepIndex, prefersReducedMotion }) {
  const [rect, setRect] = useState(null);
  const [resolved, setResolved] = useState(false);
  const elRef = useRef(null);

  // Find + measure the target whenever the step changes.
  useEffect(() => {
    if (!active) {
      elRef.current = null;
      setRect(null);
      setResolved(false);
      return undefined;
    }

    let cancelled = false;
    let rafId = null;
    let timerId = null;
    const start = performance.now();

    const find = () =>
      document.querySelector(`[data-tour="${anchor}"]`) ||
      (fallbackAnchor ? document.querySelector(`[data-tour="${fallbackAnchor}"]`) : null);

    const measure = (el) => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const tick = () => {
      if (cancelled) return;
      const el = find();
      if (el) {
        elRef.current = el;
        el.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
        // Let the (possibly smooth) scroll settle before measuring.
        timerId = window.setTimeout(() => {
          if (cancelled || !elRef.current) return;
          measure(elRef.current);
          setResolved(true);
        }, prefersReducedMotion ? 0 : 260);
        return;
      }
      if (performance.now() - start > POLL_BUDGET_MS) {
        elRef.current = null;
        setRect(null);
        setResolved(true); // budget expired — overlay auto-advances
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    setRect(null);
    setResolved(false);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, [anchor, fallbackAnchor, active, stepIndex, prefersReducedMotion]);

  // Keep the rect glued to the target as the layout settles, scrolls, or resizes.
  useEffect(() => {
    if (!active || !resolved || !elRef.current) return undefined;

    let rafId = null;
    const recompute = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!elRef.current) return;
        const r = elRef.current.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      });
    };

    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    const observer = new ResizeObserver(recompute);
    observer.observe(elRef.current);

    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [active, stepIndex, resolved]);

  return { rect, resolved };
}

export default useTourAnchor;
