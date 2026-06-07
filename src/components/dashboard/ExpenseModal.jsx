import React from "react";
import { currency } from "../../shared";

export default function ExpenseModal({
  isDark,
  isExpenseModalOpen,
  setIsExpenseModalOpen,
  expenseDraft,
  expenseSaveStatus,
  activeSetupStep,
  openNextSetupStep,
  skipSetupStep,
  saveExpenseSetup,
  updateExpenseDraft,
  quickContracts,
  titleText,
  mutedText,
  rowBorder,
  modalInputClass,
}) {
  if (!isExpenseModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={saveExpenseSetup}
        className={isDark ? "w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Expense setup</p>
            <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Set basic route costs</h2>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
              These estimates attach to {quickContracts[0]?.contract || "your first contract"} so the dashboard can calculate real margin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(false)}
            className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
          >
            Close
          </button>
        </div>

        <div className={isDark ? "mt-5 rounded-2xl border border-white/10 bg-white/5 p-4" : "mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4"}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm font-black ${titleText}`}>{quickContracts[0]?.contract || "First contract"}</p>
              <p className={`text-xs font-bold ${mutedText}`}>{quickContracts[0]?.routes || 1} route{Number(quickContracts[0]?.routes || 1) === 1 ? "" : "s"} per week</p>
            </div>
            <p className="text-sm font-black text-emerald-700">
              Revenue: {currency.format(Number(quickContracts[0]?.revenue || 0))}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Labor / Route", "labor", "Driver and helper cost"],
            ["Fuel / Route", "fuel", "Fuel estimate"],
            ["Truck + Insurance / Route", "truckInsurance", "Truck, insurance, software"],
            ["Maintenance / Route", "maintenance", "Maintenance reserve"],
            ["Other Costs / Route", "other", "Tolls, parking, misc."],
          ].map(([label, key, placeholder]) => (
            <label key={key} className={key === "other" ? "md:col-span-2" : ""}>
              <span className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>{label}</span>
              <div className="relative">
                <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseDraft[key]}
                  onChange={(event) => updateExpenseDraft(key, event.target.value)}
                  placeholder={placeholder}
                  className={`${modalInputClass} pl-7`}
                />
              </div>
            </label>
          ))}
        </div>

        <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            {expenseSaveStatus ? (
              <p className={expenseSaveStatus.includes("saved") ? "text-sm font-black text-emerald-700" : "text-sm font-black text-red-600"}>{expenseSaveStatus}</p>
            ) : (
              <p className={`text-sm font-semibold ${mutedText}`}>You can refine these later in Finance. This just gets the first dashboard numbers moving.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {expenseSaveStatus.includes("saved") && activeSetupStep === "expenses" && (
              <button
                type="button"
                onClick={() => openNextSetupStep("expenses")}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
              >
                Next: Import Data
              </button>
            )}
            {activeSetupStep === "expenses" && !expenseSaveStatus.includes("saved") && (
              <button
                type="button"
                onClick={() => {
                  setIsExpenseModalOpen(false);
                  skipSetupStep("expenses");
                }}
                className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Skip For Now
              </button>
            )}
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
              Save Expenses
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
