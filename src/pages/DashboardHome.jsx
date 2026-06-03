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

function DashboardHome({ teams, claims, setActiveTab, isDark, appSettings, savedDaySnapshot }) {
  const widgets = {
    ...defaultSettings.dashboardWidgets,
    ...(appSettings?.dashboardWidgets || {}),
  };
  const defaultDashboardOrder = defaultSettings.dashboardWidgetOrder || Object.keys(defaultSettings.dashboardWidgets);
  const dashboardWidgetOrder = [
    ...new Set([...(appSettings?.dashboardWidgetOrder || []), ...defaultDashboardOrder]),
  ].filter((key) => Object.prototype.hasOwnProperty.call(defaultSettings.dashboardWidgets, key));
  const activeTeams = teams.length;
  const photosUploaded = teams.filter((team) => team.photoStatus === "Uploaded").length;
  const atRiskTeams = teams.filter((team) => team.status === "At Risk").length;
  const openClaims = claims.filter((claim) => claim.status !== "Closed").length;
  const claimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  const [dashboardPeriod, setDashboardPeriod] = useState("Day");

  const periodMultipliers = {
    Day: 1,
    Week: 7,
    Month: 30,
    Qtr: 90,
    Year: 365,
  };

  const periodMultiplier = periodMultipliers[dashboardPeriod] || 1;

  const baseTodayProfit = 356.03 * periodMultiplier;
  const todayProfit = savedDaySnapshot?.profit ?? baseTodayProfit;
  const yesterdayProfit = 316.98 * periodMultiplier;
  const profitChange = ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100;
  const margin = savedDaySnapshot ? savedDaySnapshot.margin * 100 : 26.5;
  const periodClaimsExposure = savedDaySnapshot?.claimsExposure ?? claimsExposure * Math.min(periodMultiplier, 12);
  const escrowBalance = savedDaySnapshot?.escrow ?? 4250 + periodClaimsExposure * 0.35;
  const dashboardRevenue = savedDaySnapshot?.revenue ?? 1200 * periodMultiplier;
  const dashboardCosts = savedDaySnapshot?.costs ?? dashboardRevenue - todayProfit;

  const dashboardTrend = [
    { day: "May 1", profit: 210 },
    { day: "May 2", profit: 215 },
    { day: "May 3", profit: 255 },
    { day: "May 4", profit: 285 },
    { day: "May 5", profit: 282 },
    { day: "May 6", profit: 317 },
    { day: "May 7", profit: 356 },
  ];

  const readinessScore =
    activeTeams > 0
      ? Math.round((photosUploaded / activeTeams) * 70 + ((activeTeams - atRiskTeams) / activeTeams) * 30)
      : 0;

  const recentClaims = claims.slice(0, 4);

  const savedRoutes = [
    ["May 7", "Lowe's Appliance Delivery", 356.03, 0.265],
    ["May 6", "Best Buy Delivery", 350.21, 0.261],
    ["May 5", "Home Depot Delivery", 510.45, 0.306],
    ["May 4", "RC Willey Furniture", 275.1, 0.223],
  ];

  const needsAttention = [
    {
      title: "Team C missing photo",
      detail: "Daily team photo has not been uploaded.",
      icon: Camera,
      tab: "Teams",
      tone: "red",
    },
    {
      title: "Claims review needed",
      detail: `${openClaims} open claims require review.`,
      icon: FileText,
      tab: "Claims",
      tone: "amber",
    },
    {
      title: "Cost above target",
      detail: "Cost per stop is above target.",
      icon: AlertTriangle,
      tab: "Profitability",
      tone: "amber",
    },
    {
      title: "Escrow under target",
      detail: "Reserve should be reviewed.",
      icon: ShieldCheck,
      tab: "Profitability",
      tone: "red",
    },
  ];

  const routeHealth = [
    ["Revenue Per Mile", "$6.00", "Good"],
    ["Cost Per Mile", "$4.25", "Good"],
    ["Stops Per Hour", "2.0", "Below Target"],
    ["Miles Per Stop", "6.0", "Good"],
  ];

  const routeEfficiency = [
    ["Fuel Efficiency", "85%", "good"],
    ["Time Efficiency", "78%", "good"],
    ["Utilization", "82%", "good"],
    ["On-Time %", "76%", "watch"],
  ];

  const activityItems = [
    ["Route performance saved", "Lowe's Appliance Delivery", "2m ago", CheckCircle2, "green"],
    ["New claim submitted", "Wall Damage · $950.00", "15m ago", FileText, "amber"],
    ["Contract updated", "Best Buy Delivery", "1h ago", CheckCircle2, "green"],
    ["Report exported", "Profitability Report", "2h ago", FileDown, "blue"],
  ];

  const contractPerformance = [
    ["Lowe's Appliance", "$15,600", "26.5%", "Watch"],
    ["Home Depot", "$19,000", "24.1%", "Low"],
    ["Best Buy", "$13,200", "22.3%", "At Risk"],
  ];

  const upcomingRenewals = [
    ["Lowe's Appliance", "Dec 31, 2025", "243 days"],
    ["Home Depot", "Jan 31, 2026", "274 days"],
    ["Best Buy", "Mar 15, 2026", "317 days"],
  ];

  const pageClass = isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const heroClass = isDark
    ? "rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950 via-slate-950 to-emerald-950 p-6 shadow-xl shadow-black/20"
    : "rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const rowBorder = isDark ? "border-white/10" : "border-slate-200";

  const toneIcon = (tone) => {
    if (tone === "red") return "bg-red-500/10 text-red-600";
    if (tone === "amber") return "bg-amber-500/10 text-amber-700";
    if (tone === "green") return "bg-emerald-500/10 text-emerald-700";
    return "bg-blue-500/10 text-blue-600";
  };

  const selectedWidgetCount = dashboardWidgetOrder.filter((key) => widgets[key] !== false).length;

  const goToSource = (tabName) => setActiveTab(tabName);

  const dashboardPeriodCards = [
    ["Net Profit", currency.format(todayProfit), "text-emerald-700", "Profitability", "Route profit calculation"],
    ["Claims", currency.format(periodClaimsExposure), "text-red-600", "Claims", "Open claim exposure"],
    ["Escrow", currency.format(escrowBalance), "text-blue-600", "Compliance", "Claim reserve and compliance risk"],
    ["Revenue", currency.format(dashboardRevenue), isDark ? "text-blue-300" : "text-slate-900", "Profitability", "Route revenue inputs"],
    ["Costs", currency.format(dashboardCosts), "text-orange-600", "Profitability", "Route cost inputs"],
    ["Margin", `${margin.toFixed(1)}%`, "text-emerald-700", "Profitability", "Revenue minus costs"],
  ];

  const widgetSpan = {
    periodMetrics: "xl:col-span-12",
    todaysProfit: "xl:col-span-12",
    financialSummary: "xl:col-span-12",
    recentClaims: "xl:col-span-6",
    savedRoutes: "xl:col-span-6",
    activeContracts: "xl:col-span-4",
    contractPerformance: "xl:col-span-4",
    upcomingRenewals: "xl:col-span-4",
    needsAttention: "xl:col-span-7",
    routeHealth: "xl:col-span-5",
    routeEfficiency: "xl:col-span-7",
    teamReadiness: "xl:col-span-5",
    complianceStatus: "xl:col-span-4",
    fuelCostTracker: "xl:col-span-4",
    documentExpirations: "xl:col-span-4",
    insuranceSummary: "xl:col-span-4",
    recentActivity: "xl:col-span-12",
  };

  const wrapWidget = (key, content) => (
    <div key={key} className={`min-w-0 ${widgetSpan[key] || "xl:col-span-6"}`}>
      {content}
    </div>
  );

  const renderDashboardWidget = (key) => {
    if (key === "periodMetrics") {
      return wrapWidget(key, (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {dashboardPeriodCards.map(([label, value, tone, tab, source]) => (
            <button
              key={label}
              onClick={() => goToSource(tab)}
              className={`${isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-4 hover:border-blue-500/50 hover:bg-slate-900" : "rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50/40"} overflow-hidden text-left transition`}
            >
              <p className={`truncate text-xs font-black uppercase tracking-wide ${mutedText}`}>{dashboardPeriod} {label}</p>
              <p className={`safe-number mt-2 text-2xl font-black ${tone}`} title={value}>{value}</p>
              <p className={`mt-2 truncate text-[11px] font-bold ${mutedText}`}>{source}</p>
            </button>
          ))}
        </div>
      ));
    }

    if (key === "todaysProfit") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Profitability")} className={`${heroClass} block w-full text-left transition hover:border-blue-500`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-sm font-black uppercase tracking-wide text-blue-600">Today's Profit</p>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">Healthy Route</span>
              </div>
              <p className={`safe-number mt-6 text-6xl font-black tracking-tight ${titleText}`} title={currency.format(todayProfit)}>{currency.format(todayProfit)}</p>
              <p className={`mt-2 text-lg ${mutedText}`}>Net Profit Today</p>
              <div className={`mt-6 grid max-w-md grid-cols-2 gap-4 border-t pt-5 ${rowBorder}`}>
                <div>
                  <p className={`safe-number text-3xl font-black ${titleText}`} title={`${number.format(margin)}%`}>{number.format(margin)}%</p>
                  <p className={`text-sm ${mutedText}`}>Margin</p>
                </div>
                <div>
                  <p className="safe-number text-2xl font-black text-emerald-700" title={`↑ ${number.format(profitChange)}%`}>↑ {number.format(profitChange)}%</p>
                  <p className={`text-sm ${mutedText}`}>vs May 6</p>
                </div>
              </div>
            </div>
            <div className="h-44 min-w-[280px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardHeroTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="profit" stroke="#2563EB" strokeWidth={4} fill="url(#dashboardHeroTrend)" />
                  <Tooltip formatter={(value) => currency.format(value)} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </button>
      ));
    }

    if (key === "financialSummary") {
      return wrapWidget(key, (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Revenue", currency.format(dashboardRevenue), "↑ 8.7%", DollarSign, "green", "Profitability"],
            ["Costs", currency.format(dashboardCosts), "↑ 5.1%", Calculator, "amber", "Profitability"],
            ["Claims", currency.format(periodClaimsExposure), "↓ 18.2%", ShieldCheck, "red", "Claims"],
            ["Escrow", currency.format(escrowBalance), "— 0%", ClipboardCheck, "blue", "Compliance"],
          ].map(([label, value, change, Icon, tone, tab]) => (
            <button key={label} onClick={() => goToSource(tab)} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
              <span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(tone)}`}>
                <Icon className="h-6 w-6" />
              </span>
              <p className={`text-sm ${mutedText}`}>{label}</p>
              <p className={`safe-number mt-2 text-2xl font-black ${titleText}`} title={value}>{value}</p>
              <p className={tone === "amber" ? "mt-4 truncate text-sm font-bold text-amber-700" : "mt-4 truncate text-sm font-bold text-emerald-700"}>
                {change} <span className={mutedText}>vs May 6</span>
              </p>
            </button>
          ))}
        </div>
      ));
    }

    if (key === "recentClaims") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Recent Claims</h2>
            <button onClick={() => setActiveTab("Claims")} className="text-sm font-bold text-blue-600">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className={`border-b ${rowBorder}`}>
                <tr className={`text-xs uppercase tracking-wide ${mutedText}`}>
                  <th className="py-3">Type</th>
                  <th className="py-3">Contract</th>
                  <th className="py-3 text-right">Amount</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((claim) => (
                  <tr key={claim.id} onClick={() => goToSource("Claims")} className={`cursor-pointer border-b transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                    <td className={`py-3 font-semibold ${titleText}`}>{claim.type}</td>
                    <td className={`py-3 ${mutedText}`}>{claim.route || "Lowe's Appliance Delivery"}</td>
                    <td className="py-3 text-right font-black text-red-600">{currency.format(claim.amount)}</td>
                    <td className="py-3">
                      <span className={claim.status === "Open" ? "rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600" : "rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700"}>
                        {claim.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ));
    }

    if (key === "savedRoutes") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Saved Route Performance</h2>
            <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View All</button>
          </div>
          <div className="space-y-3">
            {savedRoutes.map((row) => (
              <button key={`${row[0]}-${row[1]}`} onClick={() => goToSource("Profitability")} className={`grid w-full grid-cols-[64px_1fr_80px_70px] items-center gap-3 border-b pb-3 text-left text-sm transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                <p className={mutedText}>{row[0]}</p>
                <p className={`font-semibold ${titleText}`}>{row[1]}</p>
                <p className={`text-right font-black ${titleText}`}>{currency.format(row[2])}</p>
                <p className="text-right font-black text-emerald-700">{number.format(row[3] * 100)}%</p>
              </button>
            ))}
          </div>
        </div>
      ));
    }

    if (key === "needsAttention") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-red-600">Needs Attention</p>
              <div className="mt-2 flex items-end gap-3">
                <p className={`text-5xl font-black ${titleText}`}>{needsAttention.length}</p>
                <p className={`pb-2 text-base ${mutedText}`}>Active Issues</p>
              </div>
            </div>
            <button onClick={() => setActiveTab("Compliance")} className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15" : "rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"}>
              View All Issues
            </button>
          </div>
          <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
            {needsAttention.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} onClick={() => goToSource(item.tab)} className={`flex w-full items-center gap-4 py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneIcon(item.tone)}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold ${titleText}`}>{item.title}</p>
                    <p className={`text-sm ${mutedText}`}>{item.detail}</p>
                  </div>
                  <span className="text-xl text-slate-400">›</span>
                </button>
              );
            })}
          </div>
        </div>
      ));
    }

    if (key === "routeHealth") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Route Health</h2>
            <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View Details</button>
          </div>
          <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
            {routeHealth.map(([label, value, status]) => (
              <button key={label} onClick={() => goToSource("Profitability")} className={`flex w-full items-center justify-between py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                <p className={`text-sm font-semibold ${mutedText}`}>{label}</p>
                <div className="flex items-center gap-3">
                  <p className={status === "Good" ? `font-black ${titleText}` : "font-black text-red-600"}>{value}</p>
                  <span className={status === "Good" ? "h-3 w-3 rounded-full bg-emerald-600" : "h-3 w-3 rounded-full bg-red-600"} />
                </div>
              </button>
            ))}
          </div>
          <div className={`mt-4 flex flex-wrap items-center gap-3 border-t pt-4 ${rowBorder}`}>
            <p className={`font-black ${titleText}`}>Overall Route Health</p>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">Good</span>
          </div>
        </div>
      ));
    }

    if (key === "routeEfficiency") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Route Efficiency</h2>
            <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View Details</button>
          </div>
          <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-blue-600/80">
                <div className="text-center">
                  <p className={`text-4xl font-black ${titleText}`}>{readinessScore}</p>
                  <p className={`text-xs ${mutedText}`}>Score</p>
                  <p className="mt-1 text-sm font-bold text-emerald-700">Good</p>
                </div>
              </div>
            </div>
            <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
              {routeEfficiency.map(([label, value, tone]) => (
                <button key={label} onClick={() => goToSource("Profitability")} className={`flex w-full items-center justify-between py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                  <p className={`text-sm ${mutedText}`}>{label}</p>
                  <div className="flex items-center gap-3">
                    <p className={`font-black ${titleText}`}>{value}</p>
                    <span className={tone === "good" ? "h-2 w-2 rounded-full bg-emerald-600" : "h-2 w-2 rounded-full bg-amber-500"} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ));
    }

    if (key === "teamReadiness") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Teams")} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>Team Readiness</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>Daily photo and team status.</p>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-4xl font-black text-emerald-700">{Math.round((photosUploaded / Math.max(activeTeams, 1)) * 100)}%</p>
            <p className={`text-sm ${mutedText}`}>{photosUploaded} of {activeTeams} teams uploaded photos</p>
          </div>
        </button>
      ));
    }

    if (key === "activeContracts") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Contracts")} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>Active Contracts</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>Current contract portfolio.</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div><p className={`text-sm ${mutedText}`}>Active</p><p className={`text-3xl font-black ${titleText}`}>4</p></div>
            <div><p className={`text-sm ${mutedText}`}>Watch</p><p className="text-3xl font-black text-amber-700">1</p></div>
            <div><p className={`text-sm ${mutedText}`}>At Risk</p><p className="text-3xl font-black text-red-600">1</p></div>
          </div>
        </button>
      ));
    }

    if (key === "contractPerformance") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Contracts")} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>Contract Performance</h2>
          <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
            {contractPerformance.map(([name, revenue, pct, risk]) => (
              <div key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div><p className={`font-black ${titleText}`}>{name}</p><p className={mutedText}>{revenue}</p></div>
                <div className="text-right"><p className="font-black text-emerald-700">{pct}</p><p className={risk === "At Risk" ? "text-xs font-bold text-red-600" : risk === "Watch" ? "text-xs font-bold text-amber-700" : "text-xs font-bold text-emerald-700"}>{risk}</p></div>
              </div>
            ))}
          </div>
        </button>
      ));
    }

    if (key === "upcomingRenewals") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Contracts")} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>Upcoming Renewals</h2>
          <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
            {upcomingRenewals.map(([name, date, days]) => (
              <div key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                <p className={`font-black ${titleText}`}>{name}</p>
                <div className="text-right"><p className={mutedText}>{date}</p><p className="font-bold text-blue-600">{days}</p></div>
              </div>
            ))}
          </div>
        </button>
      ));
    }

    if (key === "recentActivity") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Recent Activity</h2>
            <button onClick={() => setActiveTab("Reports")} className="text-sm font-bold text-blue-600">View All Activity</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activityItems.map(([title, detail, time, Icon, tone]) => (
              <button key={title} onClick={() => goToSource(title.includes("claim") || title.includes("Claim") ? "Claims" : title.includes("Contract") ? "Contracts" : title.includes("Report") ? "Reports" : "Profitability")} className={`flex items-center gap-4 rounded-xl p-2 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneIcon(tone)}`}><Icon className="h-6 w-6" /></span>
                <div><p className={`font-black ${titleText}`}>{title}</p><p className={`text-sm ${mutedText}`}>{detail} · {time}</p></div>
              </button>
            ))}
          </div>
        </div>
      ));
    }

    const simpleWidgets = {
      complianceStatus: ["Compliance", "Compliance Status", "Documents, insurance, and readiness.", "92%", "NAH Compliance", "text-emerald-700"],
      fuelCostTracker: ["Profitability", "Fuel Cost Tracker", "Fuel cost impact this week.", "$450.00", "Estimated weekly fuel cost", "text-amber-700"],
      documentExpirations: ["Compliance", "Document Expirations", "Upcoming document deadlines.", "2", "Items need attention", "text-red-600"],
      insuranceSummary: ["Compliance", "Insurance Summary", "Coverage and risk snapshot.", "Compliant", "1 policy expiring soon", "text-emerald-700"],
    };
    const simple = simpleWidgets[key];
    if (simple) {
      const [tab, title, subtitle, value, note, tone] = simple;
      return wrapWidget(key, (
        <button onClick={() => goToSource(tab)} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>{title}</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>{subtitle}</p>
          <p className={`mt-5 text-3xl font-black ${tone}`}>{value}</p>
          <p className={`text-sm ${mutedText}`}>{note}</p>
        </button>
      ));
    }

    return null;
  };

  return (
    <div className={pageClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={isDark ? "hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300 sm:flex" : "hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex"}>
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={isDark ? "rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-200" : "rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700"}>
                Daily Command Center
              </span>
              <span className={isDark ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200" : "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"}>
                {openClaims} open claims
              </span>
            </div>
            <h1 className={`text-3xl font-black leading-none tracking-tight sm:text-4xl ${titleText}`}>Dashboard</h1>
            <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${mutedText}`}>
              Today’s profit, claims, route health, and saved-day activity in one place.
            </p>
            {savedDaySnapshot && (
              <p className={isDark ? "mt-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200" : "mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"}>
                Viewing daily history: {savedDaySnapshot.label}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={isDark ? "rounded-2xl bg-white/5 p-1" : "rounded-2xl bg-slate-100 p-1"}>
            {["Day", "Week", "Month", "Qtr", "Year"].map((period) => (
              <button
                key={period}
                onClick={() => setDashboardPeriod(period)}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${dashboardPeriod === period
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : isDark
                      ? "text-slate-300 hover:bg-white/10"
                      : "text-slate-600 hover:bg-white"
                  }`}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveTab("Settings")}
            className="rounded-xl border border-blue-500/40 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-500/10"
          >
            Customize Dashboard
          </button>
        </div>
      </div>

      {selectedWidgetCount === 0 && (
        <div className={cardClass}>
          <p className={`text-center text-sm ${mutedText}`}>
            No dashboard widgets are turned on. Go to Settings and select the sections you want.
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        {dashboardWidgetOrder
          .filter((key) => widgets[key] !== false)
          .map((key) => renderDashboardWidget(key))}
      </div>

      {false && (
        <>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {dashboardPeriodCards.map(([label, value, tone, tab, source]) => (
          <button
            key={label}
            onClick={() => goToSource(tab)}
            className={`${isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-4 hover:border-blue-500/50 hover:bg-slate-900" : "rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50/40"} overflow-hidden text-left transition`}
          >
            <p className={`truncate text-xs font-black uppercase tracking-wide ${mutedText}`}>{dashboardPeriod} {label}</p>
            <p className={`safe-number mt-2 text-2xl font-black ${tone}`} title={value}>{value}</p>
            <p className={`mt-2 truncate text-[11px] font-bold ${mutedText}`}>{source}</p>
          </button>
        ))}
      </div>

      {selectedWidgetCount === 0 && (
        <div className={cardClass}>
          <p className={`text-center text-sm ${mutedText}`}>
            No dashboard widgets are turned on. Go to Settings and select the widgets you want. Even a dashboard needs a job, apparently.
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          {widgets.todaysProfit && (
            <button onClick={() => goToSource("Profitability")} className={`${heroClass} block w-full text-left transition hover:border-blue-500`}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black uppercase tracking-wide text-blue-600">Today's Profit</p>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">
                      Healthy Route
                    </span>
                  </div>

                  <p className={`safe-number mt-6 text-6xl font-black tracking-tight ${titleText}`} title={currency.format(todayProfit)}>{currency.format(todayProfit)}</p>
                  <p className={`mt-2 text-lg ${mutedText}`}>Net Profit Today</p>

                  <div className={`mt-6 grid max-w-md grid-cols-2 gap-4 border-t pt-5 ${rowBorder}`}>
                    <div>
                      <p className={`safe-number text-3xl font-black ${titleText}`} title={`${number.format(margin)}%`}>{number.format(margin)}%</p>
                      <p className={`text-sm ${mutedText}`}>Margin</p>
                    </div>
                    <div>
                      <p className="safe-number text-2xl font-black text-emerald-700" title={`↑ ${number.format(profitChange)}%`}>↑ {number.format(profitChange)}%</p>
                      <p className={`text-sm ${mutedText}`}>vs May 6</p>
                    </div>
                  </div>
                </div>

                <div className="h-44 min-w-[280px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashboardHeroTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="profit" stroke="#2563EB" strokeWidth={4} fill="url(#dashboardHeroTrend)" />
                      <Tooltip formatter={(value) => currency.format(value)} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </button>
          )}

          {widgets.financialSummary && (
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Revenue", currency.format(dashboardRevenue), "↑ 8.7%", DollarSign, "green", "Profitability"],
                ["Costs", currency.format(dashboardCosts), "↑ 5.1%", Calculator, "amber", "Profitability"],
                ["Claims", currency.format(periodClaimsExposure), "↓ 18.2%", ShieldCheck, "red", "Claims"],
                ["Escrow", currency.format(escrowBalance), "— 0%", ClipboardCheck, "blue", "Compliance"],
              ].map(([label, value, change, Icon, tone, tab]) => (
                <button key={label} onClick={() => goToSource(tab)} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
                  <span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(tone)}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className={`text-sm ${mutedText}`}>{label}</p>
                  <p className={`safe-number mt-2 text-2xl font-black ${titleText}`} title={value}>{value}</p>
                  <p className={tone === "amber" ? "mt-4 truncate text-sm font-bold text-amber-700" : "mt-4 truncate text-sm font-bold text-emerald-700"}>
                    {change} <span className={mutedText}>vs May 6</span>
                  </p>
                </button>
              ))}
            </div>
          )}

          {(widgets.recentClaims || widgets.savedRoutes) && (
            <div className="grid gap-6 xl:grid-cols-2">
              {widgets.recentClaims && (
                <div className={cardClass}>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className={`text-lg font-black ${titleText}`}>Recent Claims</h2>
                    <button onClick={() => setActiveTab("Claims")} className="text-sm font-bold text-blue-600">View All</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className={`border-b ${rowBorder}`}>
                        <tr className={`text-xs uppercase tracking-wide ${mutedText}`}>
                          <th className="py-3">Type</th>
                          <th className="py-3">Contract</th>
                          <th className="py-3 text-right">Amount</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentClaims.map((claim) => (
                          <tr
                            key={claim.id}
                            onClick={() => goToSource("Claims")}
                            className={`cursor-pointer border-b transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}
                          >
                            <td className={`py-3 font-semibold ${titleText}`}>{claim.type}</td>
                            <td className={`py-3 ${mutedText}`}>{claim.route || "Lowe's Appliance Delivery"}</td>
                            <td className="py-3 text-right font-black text-red-600">{currency.format(claim.amount)}</td>
                            <td className="py-3">
                              <span className={claim.status === "Open" ? "rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600" : "rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700"}>
                                {claim.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {widgets.savedRoutes && (
                <div className={cardClass}>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className={`text-lg font-black ${titleText}`}>Saved Route Performance</h2>
                    <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View All</button>
                  </div>

                  <div className="space-y-3">
                    {savedRoutes.map((row) => (
                      <button
                        key={`${row[0]}-${row[1]}`}
                        onClick={() => goToSource("Profitability")}
                        className={`grid w-full grid-cols-[64px_1fr_80px_70px] items-center gap-3 border-b pb-3 text-left text-sm transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}
                      >
                        <p className={mutedText}>{row[0]}</p>
                        <p className={`font-semibold ${titleText}`}>{row[1]}</p>
                        <p className={`text-right font-black ${titleText}`}>{currency.format(row[2])}</p>
                        <p className="text-right font-black text-emerald-700">{number.format(row[3] * 100)}%</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(widgets.activeContracts || widgets.contractPerformance || widgets.upcomingRenewals) && (
            <div className="grid gap-6 xl:grid-cols-2">
              {widgets.activeContracts && (
                <button onClick={() => goToSource("Contracts")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
                  <h2 className={`text-lg font-black ${titleText}`}>Active Contracts</h2>
                  <p className={`mt-1 text-sm ${mutedText}`}>Current contract portfolio.</p>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div>
                      <p className={`text-sm ${mutedText}`}>Active</p>
                      <p className={`text-3xl font-black ${titleText}`}>4</p>
                    </div>
                    <div>
                      <p className={`text-sm ${mutedText}`}>Watch</p>
                      <p className="text-3xl font-black text-amber-700">1</p>
                    </div>
                    <div>
                      <p className={`text-sm ${mutedText}`}>At Risk</p>
                      <p className="text-3xl font-black text-red-600">1</p>
                    </div>
                  </div>
                </button>
              )}

              {widgets.contractPerformance && (
                <button onClick={() => goToSource("Contracts")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
                  <h2 className={`text-lg font-black ${titleText}`}>Contract Performance</h2>
                  <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                    {contractPerformance.map(([name, revenue, pct, risk]) => (
                      <div key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div>
                          <p className={`font-black ${titleText}`}>{name}</p>
                          <p className={mutedText}>{revenue}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-700">{pct}</p>
                          <p className={risk === "At Risk" ? "text-xs font-bold text-red-600" : risk === "Watch" ? "text-xs font-bold text-amber-700" : "text-xs font-bold text-emerald-700"}>{risk}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              )}

              {widgets.upcomingRenewals && (
                <button onClick={() => goToSource("Contracts")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
                  <h2 className={`text-lg font-black ${titleText}`}>Upcoming Renewals</h2>
                  <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                    {upcomingRenewals.map(([name, date, days]) => (
                      <div key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <p className={`font-black ${titleText}`}>{name}</p>
                        <div className="text-right">
                          <p className={mutedText}>{date}</p>
                          <p className="font-bold text-blue-600">{days}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6 xl:col-span-5">
          {widgets.needsAttention && (
            <div className={cardClass}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-red-600">Needs Attention</p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className={`text-5xl font-black ${titleText}`}>{needsAttention.length}</p>
                    <p className={`pb-2 text-base ${mutedText}`}>Active Issues</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("Compliance")}
                  className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15" : "rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"}
                >
                  View All Issues
                </button>
              </div>

              <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                {needsAttention.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.title} onClick={() => goToSource(item.tab)} className={`flex w-full items-center gap-4 py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneIcon(item.tone)}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold ${titleText}`}>{item.title}</p>
                        <p className={`text-sm ${mutedText}`}>{item.detail}</p>
                      </div>
                      <span className="text-xl text-slate-400">›</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {widgets.routeHealth && (
            <div className={cardClass}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className={`text-lg font-black ${titleText}`}>Route Health</h2>
                <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View Details</button>
              </div>

              <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                {routeHealth.map(([label, value, status]) => (
                  <button key={label} onClick={() => goToSource("Profitability")} className={`flex w-full items-center justify-between py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                    <p className={`text-sm font-semibold ${mutedText}`}>{label}</p>
                    <div className="flex items-center gap-3">
                      <p className={status === "Good" ? `font-black ${titleText}` : "font-black text-red-600"}>{value}</p>
                      <span className={status === "Good" ? "h-3 w-3 rounded-full bg-emerald-600" : "h-3 w-3 rounded-full bg-red-600"} />
                    </div>
                  </button>
                ))}
              </div>

              <div className={`mt-4 flex flex-wrap items-center gap-3 border-t pt-4 ${rowBorder}`}>
                <p className={`font-black ${titleText}`}>Overall Route Health</p>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">Good</span>
                <p className={`text-sm ${mutedText}`}>You're performing well. Keep it up.</p>
              </div>
            </div>
          )}

          {widgets.routeEfficiency && (
            <div className={cardClass}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className={`text-lg font-black ${titleText}`}>Route Efficiency</h2>
                <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View Details</button>
              </div>

              <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-blue-600/80">
                    <div className="text-center">
                      <p className={`text-4xl font-black ${titleText}`}>{readinessScore}</p>
                      <p className={`text-xs ${mutedText}`}>Score</p>
                      <p className="mt-1 text-sm font-bold text-emerald-700">Good</p>
                    </div>
                  </div>
                </div>

                <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                  {routeEfficiency.map(([label, value, tone]) => (
                    <button key={label} onClick={() => goToSource("Profitability")} className={`flex w-full items-center justify-between py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                      <p className={`text-sm ${mutedText}`}>{label}</p>
                      <div className="flex items-center gap-3">
                        <p className={`font-black ${titleText}`}>{value}</p>
                        <span className={tone === "good" ? "h-2 w-2 rounded-full bg-emerald-600" : "h-2 w-2 rounded-full bg-amber-500"} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <p className={`mt-4 text-sm ${mutedText}`}>Keep optimizing your route to improve efficiency.</p>
            </div>
          )}

          {widgets.teamReadiness && (
            <button onClick={() => goToSource("Teams")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Team Readiness</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Daily photo and team status.</p>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-4xl font-black text-emerald-700">{Math.round((photosUploaded / Math.max(activeTeams, 1)) * 100)}%</p>
                <p className={`text-sm ${mutedText}`}>{photosUploaded} of {activeTeams} teams uploaded photos</p>
              </div>
            </button>
          )}

          {widgets.complianceStatus && (
            <button onClick={() => goToSource("Compliance")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Compliance Status</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Documents, insurance, and readiness.</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${mutedText}`}>NAH Compliance</p>
                  <p className="text-3xl font-black text-emerald-700">92%</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Open Issues</p>
                  <p className="text-3xl font-black text-amber-700">3</p>
                </div>
              </div>
            </button>
          )}

          {widgets.fuelCostTracker && (
            <button onClick={() => goToSource("Profitability")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Fuel Cost Tracker</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Fuel cost impact this week.</p>
              <p className="mt-5 text-3xl font-black text-amber-700">$450.00</p>
              <p className={`text-sm ${mutedText}`}>Estimated weekly fuel cost</p>
            </button>
          )}

          {widgets.documentExpirations && (
            <button onClick={() => goToSource("Compliance")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Document Expirations</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Upcoming document deadlines.</p>
              <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                <p className="py-3 text-sm font-bold text-amber-700">Cargo insurance expires soon</p>
                <p className="py-3 text-sm font-bold text-red-600">Team C photo missing</p>
              </div>
            </button>
          )}

          {widgets.insuranceSummary && (
            <button onClick={() => goToSource("Compliance")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Insurance Summary</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Coverage and risk snapshot.</p>
              <p className="mt-5 text-3xl font-black text-emerald-700">Compliant</p>
              <p className={`text-sm ${mutedText}`}>1 policy expiring soon</p>
            </button>
          )}
        </div>
      </div>

      {widgets.recentActivity && (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Recent Activity</h2>
            <button onClick={() => setActiveTab("Reports")} className="text-sm font-bold text-blue-600">View All Activity</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activityItems.map(([title, detail, time, Icon, tone]) => (
              <button
                key={title}
                onClick={() => goToSource(title.includes("claim") || title.includes("Claim") ? "Claims" : title.includes("Contract") ? "Contracts" : title.includes("Report") ? "Reports" : "Profitability")}
                className={`flex items-center gap-4 rounded-xl p-2 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneIcon(tone)}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className={`font-black ${titleText}`}>{title}</p>
                  <p className={`text-sm ${mutedText}`}>{detail} · {time}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default DashboardHome;
