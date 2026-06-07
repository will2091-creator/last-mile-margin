import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, X } from "../shared";

const ToastContext = createContext(null);

// useToast() -> { toast({ title, description, tone, duration }), dismiss(id) }
// tone: "success" | "error" | "warn" | "info" (default "info")
export function useToast() {
  return useContext(ToastContext) || NOOP;
}

const NOOP = { toast: () => {}, dismiss: () => {} };

const TONES = {
  success: { Icon: CheckCircle2, ring: "text-emerald-400" },
  error: { Icon: AlertTriangle, ring: "text-red-400" },
  warn: { Icon: AlertTriangle, ring: "text-amber-400" },
  info: { Icon: ShieldCheck, ring: "text-blue-400" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "info", duration = 4000 }) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-3), { id, title, description, tone }]);
      if (duration) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 pb-28 sm:items-end sm:p-6 lg:pb-6">
        {toasts.map(({ id, title, description, tone }) => {
          const { Icon, ring } = TONES[tone] || TONES.info;
          return (
            <div
              key={id}
              role="status"
              className="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4 text-white shadow-card-hover"
            >
              <span className={`mt-0.5 shrink-0 ${ring}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black leading-snug">{title}</p>
                {description && <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-300">{description}</p>}
              </div>
              <button
                onClick={() => dismiss(id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
