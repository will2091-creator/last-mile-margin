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

function ReportsDashboard({ claims, teams, results, form, isDark, exportSummary, reportsHomeSignal }) {
  const totalExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const openClaims = claims.filter((claim) => claim.status !== "Closed").length;
  const activeTeams = teams.length;
  const photoCompliance =
    activeTeams > 0 ? Math.round((teams.filter((team) => team.photoStatus === "Uploaded").length / activeTeams) * 100) : 0;

  const [reportFilters, setReportFilters] = useState({
    dateRange: "May 1 – May 7, 2026",
    team: "All Teams",
    route: "All Routes",
    reportType: "All Reports",
  });

  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    setSelectedReport(null);
  }, [reportsHomeSignal]);

  const updateFilter = (key, value) => {
    setReportFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setReportFilters({
      dateRange: "May 1 – May 7, 2026",
      team: "All Teams",
      route: "All Routes",
      reportType: "All Reports",
    });
  };

  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const rowBorder = isDark ? "border-white/10" : "border-slate-200";
  const inputClass = isDark
    ? "w-full min-w-0 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
    : "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500";

  const reportCards = [
    {
      title: "Daily Route Profit Report",
      type: "Profit",
      description: "Detailed profit and loss by route with per stop and per mile metrics.",
      bestFor: "Daily operational review",
      icon: DollarSign,
      tone: "green",
      previewRows: [
        ["Route", form.scenarioName],
        ["Revenue", currency.format(results.totalRevenue)],
        ["Costs", currency.format(results.totalCost)],
        ["Net Profit", currency.format(results.netProfit)],
        ["Profit / Stop", currency.format(results.profitPerStop)],
      ],
    },
    {
      title: "Weekly Profit Summary",
      type: "Profit",
      description: "Weekly totals and averages across all routes and teams.",
      bestFor: "Weekly owner review",
      icon: BarChart3,
      tone: "blue",
      previewRows: [
        ["Routes", "10"],
        ["Stops", "184"],
        ["Weekly Revenue", currency.format(results.totalRevenue * 10)],
        ["Weekly Profit", currency.format(results.netProfit * 10)],
        ["Avg Profit / Route", currency.format(results.netProfit)],
      ],
    },
    {
      title: "Claims Impact Report",
      type: "Claims",
      description: "Analyze claims exposure and how claims impact your bottom line.",
      bestFor: "Claims management",
      icon: ShieldCheck,
      tone: "red",
      previewRows: [
        ["Open Claims", openClaims],
        ["Total Exposure", currency.format(totalExposure)],
        ["Highest Risk", "Team C"],
        ["Preventable Claims", claims.filter((claim) => claim.preventable === "Yes").length],
        ["Profit Lost / Stop", currency.format(totalExposure / 1038)],
      ],
    },
    {
      title: "Team Performance Report",
      type: "Teams",
      description: "Team performance, compliance, claims, and profitability overview.",
      bestFor: "Team accountability",
      icon: Users,
      tone: "blue",
      previewRows: [
        ["Active Teams", activeTeams],
        ["Photo Compliance", `${photoCompliance}%`],
        ["At-Risk Teams", teams.filter((team) => team.status === "At Risk").length],
        ["Best Team", "Team A"],
        ["Watch Team", "Team C"],
      ],
    },
    {
      title: "Compliance Report",
      type: "Compliance",
      description: "Compliance status, expiring items, and risk across all teams.",
      bestFor: "Risk management",
      icon: ClipboardCheck,
      tone: "amber",
      previewRows: [
        ["Photo Compliance", `${photoCompliance}%`],
        ["Open Issues", "3"],
        ["Expiring Items", "2"],
        ["NAH Compliance", "92%"],
        ["Risk Level", "Medium"],
      ],
    },
    {
      title: "Monthly Owner Summary",
      type: "Owner Summary",
      description: "Executive summary of monthly performance and key trends.",
      bestFor: "Executive review",
      icon: CalendarIconFallback,
      tone: "green",
      previewRows: [
        ["Monthly Revenue", currency.format(results.totalRevenue * 43.3)],
        ["Monthly Profit", currency.format(results.netProfit * 43.3)],
        ["Claims Exposure", currency.format(totalExposure)],
        ["Active Teams", activeTeams],
        ["Margin", `${number.format(results.profitMargin * 100)}%`],
      ],
    },
  ];

  const exports = [
    ["May 7, 2026", "Daily Route Profit Report", "May 7, 2026", "TXT"],
    ["May 6, 2026", "Weekly Profit Summary", "Apr 30 – May 6", "TXT"],
    ["May 6, 2026", "Claims Impact Report", "Apr 30 – May 6", "TXT"],
    ["May 5, 2026", "Team Performance Report", "Apr 28 – May 4", "TXT"],
    ["May 4, 2026", "Compliance Report", "Apr 28 – May 4", "TXT"],
  ];

  const visibleReports = reportCards.filter((report) => {
    if (reportFilters.reportType === "All Reports") return true;
    return report.type === reportFilters.reportType;
  });

  const visibleExports = exports.filter((item) => {
    if (reportFilters.reportType === "All Reports") return true;
    return item[1].toLowerCase().includes(reportFilters.reportType.toLowerCase());
  });

  const insights = [
    {
      label: "Total Revenue",
      value: currency.format(results.totalRevenue),
      delta: "12.5% vs prior 7 days",
      tone: "green",
      icon: DollarSign,
    },
    {
      label: "Net Profit",
      value: currency.format(results.netProfit),
      delta: "8.3% vs prior 7 days",
      tone: "blue",
      icon: BarChart3,
    },
    {
      label: "Claims Exposure",
      value: currency.format(totalExposure),
      delta: `${openClaims} open claims`,
      tone: "red",
      icon: ShieldCheck,
    },
    {
      label: "Photo Compliance",
      value: `${photoCompliance}%`,
      delta: `${activeTeams} active teams`,
      tone: "blue",
      icon: Camera,
    },
  ];

  const toneClasses = {
    green: {
      icon: isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700",
      text: "text-emerald-700",
    },
    blue: {
      icon: isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700",
      text: "text-blue-600",
    },
    red: {
      icon: isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700",
      text: "text-red-600",
    },
    amber: {
      icon: isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700",
      text: "text-amber-700",
    },
  };

  const exportReport = (reportName) => {
    const report = reportCards.find((item) => item.title === reportName);
    const summary = [
      "Final Mile Margin Report",
      `Report: ${reportName}`,
      `Period: ${reportFilters.dateRange}`,
      `Team: ${reportFilters.team}`,
      `Route: ${reportFilters.route}`,
      "",
      ...(report?.previewRows || []).map(([label, value]) => `${label}: ${value}`),
      "",
      "Generated from Final Mile Margin.",
    ].join("\n");

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportName.toLowerCase().replaceAll(" ", "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950"}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className={`text-3xl font-black tracking-tight sm:text-4xl ${titleText}`}>Reports</h1>
          <p className={`mt-2 text-sm sm:text-base ${mutedText}`}>
            Generate, export, and review final mile performance reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedReport(reportCards[0])}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-500"
          >
            Preview Profit Report
          </button>
        </div>
      </div>

      {selectedReport && (
        <div className={cardClass}>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-blue-600">Report Preview</p>
              <h2 className={`mt-1 text-2xl font-black ${titleText}`}>{selectedReport.title}</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>{selectedReport.description}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => exportReport(selectedReport.title)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
              >
                Download TXT
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className={
                  isDark
                    ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                }
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {selectedReport.previewRows.map(([label, value]) => (
              <div key={label} className={isDark ? "rounded-xl bg-white/5 p-4" : "rounded-xl bg-slate-50 p-4"}>
                <p className={`text-xs font-bold ${mutedText}`}>{label}</p>
                <p className={`mt-2 text-lg font-black ${label.toLowerCase().includes("claim") || label.toLowerCase().includes("risk") ? "text-red-600" : titleText}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cardClass}>
        <h2 className={`text-xl font-black ${titleText}`}>Report Center</h2>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          {visibleReports.map((report) => {
            const Icon = report.icon;
            const tone = toneClasses[report.tone];
            return (
              <div
                key={report.title}
                className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className={`font-black ${titleText}`}>{report.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>{report.description}</p>
                    <p className={`mt-3 text-sm font-bold ${tone.text}`}>Best for: {report.bestFor}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className={
                      isDark
                        ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
                        : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-blue-600 hover:bg-slate-50"
                    }
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => exportReport(report.title)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
                  >
                    Download TXT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className={`${cardClass} xl:col-span-3`}>
          <h2 className={`text-lg font-black ${titleText}`}>Filters</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Date Range</label>
              <select value={reportFilters.dateRange} onChange={(e) => updateFilter("dateRange", e.target.value)} className={inputClass}>
                <option>May 1 – May 7, 2026</option>
                <option>This Month</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Team</label>
              <select value={reportFilters.team} onChange={(e) => updateFilter("team", e.target.value)} className={inputClass}>
                <option>All Teams</option>
                {teams.map((team) => (
                  <option key={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Route / Contract</label>
              <select value={reportFilters.route} onChange={(e) => updateFilter("route", e.target.value)} className={inputClass}>
                <option>All Routes</option>
                <option>{form.scenarioName}</option>
              </select>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Report Type</label>
              <select value={reportFilters.reportType} onChange={(e) => updateFilter("reportType", e.target.value)} className={inputClass}>
                <option>All Reports</option>
                <option>Profit</option>
                <option>Claims</option>
                <option>Teams</option>
                <option>Compliance</option>
                <option>Owner Summary</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className={
                isDark
                  ? "w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
                  : "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              }
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className={`${cardClass} xl:col-span-6`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-black ${titleText}`}>Recent Exports</h2>
              <p className={`text-sm ${mutedText}`}>Recently generated report files.</p>
            </div>
            <button onClick={clearFilters} className="text-sm font-bold text-blue-600">View All Exports</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className={`border-b ${rowBorder}`}>
                <tr className={`text-xs uppercase tracking-wide ${mutedText}`}>
                  <th className="py-3">Date</th>
                  <th className="py-3">Report</th>
                  <th className="py-3">Period</th>
                  <th className="py-3">Format</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleExports.map((row) => (
                  <tr key={`${row[0]}-${row[1]}`} className={`border-b ${rowBorder}`}>
                    <td className="whitespace-nowrap py-3">
                      <p className={`font-semibold ${titleText}`}>{row[0]}</p>
                      <p className={`text-xs ${mutedText}`}>Generated</p>
                    </td>
                    <td className={`whitespace-nowrap py-3 font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{row[1]}</td>
                    <td className={`whitespace-nowrap py-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{row[2]}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600">{row[3]}</span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => exportReport(row[1])} className="text-sm font-bold text-blue-600">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={clearFilters} className="mt-5 w-full rounded-xl px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-500/5">
            View All Exports
          </button>
        </div>

        <div className={`${cardClass} xl:col-span-3`}>
          <h2 className={`text-lg font-black ${titleText}`}>Report Insights</h2>
          <p className={`text-sm ${mutedText}`}>Key metrics from this period.</p>

          <div className="mt-5 space-y-5">
            {insights.map((item) => {
              const Icon = item.icon;
              const tone = toneClasses[item.tone];
              return (
                <div key={item.label} className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${mutedText}`}>{item.label}</p>
                    <p className={`mt-1 text-lg font-black ${item.tone === "red" ? "text-red-600" : titleText}`}>{item.value}</p>
                    <p className={`mt-1 text-xs ${mutedText}`}>{item.delta}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedReport(reportCards.find((report) => report.type === "Owner Summary") || reportCards[0])}
            className={
              isDark
                ? "mt-6 w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
                : "mt-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-blue-600 hover:bg-slate-50"
            }
          >
            View Full Insights
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarIconFallback(props) {
  return <FileText {...props} />;
}

export default ReportsDashboard;
