import { useMemo } from "react";
import ProfitabilityDashboard from "./ProfitabilityDashboard";
import ContractsDashboard from "./ContractsDashboard";
import ReceiptsDashboard from "./ReceiptsDashboard";
import SetupProgressPanel from "../components/SetupProgressPanel";
import { BriefcaseBusiness, Calculator, ReceiptText } from "../shared";
import { getSetupStatus } from "../lib/onboarding";

const financeTabs = ["Profitability", "Receipts", "Contracts"];

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
    ? "mb-5 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
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
    if (["Profitability", "Receipts", "Contracts"].includes(action.tab)) {
      goToFinanceSection(action.tab);
      return;
    }
    navigateToTab?.(action.tab || "Finance");
  };

  return (
    <div>
      <section className={shellClass}>
        <p className="text-xs font-black uppercase tracking-wide text-blue-600">Finance</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-4xl font-black tracking-tight ${titleText}`}>Finance</h1>
            <p className={`mt-2 max-w-3xl text-sm font-semibold ${mutedText}`}>
              Profitability, receipts, contracts, and expense records are grouped together because they all affect margin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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

      <section className={isDark ? "mb-5 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20 md:grid-cols-3" : "mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3"}>
        {[
          ["Profitability", "Route math", Calculator, "Revenue, costs, margin"],
          ["Receipts", "Expense proof", ReceiptText, "Gas, tools, maintenance"],
          ["Contracts", "Rate terms", BriefcaseBusiness, "Customer and claim rules"],
        ].map(([tab, title, Icon, detail]) => (
          <button
            key={tab}
            type="button"
            onClick={() => goToFinanceSection(tab)}
            className={activeSection === tab ? "rounded-xl bg-blue-600 p-4 text-left text-white" : isDark ? "rounded-xl bg-white/5 p-4 text-left text-slate-300 hover:bg-white/10" : "rounded-xl bg-slate-50 p-4 text-left text-slate-700 hover:bg-blue-50"}
          >
            <Icon className="h-5 w-5" />
            <p className="mt-2 text-sm font-black">{title}</p>
            <p className={activeSection === tab ? "mt-1 text-xs font-bold text-blue-50" : "mt-1 text-xs font-bold text-slate-500"}>{detail}</p>
          </button>
        ))}
      </section>

      {activeSection === "Receipts" ? (
        <ReceiptsDashboard isDark={isDark} isBlankDemo={isBlankDemo} isDemoMode={isDemoMode} navigateToTab={navigateToTab} />
      ) : activeSection === "Contracts" ? (
        <ContractsDashboard teams={teams} claims={claims} isDark={isDark} navigateToTab={navigateToTab} isBlankDemo={isBlankDemo} isDemoMode={isDemoMode} />
      ) : (
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
      )}
    </div>
  );
}
