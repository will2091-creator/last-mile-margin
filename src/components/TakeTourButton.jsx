import React from "react";
import { Sparkles } from "../shared";

export default function TakeTourButton({
  onClick,
  isDark = false,
  variant = "secondary",
  className = "",
  label = "Take a Tour",
}) {
  const baseClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-blue-500/20";
  const variantClass =
    variant === "primary"
      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
      : isDark
        ? "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
        : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50";

  return (
    <button type="button" onClick={onClick} className={`${baseClass} ${variantClass} ${className}`}>
      <Sparkles className="h-4 w-4" />
      {label}
    </button>
  );
}
