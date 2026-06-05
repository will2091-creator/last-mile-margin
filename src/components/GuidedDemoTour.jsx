import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { guidedDemoSteps } from "./guidedDemoContent";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function findTarget(selector) {
  if (typeof document === "undefined" || !selector) return null;
  let fallback = null;
  for (const option of selector.split(",")) {
    const elements = Array.from(document.querySelectorAll(option.trim()));
    const visibleElement = elements.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (visibleElement) return visibleElement;
    if (!fallback && elements[0]) fallback = elements[0];
  }
  return fallback;
}

function readRect(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

const clampStepIndex = (value) => Math.floor(clamp(Number(value || 0), 0, guidedDemoSteps.length - 1));

export default function GuidedDemoTour({ isOpen, isDark = false, initialStepIndex = 0, onClose, onComplete, onNavigate, onStepChange }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const panelRef = useRef(null);
  const step = guidedDemoSteps[stepIndex] || guidedDemoSteps[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === guidedDemoSteps.length - 1;
  const percent = Math.round(((stepIndex + 1) / guidedDemoSteps.length) * 100);

  const updateTarget = () => {
    const element = findTarget(step.selector);
    setTargetRect(readRect(element));
  };

  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(clampStepIndex(initialStepIndex));
  }, [isOpen, initialStepIndex]);

  useEffect(() => {
    if (!isOpen) return;
    onStepChange?.(stepIndex, step.id);
  }, [isOpen, stepIndex, step.id, onStepChange]);

  useEffect(() => {
    if (!isOpen) return undefined;

    onNavigate?.(step.tab);
    const scrollTimer = window.setTimeout(() => {
      const element = findTarget(step.selector);
      element?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }, 80);
    const measureTimer = window.setTimeout(updateTarget, 320);
    const frame = window.requestAnimationFrame(updateTarget);

    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(measureTimer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        if (isLast) onComplete?.();
        else setStepIndex((current) => Math.min(current + 1, guidedDemoSteps.length - 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => panelRef.current?.focus(), 60);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLast, onClose, onComplete]);

  const panelPosition = useMemo(() => {
    if (typeof window === "undefined") return {};
    const width = Math.min(460, window.innerWidth - 32);
    const estimatedHeight = step.walkthrough?.length ? 640 : 560;

    if (!targetRect) {
      return {
        width,
        left: (window.innerWidth - width) / 2,
        top: Math.max(18, (window.innerHeight - estimatedHeight) / 2),
      };
    }

    const rightSpace = window.innerWidth - targetRect.right;
    const leftSpace = targetRect.left;
    const useRight = rightSpace >= width + 32 || rightSpace >= leftSpace;
    const left = useRight
      ? clamp(targetRect.right + 18, 16, window.innerWidth - width - 16)
      : clamp(targetRect.left - width - 18, 16, window.innerWidth - width - 16);
    const top = clamp(targetRect.top + targetRect.height / 2 - estimatedHeight / 2, 16, Math.max(16, window.innerHeight - estimatedHeight - 16));

    return { width, left, top };
  }, [targetRect, stepIndex]);

  if (!isOpen || typeof document === "undefined") return null;

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-300" : "text-slate-600";
  const panelClass = isDark
    ? "pointer-events-auto fixed max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl shadow-black/50 outline-none"
    : "pointer-events-auto fixed max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl shadow-slate-950/25 outline-none";
  const highlightStyle = targetRect
    ? {
        top: targetRect.top - 8,
        left: targetRect.left - 8,
        width: targetRect.width + 16,
        height: targetRect.height + 16,
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.62)",
      }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[1100] pointer-events-auto">
      {targetRect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[22px] border-2 border-blue-300 bg-transparent transition-all duration-200"
          style={highlightStyle}
        />
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-slate-950/65" />
      )}

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={`${step.title}. Guided demo step ${stepIndex + 1} of ${guidedDemoSteps.length}`}
        className={panelClass}
        style={panelPosition}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={isDark ? "text-xs font-black uppercase tracking-[0.18em] text-blue-200" : "text-xs font-black uppercase tracking-[0.18em] text-blue-700"}>
              Interactive Demo
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={isDark ? "rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-100" : "rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"}>
                {step.eyebrow}
              </span>
              <span className={isDark ? "rounded-full bg-white/5 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
                {percent}% complete
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip demo"
            className={isDark ? "rounded-xl p-2 text-slate-300 hover:bg-white/10" : "rounded-xl p-2 text-slate-500 hover:bg-slate-100"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={isDark ? "mt-5 h-2 overflow-hidden rounded-full bg-white/10" : "mt-5 h-2 overflow-hidden rounded-full bg-slate-100"}>
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
        </div>

        <h2 className={`mt-5 text-2xl font-black leading-tight ${titleText}`}>{step.title}</h2>
        <p className={`mt-3 text-sm font-semibold leading-6 ${mutedText}`}>{step.lesson}</p>

        <div className={isDark ? "mt-4 rounded-2xl border border-white/10 bg-white/5 p-4" : "mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
          <p className={isDark ? "text-xs font-black uppercase tracking-wide text-slate-400" : "text-xs font-black uppercase tracking-wide text-slate-500"}>Why it matters</p>
          <p className={`mt-1 text-sm font-bold leading-6 ${mutedText}`}>{step.why}</p>
        </div>

        <div className={isDark ? "mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4" : "mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"}>
          <p className={isDark ? "text-xs font-black uppercase tracking-wide text-emerald-200" : "text-xs font-black uppercase tracking-wide text-emerald-700"}>Demo story</p>
          <p className={isDark ? "mt-1 text-sm font-bold leading-6 text-emerald-50" : "mt-1 text-sm font-bold leading-6 text-emerald-900"}>{step.story}</p>
        </div>

        {step.walkthrough?.length > 0 && (
          <div className={isDark ? "mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4" : "mt-3 rounded-2xl border border-slate-200 bg-white p-4"}>
            <p className={isDark ? "text-xs font-black uppercase tracking-wide text-slate-400" : "text-xs font-black uppercase tracking-wide text-slate-500"}>Dashboard readout</p>
            <div className="mt-3 grid gap-2">
              {step.walkthrough.map((item, index) => (
                <div key={item} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">{index + 1}</span>
                  <p className={`text-xs font-bold leading-5 ${mutedText}`}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {step.metrics.map((metric) => (
            <span key={metric} className={isDark ? "rounded-full bg-white/5 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
              {metric}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-3" : "rounded-2xl border border-slate-200 bg-slate-50 p-3"}>
            <p className={isDark ? "text-xs font-black uppercase tracking-wide text-slate-400" : "text-xs font-black uppercase tracking-wide text-slate-500"}>What to enter</p>
            <p className={`mt-1 text-xs font-bold leading-5 ${mutedText}`}>{step.dataToEnter}</p>
          </div>
          <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-3" : "rounded-2xl border border-slate-200 bg-slate-50 p-3"}>
            <p className={isDark ? "text-xs font-black uppercase tracking-wide text-slate-400" : "text-xs font-black uppercase tracking-wide text-slate-500"}>Owner decision</p>
            <p className={`mt-1 text-xs font-bold leading-5 ${mutedText}`}>{step.ownerDecision}</p>
          </div>
        </div>

        {step.nextTab && step.nextTab !== "Complete" && (
          <div className={isDark ? "mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-slate-300" : "mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600"}>
            Next tab: {step.nextTab}
          </div>
        )}

        <div className={isDark ? "mt-4 rounded-xl bg-blue-500/10 px-3 py-2 text-sm font-black text-blue-100" : "mt-4 rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-800"}>
          Outcome: {step.outcome}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
              className={
                isFirst
                  ? "rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-300"
                  : isDark
                    ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
              }
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onClose}
              className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-300 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"}
            >
              Skip
            </button>
          </div>
          <button
            type="button"
            onClick={() => (isLast ? onComplete?.() : setStepIndex((current) => Math.min(current + 1, guidedDemoSteps.length - 1)))}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
          >
            {isLast ? (
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {step.nextLabel || "Finish Walkthrough"}</span>
            ) : (
              step.nextLabel || "Next Step"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
