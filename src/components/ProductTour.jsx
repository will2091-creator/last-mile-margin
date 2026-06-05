import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { productTourSteps } from "./productTourSteps";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function findStepElement(step) {
  if (typeof document === "undefined") return null;
  let fallback = null;
  for (const selector of step.selectors || []) {
    const elements = Array.from(document.querySelectorAll(selector));
    const visibleElement = elements.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (visibleElement) return visibleElement;
    if (!fallback && elements[0]) fallback = elements[0];
  }
  return fallback;
}

function getElementRect(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

export default function ProductTour({ isOpen, isDark = false, onFinish, onSkip, onNavigate }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const tooltipRef = useRef(null);
  const step = productTourSteps[stepIndex] || productTourSteps[0];
  const isLastStep = stepIndex === productTourSteps.length - 1;

  const updateTargetRect = () => {
    const element = findStepElement(step);
    setTargetRect(getElementRect(element));
  };

  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    onNavigate?.(step.tab);

    const scrollTimer = window.setTimeout(() => {
      const element = findStepElement(step);
      if (element) {
        element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      }
    }, 90);
    const frame = window.requestAnimationFrame(updateTargetRect);
    const timer = window.setTimeout(updateTargetRect, 360);
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.clearTimeout(scrollTimer);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onSkip?.();
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        if (isLastStep) onFinish?.();
        else setStepIndex((current) => Math.min(current + 1, productTourSteps.length - 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => tooltipRef.current?.focus(), 50);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLastStep, onFinish, onSkip]);

  const tooltipPosition = useMemo(() => {
    if (typeof window === "undefined") return {};

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(390, viewportWidth - 32);
    const estimatedHeight = 300;

    if (!targetRect) {
      return {
        width: tooltipWidth,
        left: (viewportWidth - tooltipWidth) / 2,
        top: Math.max(24, (viewportHeight - estimatedHeight) / 2),
      };
    }

    const aboveTop = targetRect.top - estimatedHeight - 18;
    const belowTop = targetRect.bottom + 18;
    const top = belowTop + estimatedHeight < viewportHeight - 16 ? belowTop : Math.max(16, aboveTop);
    const left = clamp(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, 16, viewportWidth - tooltipWidth - 16);

    return { width: tooltipWidth, left, top };
  }, [targetRect, stepIndex]);

  if (!isOpen || typeof document === "undefined") return null;

  const highlightStyle = targetRect
    ? {
        top: targetRect.top - 8,
        left: targetRect.left - 8,
        width: targetRect.width + 16,
        height: targetRect.height + 16,
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
      }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-auto">
      {targetRect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[22px] border-2 border-white bg-transparent transition-all duration-200"
          style={highlightStyle}
        />
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-slate-950/60" />
      )}

      <div
        ref={tooltipRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={`${step.title}. Step ${stepIndex + 1} of ${productTourSteps.length}`}
        className={
          isDark
            ? "pointer-events-auto fixed rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl shadow-black/40 outline-none"
            : "pointer-events-auto fixed rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl shadow-slate-950/25 outline-none"
        }
        style={tooltipPosition}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className={isDark ? "rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-200" : "rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"}>
            Step {stepIndex + 1} of {productTourSteps.length}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className={isDark ? "rounded-lg px-2 py-1 text-xs font-black text-slate-300 hover:bg-white/10" : "rounded-lg px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100"}
          >
            Skip
          </button>
        </div>

        <h2 className="text-xl font-black leading-tight">{step.title}</h2>
        <p className={isDark ? "mt-3 text-sm font-semibold leading-6 text-slate-300" : "mt-3 text-sm font-semibold leading-6 text-slate-600"}>
          {targetRect || !step.fallback ? step.description : step.fallback}
        </p>

        {!targetRect && step.fallback && (
          <p className={isDark ? "mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-slate-400" : "mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500"}>
            This step is shown as a centered note because the matching section is not visible on this screen.
          </p>
        )}

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${((stepIndex + 1) / productTourSteps.length) * 100}%` }}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
            className={
              stepIndex === 0
                ? "rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-300"
                : isDark
                  ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10"
                  : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
            }
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => (isLastStep ? onFinish?.() : setStepIndex((current) => Math.min(current + 1, productTourSteps.length - 1)))}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
          >
            {isLastStep ? "Finish Tour" : step.nextLabel || "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
