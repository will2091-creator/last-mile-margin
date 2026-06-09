import React, { useMemo } from "react";
import ClaimsDashboard from "./ClaimsDashboard";
import TeamsDashboard from "./TeamsDashboard";
import ComplianceDashboard from "./ComplianceDashboard";
import { AlertTriangle, Camera, CheckCircle2, ClipboardCheck, currency, FileText, ShieldCheck, Truck, Users } from "../shared";
import EmptyState from "../components/EmptyState";
import RiskForecast from "../components/RiskForecast";
import SetupProgressPanel from "../components/SetupProgressPanel";
import { getPageEmptyStateConfig, getSetupStatus } from "../lib/onboarding";

const operationTabs = [
  {
    id: "Dispatch",
    label: "Dispatch",
    icon: Truck,
    description: "Daily readiness, team status, photos, and active work.",
  },
  {
    id: "Claims",
    label: "Claims",
    icon: FileText,
    description: "Open exposure, disputes, risk, and claim packet work.",
  },
  {
    id: "Teams",
    label: "Teams",
    icon: Users,
    description: "Driver assignments, route teams, trucks, and readiness.",
  },
  {
    id: "Compliance",
    label: "Compliance",
    icon: ClipboardCheck,
    description: "DOT, insurance, documents, photos, and compliance blockers.",
  },
];

