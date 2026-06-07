import React from "react";
import { FileText, ShieldCheck, Upload } from "../../shared";

export default function ImportModal({
  isDark,
  isImportModalOpen,
  setIsImportModalOpen,
  importDraft,
  importSaveStatus,
  activeSetupStep,
  openNextSetupStep,
  skipSetupStep,
  saveQuickImport,
  updateImportDraft,
  titleText,
  mutedText,
  rowBorder,
  modalInputClass,
  setActiveTab,
}) {
  if (!isImportModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={saveQuickImport}
        className={isDark ? "w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">Import data</p>
            <h2 className={`mt-1 text-2xl font-black ${titleText}`}>What are you importing?</h2>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
              Start a contract document, claim email, or receipt intake from the dashboard. Claims saved here immediately update open-claim metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(false)}
            className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["Contract Document", FileText, "Rates, terms, or retailer docs"],
            ["Claim Email", ShieldCheck, "Damage, penalty, or dispute email"],
            ["Receipt", Upload, "Gas, tools, parking, or maintenance"],
          ].map(([type, Icon, note]) => (
            <button
              key={type}
              type="button"
              onClick={() => updateImportDraft("type", type)}
              className={importDraft.type === type
                ? "rounded-2xl border border-blue-500 bg-blue-600 p-4 text-left text-white shadow-lg shadow-blue-600/20"
                : isDark
                  ? "rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-slate-200 hover:bg-white/10"
                  : "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-slate-700 hover:bg-white"}
            >
              <Icon className="h-6 w-6" />
              <p className="mt-3 text-sm font-black">{type}</p>
              <p className={importDraft.type === type ? "mt-1 text-xs font-semibold text-blue-100" : `mt-1 text-xs font-semibold ${mutedText}`}>{note}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label>
            <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>
              {importDraft.type === "Receipt" ? "Vendor / Receipt Name" : importDraft.type === "Claim Email" ? "Claim Summary" : "Document Name"}
            </span>
            <input
              value={importDraft.title}
              onChange={(event) => updateImportDraft("title", event.target.value)}
              placeholder={importDraft.type === "Receipt" ? "Shell, Home Depot, Lowe's..." : importDraft.type === "Claim Email" ? "Wall damage claim email" : "Retailer rate card"}
              className={modalInputClass}
              autoFocus
            />
          </label>

          <label>
            <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>
              {importDraft.type === "Claim Email" ? "Claim Amount" : importDraft.type === "Receipt" ? "Receipt Amount" : "Estimated Value"}
            </span>
            <div className="relative">
              <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={importDraft.amount}
                onChange={(event) => updateImportDraft("amount", event.target.value)}
                placeholder="0.00"
                className={`${modalInputClass} pl-7`}
              />
            </div>
          </label>

          <label className="md:col-span-2">
            <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Notes</span>
            <textarea
              value={importDraft.notes}
              onChange={(event) => updateImportDraft("notes", event.target.value)}
              placeholder="Paste details, email text, receipt notes, or what needs to be reviewed."
              className={`${modalInputClass} min-h-28 resize-none`}
            />
          </label>
        </div>

        <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            {importSaveStatus ? (
              <p className={importSaveStatus.includes("saved") ? "text-sm font-black text-emerald-700" : "text-sm font-black text-red-600"}>{importSaveStatus}</p>
            ) : (
              <p className={`text-sm font-semibold ${mutedText}`}>Use this for quick setup. Full AI intake still lives in Intake.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {importSaveStatus.includes("saved") && (
              <>
                {activeSetupStep === "data" && (
                  <button
                    type="button"
                    onClick={() => openNextSetupStep("data")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                  >
                    Next: Preview
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setActiveTab(importDraft.type === "Claim Email" ? "Operations" : importDraft.type === "Receipt" ? "Finance" : "Intake");
                  }}
                  className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                >
                  Open Full Intake
                </button>
              </>
            )}
            {activeSetupStep === "data" && !importSaveStatus.includes("saved") && (
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  skipSetupStep("data");
                }}
                className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Skip For Now
              </button>
            )}
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
              Save Import
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
