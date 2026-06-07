import React from "react";

export default function ContractModal({
  isDark,
  isContractModalOpen,
  setIsContractModalOpen,
  contractDraft,
  emptyContractDraft,
  setContractDraft,
  contractSaveStatus,
  setContractSaveStatus,
  activeSetupStep,
  openNextSetupStep,
  skipSetupStep,
  saveQuickContract,
  updateContractDraft,
  titleText,
  mutedText,
  rowBorder,
  modalInputClass,
  setActiveTab,
}) {
  if (!isContractModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={saveQuickContract}
        className={isDark ? "w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">New contract</p>
            <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Add contract info</h2>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
              Start with the basics. These numbers save into Finance &gt; Profitability so your dashboard can stop being empty.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsContractModalOpen(false)}
            className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label>
            <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Contract Name</span>
            <input
              name="contract"
              value={contractDraft.contract}
              onChange={(event) => updateContractDraft("contract", event.target.value)}
              placeholder="Example: Will's Delivery"
              className={modalInputClass}
              autoFocus
            />
          </label>

          <label>
            <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Routes / Week</span>
            <input
              name="routes"
              type="number"
              min="1"
              value={contractDraft.routes}
              onChange={(event) => updateContractDraft("routes", event.target.value)}
              className={modalInputClass}
            />
          </label>

          {[
            ["Route Pay", "routePay", "Revenue per route", "$"],
            ["Stops / Route", "stops", "Expected stops per route", ""],
            ["Labor / Route", "labor", "Driver and helper cost", "$"],
            ["Fuel / Route", "fuel", "Fuel estimate", "$"],
            ["Truck + Insurance / Route", "truckInsurance", "Truck, insurance, software", "$"],
            ["Maintenance / Route", "maintenance", "Maintenance reserve", "$"],
            ["Claims Reserve / Week", "claims", "Weekly claim reserve", "$"],
            ["Other Costs / Route", "other", "Tolls, parking, misc.", "$"],
          ].map(([label, key, placeholder, prefix]) => (
            <label key={key}>
              <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</span>
              <div className="relative">
                {prefix && <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>{prefix}</span>}
                <input
                  name={key}
                  type="number"
                  min="0"
                  step="0.01"
                  value={contractDraft[key]}
                  onChange={(event) => updateContractDraft(key, event.target.value)}
                  placeholder={placeholder}
                  className={`${modalInputClass} ${prefix ? "pl-7" : ""}`}
                />
              </div>
            </label>
          ))}
        </div>

        <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            {contractSaveStatus ? (
              <p className={contractSaveStatus.includes("saved") ? "text-sm font-black text-emerald-700" : "text-sm font-black text-red-600"}>{contractSaveStatus}</p>
            ) : (
              <p className={`text-sm font-semibold ${mutedText}`}>Save this contract here, then add another or open Profitability.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {contractSaveStatus.includes("saved") && (
              <>
                {activeSetupStep === "contract" && (
                  <button
                    type="button"
                    onClick={() => openNextSetupStep("contract")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                  >
                    Next: Add Team
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setContractDraft(emptyContractDraft);
                    setContractSaveStatus("");
                  }}
                  className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                >
                  Clear for Another
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsContractModalOpen(false);
                    setActiveTab("Finance");
                  }}
                  className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                >
                  Open Profitability
                </button>
              </>
            )}
            {activeSetupStep === "contract" && !contractSaveStatus.includes("saved") && (
              <button
                type="button"
                onClick={() => {
                  setIsContractModalOpen(false);
                  skipSetupStep("contract");
                }}
                className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Skip For Now
              </button>
            )}
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
              Save Contract
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
