import { useMemo } from "react";
import ProfitabilityDashboard from "./ProfitabilityDashboard";
import ContractsDashboard from "./ContractsDashboard";
import ReceiptsDashboard from "./ReceiptsDashboard";
import CashPositionDashboard from "./CashPositionDashboard";
import SetupProgressPanel from "../components/SetupProgressPanel";
import { getSetupStatus } from "../lib/onboarding";

const financeTabs = ["Profitability", "Cash Position", "Receipts", "Contracts"];

export default function FinanceDashboard({
  activeSection,
  setActiveSection,
  form,
  update,
  results,
  grade,
  risks,
  savedScenarios,
  saveScenario,
  loadScenario,
  deleteScenario,
  exportSummary,
  resetForm,
  isDark,
  appSettings,
  teams,
  claims,
  navigateToTab,
  isBlankDemo = false,
  isDemoMode = false,
}) {
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const shellClass = isDark
    ? "mb-5 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const setupStatus = useMemo(
    () => getSetupStatus({ teams, claims, savedScenarios, appSettings, isBlankDemo, isDemoMode }),
    [teams, claims, savedScenarios, appSettings, isBlankDemo, isDemoMode]
  );
  const goToFinanceSection = (section) => {
    if (navigateToTab) {
      navigateToTab(section);
      return;
    }

    setActiveSection(section);
  };
  const goToAction = (action) => {
    if (!action) return;
    if (["Profitability", "Cash Position", "Receipts", "Contracts"].includes(action.tab)) {
      goToFinanceSection(action.tab);
      return;
    }
    navigateToTab?.(action.tab || "Finance");
  };

  return (
    <div>
      <section data-tour="finance-header" className={shellClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-3xl font-black leading-tight tracking-tight sm:text-4xl ${titleText}`}>Finance</h1>
            <p className={`mt-2 text-sm font-semibold sm:text-base ${mutedText}`}>
              Revenue, costs, margin, receipts, and contracts — everything that affects your bottom line.
            </p>
          </div>
          {/* Hidden on desktop — the left sidebar already has these sub-sections. */}
          <div className="flex flex-wrap gap-2 lg:hidden">
            {financeTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => goToFinanceSection(tab)}
                className={
                  activeSection === tab
                    ? "rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm"
                    : isDark
                      ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-300 hover:bg-white/5"
                      : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!setupStatus.isMostlyComplete && (
        <div className="mb-5">
          <SetupProgressPanel isDark={isDark} status={setupStatus} compact onAction={goToAction} title="Finance setup health" />
        </div>
      )}

      {activeSection === "Cash Position" ? (
        <div data-tour="finance-active-workflow">
          <CashPositionDashboard isDark={isDark} />
        </div>
      ) : activeSection === "Receipts" ? (
        <div data-tour="finance-active-workflow">
          <ReceiptsDashboard isDark={isDark} isBlankDemo={isBlankDemo} isDemoMode={isDemoMode} navigateToTab={navigateToTab} />
        </div>
      ) : activeSection === "Contracts" ? (
        <div data-tour="finance-active-workflow">
          <ContractsDashboard teams={teams} claims={claims} isDark={isDark} navigateToTab={navigateToTab} isBlankDemo={isBlankDemo} isDemoMode={isDemoMode} />
        </div>
      ) : (
        <div data-tour="finance-active-workflow">
          <ProfitabilityDashboard
            form={form}
            update={update}
            results={results}
            grade={grade}
            risks={risks}
            savedScenarios={savedScenarios}
            saveScenario={saveScenario}
            loadScenario={loadScenario}
            deleteScenario={deleteScenario}
            exportSummary={exportSummary}
            resetForm={resetForm}
            isDark={isDark}
            appSettings={appSettings}
            isBlankDemo={isBlankDemo}
            isDemoMode={isDemoMode}
            navigateToTab={navigateToTab}
            teams={teams}
            claims={claims}
          />
        </div>
      )}
    </div>
  );
}
