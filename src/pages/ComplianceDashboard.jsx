import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { fileToCompressedImage } from "../lib/imagePrep";

const DOC_TYPES = [
  "Auto Liability Insurance",
  "Cargo Insurance",
  "General Liability Insurance",
  "Workers' Comp Insurance",
  "DOT Inspection",
  "Business License",
  "Vehicle Registration",
  "Driver's License",
  "DOT Medical Card",
  "Other",
];
const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_WINDOW_DAYS = 30;
const EMPTY_DOC = { type: DOC_TYPES[0], label: "", issuer: "", issueDate: "", expiry: "", notes: "" };

function parseDocDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
function getDocStatus(expiry) {
  const exp = parseDocDate(expiry);
  if (!exp) return "No expiry";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((exp - today) / DAY_MS);
  if (days < 0) return "Expired";
  if (days <= EXPIRING_WINDOW_DAYS) return "Expiring Soon";
  return "Valid";
}
function getDocDaysLeft(expiry) {
  const exp = parseDocDate(expiry);
  if (!exp) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exp - today) / DAY_MS);
}
function formatDocDate(value) {
  const date = parseDocDate(value);
  if (!date) return "No expiry";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ComplianceDashboard({ teams, claims, isDark, navigateToTab }) {
  const [docs, setDocs] = useState(() => {
    try {
      const raw = localStorage.getItem("finalMileComplianceDocs");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("finalMileComplianceDocs", JSON.stringify(docs));
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [docs]);

  const [showDocForm, setShowDocForm] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [docForm, setDocForm] = useState(EMPTY_DOC);
  const [docScanStatus, setDocScanStatus] = useState("idle"); // idle | reading
  const docPhotoInputRef = useRef(null);

  const openDocForm = (doc) => {
    if (doc) {
      setEditingDocId(doc.id);
      setDocForm({ ...EMPTY_DOC, ...doc });
    } else {
      setEditingDocId(null);
      setDocForm(EMPTY_DOC);
    }
    setShowDocForm(true);
  };
  const closeDocForm = () => {
    setShowDocForm(false);
    setEditingDocId(null);
    setDocForm(EMPTY_DOC);
  };
  const saveDoc = () => {
    if (!docForm.type) return;
    const clean = { ...docForm, label: docForm.label.trim(), issuer: docForm.issuer.trim() };
    if (editingDocId) {
      setDocs(docs.map((doc) => (doc.id === editingDocId ? { ...clean, id: editingDocId } : doc)));
    } else {
      setDocs([{ ...clean, id: `DOC-${Date.now()}` }, ...docs]);
    }
    closeDocForm();
  };
  const removeDoc = (id) => setDocs(docs.filter((doc) => doc.id !== id));

  const handleDocPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setDocScanStatus("reading");
    try {
      const { base64, contentType } = await fileToCompressedImage(file);
      const response = await fetch("/api/vision-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, contentType }),
      });
      if (!response.ok) throw new Error("Vision unavailable");
      const result = await response.json().catch(() => ({}));
      if (!result || (!result.type && !result.expiry)) throw new Error("No result");
      setDocForm((current) => ({
        ...current,
        type: DOC_TYPES.includes(result.type) ? result.type : current.type,
        label: result.label || current.label,
        issuer: result.issuer || current.issuer,
        issueDate: result.issueDate || current.issueDate,
        expiry: result.expiry || current.expiry,
      }));
    } catch {
      /* leave the form for manual entry on failure */
    } finally {
      setDocScanStatus("idle");
    }
  };

  // Sort: most urgent first (expired, then soonest expiry, then no-expiry).
  const sortedDocs = [...docs].sort((a, b) => {
    const da = getDocDaysLeft(a.expiry);
    const db = getDocDaysLeft(b.expiry);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });
  const expiredDocs = docs.filter((doc) => getDocStatus(doc.expiry) === "Expired").length;
  const expiringDocs = docs.filter((doc) => getDocStatus(doc.expiry) === "Expiring Soon").length;
  const validDocs = docs.filter((doc) => getDocStatus(doc.expiry) === "Valid").length;

  const photosUploaded = teams.filter((team) => team.photoStatus === "Uploaded").length;
  const atRiskTeams = teams.filter((team) => team.status === "At Risk").length;
  const totalClaimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const openClaims = claims.filter((claim) => claim.status === "Open" || claim.status === "Under Review");
  const openExposure = openClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const hasComplianceInputs = teams.length > 0 || claims.length > 0 || docs.length > 0;

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
  docs.forEach((doc) => {
    const status = getDocStatus(doc.expiry);
    const name = doc.label || doc.type;
    if (status === "Expired") alerts.push({ text: `${name} expired ${formatDocDate(doc.expiry)} — renew before dispatch.`, level: "High" });
    else if (status === "Expiring Soon") alerts.push({ text: `${name} expires ${formatDocDate(doc.expiry)} (${getDocDaysLeft(doc.expiry)} days).`, level: "Medium" });
  });

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
          description="Compliance should track insurance, driver documents, truck documents, route photo proof, and claim evidence. Add a team or track a document before this becomes a live tracker."
          Icon={ClipboardCheck}
          primaryAction={{ label: "Track a Document", onClick: () => openDocForm() }}
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
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Document Tracker</h2>
              <p className="text-sm text-slate-400">Insurance, DOT, licenses, inspections, and driver paperwork with expiration dates.</p>
            </div>
            {docs.length > 0 && (
              <button
                type="button"
                onClick={() => openDocForm()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                <Upload className="h-3.5 w-3.5" /> Add document
              </button>
            )}
          </div>

          {docs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-2 text-center">
              <InlineEmpty
                isDark={isDark}
                Icon={FileText}
                title="No documents tracked yet"
                hint="Add insurance, DOT inspection, licenses, and driver medical cards with expiration dates — they'll show here with valid / expiring / expired status so nothing lapses."
              />
              <button
                type="button"
                onClick={() => openDocForm()}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
              >
                Track a document
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-400">{validDocs} valid</span>
                <span className="rounded-full bg-yellow-500/15 px-2.5 py-1 text-yellow-400">{expiringDocs} expiring</span>
                <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-red-400">{expiredDocs} expired</span>
              </div>
              <div className="space-y-2">
                {sortedDocs.map((doc) => {
                  const status = getDocStatus(doc.expiry);
                  return (
                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-white/5 p-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{doc.label || doc.type}</p>
                          <p className="truncate text-xs text-slate-500">
                            {doc.type}
                            {doc.issuer ? ` · ${doc.issuer}` : ""}
                            {doc.expiry ? ` · Expires ${formatDocDate(doc.expiry)}` : " · No expiry"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={status} />
                        <button
                          type="button"
                          onClick={() => openDocForm(doc)}
                          className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDoc(doc.id)}
                          aria-label={`Remove ${doc.label || doc.type}`}
                          className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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

      {showDocForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeDocForm}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-400">Compliance</p>
                <h2 className="text-xl font-black text-white">{editingDocId ? "Edit document" : "Track a document"}</h2>
              </div>
              <button onClick={closeDocForm} className="rounded-lg border border-white/10 px-2.5 py-1 text-sm text-slate-400 hover:bg-white/5">Close</button>
            </div>

            <input ref={docPhotoInputRef} type="file" accept="image/*" capture="environment" onChange={handleDocPhoto} className="hidden" />
            <button
              type="button"
              onClick={() => docPhotoInputRef.current?.click()}
              disabled={docScanStatus === "reading"}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-400/40 bg-blue-500/5 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-500/10 disabled:opacity-60"
            >
              <Camera className="h-4 w-4" /> {docScanStatus === "reading" ? "Reading document…" : "Scan document with AI"}
            </button>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <SelectField label="Document type" value={docForm.type} onChange={(value) => setDocForm({ ...docForm, type: value })} options={DOC_TYPES} />
              </div>
              <div className="sm:col-span-2">
                <TextField label="Label / name" value={docForm.label} onChange={(value) => setDocForm({ ...docForm, label: value })} placeholder="e.g. Auto Liability — Progressive #PA-4821" />
              </div>
              <div className="sm:col-span-2">
                <TextField label="Issuer / provider" value={docForm.issuer} onChange={(value) => setDocForm({ ...docForm, issuer: value })} placeholder="e.g. Progressive" />
              </div>
              <TextField label="Issue date" type="date" value={docForm.issueDate} onChange={(value) => setDocForm({ ...docForm, issueDate: value })} />
              <TextField label="Expiration date" type="date" value={docForm.expiry} onChange={(value) => setDocForm({ ...docForm, expiry: value })} />
              <div className="sm:col-span-2">
                <TextField label="Notes (optional)" value={docForm.notes} onChange={(value) => setDocForm({ ...docForm, notes: value })} placeholder="Policy number, coverage limits, reminders…" />
              </div>
            </div>

            {docForm.expiry && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>Status preview:</span>
                <StatusBadge status={getDocStatus(docForm.expiry)} />
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={closeDocForm} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5">Cancel</button>
              <button onClick={saveDoc} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">{editingDocId ? "Save changes" : "Add document"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplianceDashboard;