export default function OperationsDashboard({
  activeSection,
  setActiveSection,
  navigateToTab,
  claims,
  setClaims,
  teams,
  setTeams,
  isDark,
  appSettings,
  claimsBackendStatus,
  isBlankDemo = false,
  isDemoMode = false,
}) {
  const openClaims = claims.filter((claim) => claim.status !== "Closed");
  const highRiskClaims = openClaims.filter((claim) => claim.risk === "High");
  const openExposure = openClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const highRiskExposure = highRiskClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const teamsMissingPhotos = teams.filter((team) => team.photoStatus !== "Uploaded");
  const complianceBlockers = teams.filter((team) => Number(team.complianceScore || 0) < 70 || team.photoStatus !== "Uploaded");
  const routeReadyTeams = teams.filter((team) => Number(team.complianceScore || 0) >= 80 && team.photoStatus === "Uploaded").length;
  const nextMove =
    highRiskClaims.length > 0
      ? `Start with ${highRiskClaims[0].id}: ${currency.format(Number(highRiskClaims[0].amount || 0))} high-risk claim exposure.`
      : teamsMissingPhotos.length > 0
        ? `Get ${teamsMissingPhotos[0].name}'s route photo uploaded before dispatch review.`
        : complianceBlockers.length > 0
          ? `Review ${complianceBlockers[0].name}'s compliance status before assigning more work.`
          : "Operations look clear. Keep claims and field photos current.";

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const shellClass = isDark
    ? "mb-5 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const actionClass = isDark
    ? "mb-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4"
    : "mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4";
  const setupStatus = useMemo(
    () => getSetupStatus({ teams, claims, appSettings, isBlankDemo, isDemoMode }),
    [teams, claims, appSettings, isBlankDemo, isDemoMode]
  );
  const operationEmptyConfig = getPageEmptyStateConfig("operations", setupStatus);
  const goToSection = (section) => {
    if (navigateToTab) {
      navigateToTab(section === "Dispatch" ? "Operations" : section);
      return;
    }

    setActiveSection(section);
  };
  const goToAction = (action) => {
    if (!action) return;
    if (action.tab === "Dashboard") {
      navigateToTab?.("Dashboard");
      return;
    }
    if (["Teams", "Claims", "Compliance"].includes(action.tab)) {
      goToSection(action.tab);
      return;
    }
    navigateToTab?.(action.tab || "Operations");
  };
  const actionButton = (action) => ({
    label: action.label,
    onClick: () => goToAction(action),
  });

  return (
    <div>
      <section data-tour="operations-header" className={shellClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-3xl font-black leading-tight tracking-tight sm:text-4xl ${titleText}`}>Operations</h1>
            <p className={`mt-2 text-sm font-semibold sm:text-base ${mutedText}`}>
              Dispatch, claims, team readiness, and compliance — what needs attention before the day starts.
            </p>
          </div>
          {/* Hidden on desktop — the left sidebar already has these sub-sections. */}
          <div data-tour="operations-sections" className="flex flex-wrap gap-2 lg:hidden">
            {operationTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToSection(tab.id)}
                className={
                  activeSection === tab.id
                    ? "rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm"
                    : isDark
                      ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-300 hover:bg-white/5"
                      : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!teams.length && !claims.length ? (
        <div className="mb-5">
          <EmptyState
            isDark={isDark}
            eyebrow={operationEmptyConfig.eyebrow}
            title={operationEmptyConfig.title}
            description={operationEmptyConfig.description}
            Icon={Truck}
            primaryAction={actionButton(operationEmptyConfig.primaryAction)}
            secondaryActions={operationEmptyConfig.secondaryActions.map(actionButton)}
          >
            <div className="grid gap-2 sm:grid-cols-4">
              {["Dispatch", "Teams", "Claims", "Compliance"].map((label, index) => (
                <div key={label} className={isDark ? "rounded-xl bg-white/5 px-3 py-2 text-sm font-black text-slate-200" : "rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm"}>
                  {index + 1}. {label}
                </div>
              ))}
            </div>
          </EmptyState>
        </div>
      ) : !setupStatus.isMostlyComplete ? (
        <div className="mb-5">
          <SetupProgressPanel isDark={isDark} status={setupStatus} compact onAction={goToAction} title="Operations setup health" />
        </div>
      ) : null}

      <section data-tour="operations-metrics" className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OperationMetric
          isDark={isDark}
          icon={FileText}
          label="Open Claims"
          value={openClaims.length}
          note={`${currency.format(openExposure)} exposure`}
          tone="blue"
          onClick={() => goToSection("Claims")}
        />
        <OperationMetric
          isDark={isDark}
          icon={AlertTriangle}
          label="High Risk"
          value={highRiskClaims.length}
          note={`${currency.format(highRiskExposure)} needs review`}
          tone="red"
          onClick={() => goToSection("Claims")}
        />
        <OperationMetric
          isDark={isDark}
          icon={Camera}
          label="Missing Photos"
          value={teamsMissingPhotos.length}
          note={teamsMissingPhotos.length ? `${teamsMissingPhotos[0].name} first` : "All route photos uploaded"}
          tone="amber"
          onClick={() => goToSection("Teams")}
        />
        <OperationMetric
          isDark={isDark}
          icon={ShieldCheck}
          label="Ready Teams"
          value={`${routeReadyTeams}/${teams.length || 0}`}
          note={`${complianceBlockers.length} blocker${complianceBlockers.length === 1 ? "" : "s"}`}
          tone="green"
          onClick={() => goToSection("Teams")}
        />
      </section>

      <section data-tour="operations-next-move" className={actionClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={isDark ? "rounded-2xl bg-blue-400/15 p-3 text-blue-200" : "rounded-2xl bg-white p-3 text-blue-600 shadow-sm"}>
              {complianceBlockers.length || highRiskClaims.length ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <p className={isDark ? "text-sm font-semibold uppercase tracking-wide text-blue-200" : "text-sm font-semibold uppercase tracking-wide text-blue-700"}>Next operations move</p>
              <p className={`mt-1 text-lg font-bold ${titleText}`}>{nextMove}</p>
              <p className={`mt-1 text-sm font-semibold ${mutedText}`}>Use the section tabs above to jump into the workflow that owns the issue.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => goToSection(highRiskClaims.length ? "Claims" : teamsMissingPhotos.length ? "Teams" : "Compliance")}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm"
            >
              Open Work
            </button>
          </div>
        </div>
      </section>

      <RiskForecast isDark={isDark} teams={teams} claims={claims} />

      {activeSection === "Dispatch" ? (
        <div data-tour="operations-active-workflow">
          <DispatchBoard teams={teams} claims={openClaims} isDark={isDark} setActiveSection={goToSection} />
        </div>
      ) : activeSection === "Teams" ? (
        <div data-tour="operations-active-workflow">
          <TeamsDashboard teams={teams} setTeams={setTeams} claims={claims} isDark={isDark} />
        </div>
      ) : activeSection === "Compliance" ? (
        <div data-tour="operations-active-workflow">
          <ComplianceDashboard teams={teams} claims={claims} isDark={isDark} navigateToTab={navigateToTab} appSettings={appSettings} />
        </div>
      ) : (
        <div data-tour="operations-active-workflow">
          <ClaimsDashboard claims={claims} setClaims={setClaims} teams={teams} isDark={isDark} appSettings={appSettings} backendStatus={claimsBackendStatus} navigateToTab={navigateToTab} />
        </div>
      )}
    </div>
  );
}

function DispatchBoard({ teams, claims, isDark, setActiveSection }) {
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const rowClass = isDark
    ? "rounded-2xl border border-white/10 bg-white/5 p-4"
    : "rounded-2xl border border-slate-200 bg-slate-50 p-4";

  const assignments = teams.map((team) => {
    const teamClaims = claims.filter((claim) => claim.team === team.name);
    const hasPhoto = team.photoStatus === "Uploaded";
    const isReady = hasPhoto && Number(team.complianceScore || 0) >= 80;
    return {
      ...team,
      teamClaims,
      status: isReady ? "Ready" : hasPhoto ? "Review" : "Needs Photo",
    };
  });

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Daily Dispatch</p>
          <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Today’s Teams</h2>
          <p className={`mt-2 max-w-2xl text-sm font-semibold ${mutedText}`}>
            Use this board to see who is ready, who needs photo proof, and which teams have active claims tied to today’s work.
          </p>
        </div>
        <button onClick={() => setActiveSection("Teams")} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
          Manage Teams
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {assignments.length === 0 && (
          <div className="xl:col-span-2">
            <EmptyState
              isDark={isDark}
              eyebrow="Dispatch setup"
              title="No route teams on the board yet"
              description="Add a driver/helper/truck team first. Once teams exist, this dispatch board shows photo proof, compliance, and active claims by crew."
              Icon={Users}
              primaryAction={{ label: "Add Team", onClick: () => setActiveSection("Teams") }}
              secondaryActions={[{ label: "Review Claims", onClick: () => setActiveSection("Claims") }]}
              compact
            />
          </div>
        )}
        {assignments.map((team) => (
          <div key={team.id} className={rowClass}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <p className={`truncate text-lg font-bold ${titleText}`}>{team.name}</p>
                </div>
                <p className={`mt-1 text-sm font-bold ${mutedText}`}>{team.lead || "No lead"} · {team.helper || "No helper"} · Truck {team.truck || "Unassigned"}</p>
              </div>
              <span className={
                team.status === "Ready"
                  ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700"
                  : team.status === "Needs Photo"
                    ? "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700"
                    : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-700"
              }>
                {team.status}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <DispatchStat isDark={isDark} label="Photo" value={team.photoStatus || "Missing"} />
              <DispatchStat isDark={isDark} label="Compliance" value={`${team.complianceScore || 0}%`} />
              <DispatchStat isDark={isDark} label="Open Claims" value={team.teamClaims.length} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DispatchStat({ isDark, label, value }) {
  return (
    <div className={isDark ? "rounded-xl bg-slate-950/60 px-3 py-2" : "rounded-xl bg-white/70 px-3 py-2"}>
      <p className={isDark ? "text-[10px] font-semibold uppercase tracking-wide text-slate-400" : "text-[10px] font-semibold uppercase tracking-wide text-slate-500"}>{label}</p>
      <p className={isDark ? "mt-1 truncate text-sm font-black text-white" : "mt-1 truncate text-sm font-black text-slate-950"}>{value}</p>
    </div>
  );
}

function OperationMetric({ isDark, icon: Icon, label, value, note, tone, onClick }) {
  const toneClasses = {
    blue: isDark ? "bg-blue-400/10 text-blue-200" : "bg-blue-50 text-blue-600",
    red: isDark ? "bg-red-400/10 text-red-200" : "bg-red-50 text-red-600",
    amber: isDark ? "bg-amber-400/10 text-amber-200" : "bg-amber-50 text-amber-600",
    green: isDark ? "bg-emerald-400/10 text-emerald-200" : "bg-emerald-50 text-emerald-600",
  };
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-card-hover"
    : "rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md";

  return (
    <button type="button" onClick={onClick} className={cardClass}>
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-3 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-slate-400" : "text-xs font-semibold uppercase tracking-wide text-slate-500"}>{label}</p>
      </div>
      <p className={isDark ? "mt-4 truncate text-3xl font-black text-white" : "mt-4 truncate text-3xl font-black text-slate-950"}>{value}</p>
      <p className={isDark ? "mt-1 text-sm font-bold leading-5 text-slate-400" : "mt-1 text-sm font-bold leading-5 text-slate-500"}>{note}</p>
    </button>
  );
}
