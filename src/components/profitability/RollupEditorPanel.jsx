import React from "react";
import { currency } from "../../shared";

export default function RollupEditorPanel({
  isDark,
  editingRollupRow,
  rollupEditorRef,
  rollupEditorPosition,
  mutedText,
  rowBorder,
  signedNumberClass,
  draftTotalsPanelClass,
  draftTotalsBorderClass,
  closeRollupEditor,
  updateRollupDraft,
  saveRollupDraft,
}) {
  if (!editingRollupRow) return null;

  return (
    <div
      ref={rollupEditorRef}
      className="fixed z-50 w-[min(720px,calc(100vw-2rem))]"
      style={{
        left: `${rollupEditorPosition?.left ?? 16}px`,
        top: `${rollupEditorPosition?.top ?? 96}px`,
        width: `${rollupEditorPosition?.width ?? 720}px`,
      }}
    >
      <div
        className={isDark ? "overflow-y-auto rounded-2xl border border-blue-500/25 bg-slate-950/95 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl" : "overflow-y-auto rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/60 backdrop-blur-xl"}
        style={{ maxHeight: `${rollupEditorPosition?.maxHeight ?? 640}px` }}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black ${editingRollupRow.logoClass}`}>
              {editingRollupRow.logo}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Edit Contract</p>
                <span className={isDark ? "rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-200" : "rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"}>
                  Draft totals
                </span>
              </div>
              <input
                value={editingRollupRow.contract}
                onChange={(event) => updateRollupDraft("contract", event.target.value)}
                className={isDark ? "mt-1 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-lg font-bold text-white outline-none focus:border-blue-500" : "mt-1 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-lg font-bold text-slate-950 outline-none focus:border-blue-500"}
              />
            </div>
          </div>
          <button
            onClick={closeRollupEditor}
            className={isDark ? "rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15" : "rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"}
          >
            Cancel
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Revenue", "revenue"],
              ["Labor", "labor"],
              ["Fuel", "fuel"],
              ["Truck / Insurance", "truckInsurance"],
              ["Maintenance", "maintenance"],
              ["Other Costs", "other"],
              ["Claims", "claims"],
              ["Routes / Week", "routes"],
              ["Stops / Week", "stops"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>{label}</label>
                <input
                  type="number"
                  value={editingRollupRow[key]}
                  onChange={(event) => updateRollupDraft(key, event.target.value)}
                  className={isDark ? "w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm font-black text-white outline-none focus:border-blue-500" : "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-950 outline-none focus:border-blue-500"}
                />
              </div>
            ))}
          </div>

          <div className={draftTotalsPanelClass(editingRollupRow.netProfit)}>
            <p className={`text-sm font-black ${mutedText}`}>Net Profit</p>
            <p className={`mt-2 text-3xl font-black ${signedNumberClass(editingRollupRow.netProfit)}`}>{currency.format(editingRollupRow.netProfit)}</p>
            <p className={`mt-5 text-sm font-black ${mutedText}`}>Margin %</p>
            <p className={`mt-2 text-3xl font-black ${signedNumberClass(editingRollupRow.margin)}`}>
              {editingRollupRow.margin.toFixed(2)}%
            </p>
            <div className={`mt-5 border-t pt-4 text-sm ${draftTotalsBorderClass(editingRollupRow.netProfit)}`}>
              <p>Total costs: <span className="font-black">{currency.format(editingRollupRow.totalCosts)}</span></p>
              <p className="mt-2">Routes: <span className="font-black">{editingRollupRow.routes}</span></p>
              <p className="mt-2">Stops: <span className="font-black">{editingRollupRow.stops}</span></p>
            </div>
          </div>
        </div>

        <div className={`mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${rowBorder}`}>
          <p className={`text-sm ${mutedText}`}>
            Review the draft totals, then save to update the table.
          </p>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={closeRollupEditor}
              className={isDark ? "rounded-xl bg-white/10 px-5 py-2.5 text-sm font-black text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveRollupDraft}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
