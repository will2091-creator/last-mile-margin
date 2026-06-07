import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "../shared";
import { useTourAnchor } from "./useTourAnchor";

const CARD_WIDTH = 360;
const VIEWPORT_MARGIN = 16;
const CUTOUT_PAD = 8;
const CARD_GAP = 14;
const CARD_HEIGHT_EST = 210;

function getPrefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export default function TourOverlay({
  active,
  steps,
  stepIndex,
  isDark,
  onNext,
  onBack,
  onSkip,
  onFinish,
  navigateToTab,
}) {
  const prefersReducedMotion = useMemo(getPrefersReducedMotion, []);
  const step = active && steps ? steps[stepIndex] : null;
  const cardRef = useRef(null);

  // Navigate to the step's tab before we try to spotlight its anchor.
  useEffect(() => {
    if (!active || !step) return;
    if (step.tab) navigateToTab(step.tab);
    // Intentionally keyed on stepIndex only — re-asserting the tab when the step
    // changes; we don't want to fight a user who clicks away mid-step here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, active]);

  const { rect, resolved } = useTourAnchor({
    anchor: step?.anchor,
    fallbackAnchor: step?.fallbackAnchor,
    selector: step?.selector,
    active,
    stepIndex,
    prefersReducedMotion,
  });

  const isFinal = Boolean(step?.isFinal) || (steps && stepIndex === steps.length - 1);

  // If a step's anchor never mounts, don't get stuck — advance past it.
  useEffect(() => {
    if (!active || !resolved || rect) return;
    const t = window.setTimeout(() => (isFinal ? onFinish() : onNext()), 60);
    return () => window.clearTimeout(t);
  }, [active, resolved, rect, isFinal, onNext, onFinish]);

  // Focus the card and wire keyboard navigation.
  useEffect(() => {
    if (!active) return undefined;
    const node = cardRef.current;
    if (node) node.focus({ preventScroll: true });

    const onKey = (event) => {
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        isFinal ? onFinish() : onNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (stepIndex > 0) onBack();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, stepIndex, isFinal, onNext, onBack, onSkip, onFinish]);

  if (!active || !step) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 720;

  // Spotlight geometry (null while the anchor is still resolving).
  const sx = rect ? rect.left - CUTOUT_PAD : 0;
  const sy = rect ? rect.top - CUTOUT_PAD : 0;
  const sw = rect ? rect.width + CUTOUT_PAD * 2 : 0;
  const sh = rect ? rect.height + CUTOUT_PAD * 2 : 0;

  // Card placement: below the target if there's room, else above; centered on
  // the target horizontally and clamped to the viewport. Centered when no rect.
  let cardTop;
  let cardLeft;
  if (rect) {
    const below = sy + sh + CARD_GAP;
    const fitsBelow = below + CARD_HEIGHT_EST < vh - VIEWPORT_MARGIN;
    cardTop = fitsBelow ? below : Math.max(VIEWPORT_MARGIN, sy - CARD_GAP - CARD_HEIGHT_EST);
    cardLeft = Math.min(
      Math.max(rect.left + rect.width / 2 - CARD_WIDTH / 2, VIEWPORT_MARGIN),
      vw - CARD_WIDTH - VIEWPORT_MARGIN
    );
  } else {
    cardTop = vh / 2 - CARD_HEIGHT_EST / 2;
    cardLeft = vw / 2 - CARD_WIDTH / 2;
  }

  const dim = isDark ? "rgba(2, 6, 23, 0.74)" : "rgba(15, 23, 42, 0.55)";
  const rectTransition = prefersReducedMotion
    ? undefined
    : { transition: "x 0.3s ease, y 0.3s ease, width 0.3s ease, height 0.3s ease" };
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-card";
  const titleClass = isDark ? "text-white" : "text-slate-950";
  const bodyClass = isDark ? "text-slate-300" : "text-slate-600";
  const motionProps = prefersReducedMotion
    ? { transition: { duration: 0 } }
    : { transition: { duration: 0.32, ease: "easeInOut" } };

  return (
    <div
      className="fixed inset-0 z-[120]"
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
    >
      {/* Pointer-capturing layer so the dimmed page isn't clickable. */}
      <div className="absolute inset-0" />

      {/* Spotlight: a dimmed full-screen rect with a rounded cutout over the
          target. Plain SVG rects (geometry as attributes) with a CSS transition
          — robust across browsers; motion.rect mishandles SVG x/y/width/height. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <mask id="fmm-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect x={sx} y={sy} width={sw} height={sh} rx="16" ry="16" fill="black" style={rectTransition} />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill={dim} mask="url(#fmm-tour-mask)" />
        {rect && (
          <rect
            x={sx}
            y={sy}
            width={sw}
            height={sh}
            rx="16"
            ry="16"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            style={rectTransition}
          />
        )}
      </svg>

      {/* Tooltip card */}
      <motion.div
        ref={cardRef}
        tabIndex={-1}
        key={step.id}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionProps.transition}
        style={{ position: "absolute", top: cardTop, left: cardLeft, width: CARD_WIDTH }}
        className={`${cardClass} outline-none`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
          Step {stepIndex + 1} of {steps.length}
        </p>
        <h2 className={`mt-1 text-lg font-black leading-tight ${titleClass}`}>{step.title}</h2>
        <p className={`mt-2 text-sm font-semibold leading-6 ${bodyClass}`}>{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSkip}
            className={`text-xs font-bold ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="secondary" isDark={isDark} onClick={onBack} className="px-3 py-1.5 text-xs">
                Back
              </Button>
            )}
            <Button
              variant="primary"
              onClick={isFinal ? onFinish : onNext}
              className="px-3 py-1.5 text-xs"
            >
              {isFinal ? "Set up my workspace" : "Next"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
