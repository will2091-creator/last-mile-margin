import React from "react";

export default function TeamModal({
  isDark,
  isTeamModalOpen,
  setIsTeamModalOpen,
  teamDraft,
  teamSaveStatus,
  activeSetupStep,
  openNextSetupStep,
  skipSetupStep,
  saveQuickTeam,
  updateTeamDraft,
  titleText,
  mutedText,
  rowBorder,
  modalInputClass,
  setActiveTab,
}) {
  if (!isTeamModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={saveQuickTeam}
        className={isDark ? "w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">New team</p>
            <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Add team info</h2>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
              Add the first crew, truck, and route assignment. This updates the dashboard and Operations team readiness.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTeamModalOpen(false)}
            className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Team Name", "name", "Team A"],
            ["Driver / Lead", "lead", "Driver name"],
            ["Helper", "helper", "Helper name"],
            ["Truck", "truck", "Truck number"],
            ["Route", "route", "Route or contract"],
          ].map(([label, key, placeholder]) => (
            <label key={key} className={key === "route" ? "md:col-span-2" : ""}>
              <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</span>
              <input
                value={teamDraft[key]}
                onChange={(event) => updateTeamDraft(key, event.target.value)}
                placeholder={placeholder}
                className={modalInputClass}
                autoFocus={key === "name"}
              />
            </label>
          ))}
        </div>

        <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            {teamSaveStatus ? (
              <p className={teamSaveStatus.includes("saved") ? "text-sm font-black text-emerald-700" : "text-sm font-black text-red-600"}>{teamSaveStatus}</p>
            ) : (
              <p className={`text-sm font-semibold ${mutedText}`}>Teams start with missing photo proof until they upload from the field app.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {teamSaveStatus.includes("saved") && (
              <>
                {activeSetupStep === "team" && (
                  <button
                    type="button"
                    onClick={() => openNextSetupStep("team")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                  >
                    Next: Set Expenses
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsTeamModalOpen(false);
                    setActiveTab("Operations");
                  }}
                  className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                >
                  Open Operations
                </button>
              </>
            )}
            {activeSetupStep === "team" && !teamSaveStatus.includes("saved") && (
              <button
                type="button"
                onClick={() => {
                  setIsTeamModalOpen(false);
                  skipSetupStep("team");
                }}
                className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Skip For Now
              </button>
            )}
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
              Save Team
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
