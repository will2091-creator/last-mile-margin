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
import EmptyState from "../components/EmptyState";
import {
  ComplianceRiskPanel,
  DocumentVaultTable,
} from "../components/ProfitPlatformWidgets";
import {
  complianceRiskData,
  documentVaultData,
} from "../data/platformMockData";

function ComplianceDashboard({ teams, claims, isDark, navigateToTab }) {
  const photosUploaded = teams.filter((team) => team.photoStatus === "Uploaded").length;
  const atRiskTeams = teams.filter((team) => team.status === "At Risk").length;
  const totalClaimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const hasComplianceInputs = teams.length > 0 || claims.length > 0;

  const complianceStats = [
    { label: "Overall Compliance", value: "92%", note: "+5% from last month", color: "text-emerald-400" },
    { label: "Photos Uploaded", value: `${photosUploaded} / ${teams.length}`, note: "Daily readiness", color: "text-blue-400" },
    { label: "At-Risk Teams", value: atRiskTeams, note: "Needs review", color: "text-orange-400" },
    { label: "Claims Risk", value: currency.format(totalClaimsExposure), note: "Current exposure", color: "text-yellow-400" },
  ];

  const documents = [
    { name: "Certificate of Insurance", owner: "Team A", status: "Valid", expires: "Jun 15, 2026" },
    { name: "Cargo Insurance", owner: "Team B", status: "Expiring Soon", expires: "Jun 7, 2026" },
    { name: "DOT Inspection", owner: "Truck 204", status: "Expired", expires: "May 20, 2026" },
    { name: "Driver Medical Card", owner: "Mike S.", status: "Missing", expires: "—" },
  ];

  const alerts = [
    { text: "Cargo Insurance for Team B expires soon.", level: "Medium" },
    { text: "Truck 204 DOT inspection is expired.", level: "High" },
    { text: "Team C daily photo check-in is missing.", level: "High" },
    { text: "Mike S. has multiple property claims assigned.", level: "Medium" },
  ];

  const getStatusClass = (status) => {
    if (status === "Valid" || status === "Good") return "bg-emerald-500/15 text-emerald-400";
    if (status === "Expiring Soon" || status === "Watch") return "bg-orange-500/15 text-orange-400";
    return "bg-red-500/15 text-red-400";
  };

  const getClaimDriver = (claim) => {
    if (claim.driver) return claim.driver;
    const matchingTeam = teams.find((team) => team.name === claim.team);
    return matchingTeam?.lead || "";
  };
  const getTeamClaims = (team) => claims.filter((claim) => [team.lead, team.helper].filter(Boolean).includes(getClaimDriver(claim)));
  const getTeamExposure = (team) => getTeamClaims(team).reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-emerald-400">Final Mile Margin</p>
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
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-2 w-3/4 rounded-full bg-emerald-500" />
            </div>
          </Card>
        ))}
      </div>

      <ComplianceRiskPanel documents={documentVaultData} risks={complianceRiskData} isDark={isDark} />

      <DocumentVaultTable documents={documentVaultData} isDark={isDark} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Document Tracker</h2>
            <p className="text-sm text-slate-400">Insurance, DOT, licenses, inspections, and required paperwork.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Document</th>
                  <th className="py-3">Owner</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Expires</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.name} className="border-b border-white/5">
                    <td className="py-3 font-semibold text-white">{doc.name}</td>
                    <td className="py-3 text-slate-300">{doc.owner}</td>
                    <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${getStatusClass(doc.status)}`}>{doc.status}</span></td>
                    <td className="py-3 text-slate-400">{doc.expires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Risk Alerts</h2>
            <p className="text-sm text-slate-400">Items that could impact routes, claims, or profitability.</p>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.text} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={alert.level === "High" ? "h-5 w-5 text-red-400" : "h-5 w-5 text-orange-400"} />
                  <p className="text-sm text-slate-300">{alert.text}</p>
                </div>
                <span className={alert.level === "High" ? "rounded-full bg-red-500/15 px-2 py-1 text-xs font-bold text-red-400" : "rounded-full bg-orange-500/15 px-2 py-1 text-xs font-bold text-orange-400"}>
                  {alert.level}
                </span>
              </div>
            ))}
          </div>
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
