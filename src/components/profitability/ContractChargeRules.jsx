import React from "react";
import { Trash2 } from "../../shared";

export default function ContractChargeRules({
  isDark,
  activeRouteContractName,
  activeRouteContractId,
  chargeOptions,
  chargeEnabled,
  customCharges,
  customChargeDraft,
  setCustomChargeDraft,
  updateContractChargeRule,
  updateCustomContractCharge,
  deleteCustomContractCharge,
  addCustomContractCharge,
  inputClass,
  titleText,
  mutedText,
}) {
  return (
    <div className={isDark ? "mb-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4" : "mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`text-sm font-black ${titleText}`}>Pay Types for {activeRouteContractName || "New Contract"}</p>
          <p className={`mt-1 text-xs font-semibold ${mutedText}`}>Check the charges this contract allows. Off items are hidden from Revenue.</p>
        </div>
        <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700"}>
          Contract rate card
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {chargeOptions.map(([key, label, description]) => {
          const checked = chargeEnabled(key);
          return (
            <label
              key={key}
              className={isDark ? "flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10" : "flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-200"}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => updateContractChargeRule(activeRouteContractId, key, event.target.checked)}
                className="mt-1 h-4 w-4 accent-blue-600"
              />
              <span className="min-w-0">
                <span className={`block text-sm font-black ${checked ? titleText : mutedText}`}>{label}</span>
                <span className={`mt-0.5 block text-xs leading-snug ${mutedText}`}>{description}</span>
              </span>
            </label>
          );
        })}

        {customCharges.map((charge) => (
          <div
            key={charge.id}
            className={isDark ? "rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3" : "rounded-xl border border-emerald-100 bg-emerald-50 p-3"}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={charge.enabled}
                  onChange={(event) => updateCustomContractCharge(activeRouteContractId, charge.id, "enabled", event.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className={charge.enabled ? "text-xs font-black uppercase tracking-wide text-emerald-700" : `text-xs font-black uppercase tracking-wide ${mutedText}`}>
                  Custom
                </span>
              </label>
              <button
                type="button"
                onClick={() => deleteCustomContractCharge(activeRouteContractId, charge.id)}
                className={isDark ? "rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-red-300" : "rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600"}
                title="Delete custom charge"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <input
              value={charge.name}
              onChange={(event) => updateCustomContractCharge(activeRouteContractId, charge.id, "name", event.target.value)}
              className={isDark ? "w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-black text-white outline-none focus:border-emerald-500" : "w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm font-black text-slate-950 outline-none focus:border-emerald-500"}
            />
            <div className="mt-2">
              <label className={`mb-1 block text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Amount</label>
              <div className="relative">
                <span className={`absolute left-3 top-2 text-sm font-black ${mutedText}`}>$</span>
                <input
                  type="number"
                  value={charge.amount}
                  onChange={(event) => updateCustomContractCharge(activeRouteContractId, charge.id, "amount", event.target.value)}
                  className={isDark ? "w-full rounded-lg border border-white/10 bg-slate-950/60 py-2 pl-7 pr-3 text-sm font-black text-white outline-none focus:border-emerald-500" : "w-full rounded-lg border border-emerald-100 bg-white py-2 pl-7 pr-3 text-sm font-black text-slate-950 outline-none focus:border-emerald-500"}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={isDark ? "mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4" : "mt-4 rounded-2xl border border-slate-200 bg-white p-4"}>
        <div className="mb-3">
          <p className={`text-sm font-black ${titleText}`}>Add Custom Charge</p>
          <p className={`mt-1 text-xs font-semibold ${mutedText}`}>Example: stairs fee, disposal, premium install, weekend delivery.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_150px_auto]">
          <input
            value={customChargeDraft.name}
            onChange={(event) => setCustomChargeDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Charge name"
            className={inputClass}
          />
          <div className="relative">
            <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>$</span>
            <input
              type="number"
              value={customChargeDraft.amount}
              onChange={(event) => setCustomChargeDraft((current) => ({ ...current, amount: event.target.value }))}
              placeholder="0"
              className={isDark ? "w-full rounded-xl border border-white/10 bg-slate-950/70 py-2 pl-7 pr-3 text-sm font-bold text-white outline-none focus:border-blue-500" : "w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-500"}
            />
          </div>
          <button
            type="button"
            onClick={() => addCustomContractCharge(activeRouteContractId)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
          >
            + Add Charge
          </button>
        </div>
      </div>
    </div>
  );
}
