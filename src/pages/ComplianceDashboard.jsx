import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Area,
  AreaChart,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Camera,
  Card,
  CartesianGrid,
  Cell,
  CheckCircle2,
  claimTypeOptions,
  ClipboardCheck,
  CostPieChart,
  currency,
  defaultForm,
  defaultSettings,
  DollarSign,
  Field,
  FileDown,
  FileText,
  getGrade,
  initialClaims,
  initialTeams,
  LayoutDashboard,
  MetricCard,
  Moon,
  number,
  Pie,
  PieChart,
  ProfitTrendChart,
  ResponsiveContainer,
  RotateCcw,
  Row,
  Save,
  Section,
  SelectField,
  Settings,
  ShieldCheck,
  StatusBadge,
  Sun,
  TextField,
  toNum,
  Tooltip,
  Trash2,
  Truck,
  Upload,
  UserPlus,
  Users,
  XAxis,
  YAxis,
} from "../shared";
import EmptyState, { InlineEmpty } from "../components/EmptyState";

function ComplianceDashboard({ teams, claims, isDark, navigateToTab }) {
  const photosUploaded = teams.filter((team) => team.photoStatus === "Uploaded").length;
  const atRiskTeams = teams.filter((team) => team.status === "At Risk").length;
  const totalClaimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const openClaims = claims.filter((claim) => claim.status === "Open" || claim.status === "Under Review");
  const openExposure = openClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const hasComplianceInputs = teams.length > 0 || claims.length > 0;

  // Real readiness: teams that are not flagged At Risk and have today's photo in.
  const readyTeams = teams.filter((team) => team.status !== "At Risk" && team.photoStatus === "Uploaded").length;
  const readinessPct = teams.length ? Math.round((readyTeams / teams.length) * 100) : 0;

  const complianceStats = [
    { label: "Team Readiness", value: teams.length ? `${readinessPct}%` : "—", note: `${readyTeams} of ${teams.length} teams ready`, color: "text-emerald-400" },
    { label: "Photos Uploaded", value: `${photosUploaded} / ${teams.length}`, note: "Daily check-in", color: "text-blue-400" },
    { label: "At-Risk Teams", value: atRiskTeams, note: "Needs review", color: "text-orange-400" },
    { label: "Open Claim Risk", value: currency.format(openExposure), note: `${openClaims.length} open · ${currency.format(totalClaimsExposure)} total`, color: "text-yellow-400" },
  ];

  const getClaimDriver = (claim) => {
    if (claim.driver) return claim.driver;
    const matchingTeam = teams.find((team) => team.name === claim.team);
    return matchingTeam?.lead || "";
  };
  const getTeamClaims = (team) => claims.filter((claim) => [team.lead, team.helper].filter(Boolean).includes(getClaimDriver(claim)));
  const getTeamExposure = (team) => getTeamClaims(team).reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  // Real alerts built from the user's actual teams and claims — no mock data.
  const alerts = [];
  teams.filter((t) => t.status === "At Risk").forEach((t) => alerts.push({ text: `${t.name} is flagged At Risk — review before dispatch.`, level: "High" }));
  teams.filter((t) => t.photoStatus !== "Uploaded").forEach((t) => alerts.push({ text: `${t.name} hasn't submitted today's photo check-in.`, level: "Medium" }));
  if (openClaims.length) alerts.push({ text: `${openClaims.length} open claim${openClaims.length > 1 ? "s" : ""} need review (${currency.format(openExposure)} exposure).`, level: openExposure >= 1000 ? "High" : "Medium" });
  teams.forEach((t) => { const exp = getTeamExposure(t); if (exp >= 1000) alerts.push({ text: `${t.name} is carrying ${currency.format(exp)} in claim exposure.`, level: "Medium" }); });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-emerald-400">Last Mile Margin</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Compliance Overview</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Track contractor readiness, daily photo check-ins, document expirations, claims risk, and delivery quality.</p>
        </div>
      </div>

      {!hasComplianceInputs ? (
        <EmptyState
          isDark={isDark}
          eyebrow="Compliance setup"
          title="Start your readiness checklist"
          description="Compliance should track insurance, driver documents, truck documents, route photo proof, and claim evidence. Add a team or upload documents before this becomes a live tracker."
          Icon={ClipboardCheck}
          primaryAction={{ label: "Upload Documents", onClick: () => navigateToTab?.("Intake") }}
          secondaryActions={[
            { label: "Add Team", onClick: () => navigateToTab?.("Teams") },
            { label: "Review Claims", onClick: () => navigateToTab?.("Claims") },
          ]}
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {["Insurance", "Driver documents", "Truck documents", "Route photo proof", "Claim evidence process"].map((item) => (
              <div key={item} className={isDark ? "rounded-xl bg-white/5 px-3 py-2 text-sm font-black text-slate-200" : "rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm"}>
                {item}
              </div>
            ))}
          </div>
        </EmptyState>
      ) : (
        <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {complianceStats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className={`mt-2 text-4xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Document Tracker</h2>
            <p className="text-sm text-slate-400">Insurance, DOT, licenses, inspections, and driver paperwork with expiration dates.</p>
          </div>

          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-2 text-center">
            <InlineEmpty
              isDark={isDark}
              Icon={FileText}
              title="No documents tracked yet"
              hint="Add insurance, DOT inspection, licenses, and driver medical cards with expiration dates — they'll show here with valid / expiring / expired status so nothing lapses."
            />
            <button
              type="button"
              onClick={() => navigateToTab?.("Intake")}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
            >
              Upload a document
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Risk Alerts</h2>
            <p className="text-sm text-slate-400">Live from your teams and claims — items that could impact routes or profitability.</p>
          </div>

          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-300">All clear — no readiness or claim risks right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.text} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={alert.level === "High" ? "h-5 w-5 shrink-0 text-red-400" : "h-5 w-5 shrink-0 text-orange-400"} />
                    <p className="text-sm text-slate-300">{alert.text}</p>
                  </div>
                  <span className={alert.level === "High" ? "shrink-0 rounded-full bg-red-500/15 px-2 py-1 text-xs font-bold text-red-400" : "shrink-0 rounded-full bg-orange-500/15 px-2 py-1 text-xs font-bold text-orange-400"}>
                    {alert.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Team Compliance Scorecard</h2>
          <p className="text-sm text-slate-400">Track team quality with claim exposure rolled up from assigned drivers.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3">Team</th>
                <th className="py-3">Compliance</th>
                <th className="py-3">Claims</th>
                <th className="py-3">Exposure</th>
                <th className="py-3">Survey Avg</th>
                <th className="py-3">Photo</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const teamClaims = getTeamClaims(team);
                const exposure = getTeamExposure(team);

                return (
                  <tr key={team.id} className="border-b border-white/5">
                    <td className="py-3 font-semibold text-white">{team.name}</td>
                    <td className="py-3 font-bold text-emerald-400">{team.complianceScore}%</td>
                    <td className="py-3 text-slate-300">{teamClaims.length}</td>
                    <td className="py-3 font-bold text-red-400">{currency.format(exposure)}</td>
                    <td className="py-3 text-slate-300">{team.surveyAvg}</td>
                    <td className="py-3"><StatusBadge status={team.photoStatus} /></td>
                    <td className="py-3"><StatusBadge status={team.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}
    </div>
  );
}

export default ComplianceDashboard;
