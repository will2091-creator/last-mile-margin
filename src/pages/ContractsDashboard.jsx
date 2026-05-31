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

function ContractsDashboard({ teams, claims, isDark, navigateToTab }) {
  const [selectedContractId, setSelectedContractId] = useState("LOWES-APPL");
  const [selectedContractTab, setSelectedContractTab] = useState("Overview");
  const [isEditingContract, setIsEditingContract] = useState(false);

  const [contracts, setContracts] = useState([
    {
      id: "LOWES-APPL",
      name: "Lowe's Appliance Delivery",
      customer: "Lowe's",
      customerType: "Retail",
      location: "Syracuse, NY",
      type: "Appliance Delivery",
      payStructure: "$1,200 / route",
      payType: "Flat Rate",
      routePay: 1200,
      perStop: 75,
      installPay: 25,
      monthlyRevenue: 15600,
      margin: 26.5,
      status: "Active",
      risk: "Watch",
      team: "Team D",
      drivers: "3 Drivers, 3 Helpers",
      schedule: "Mon – Sat · 7:00 AM – 7:00 PM",
      startDate: "Jan 1, 2025",
      renewalDate: "Dec 31, 2025",
      renewalDays: 243,
      overview: "Deliver and install appliances for customers within assigned zip codes.",
      logo: "LOW",
      notes: "High claims exposure. Monitor claim frequency and severity.",
    },
    {
      id: "HD-LARGE",
      name: "Home Depot Large Item Delivery",
      customer: "Home Depot",
      customerType: "Retail",
      location: "Syracuse, NY",
      type: "Large Item Delivery",
      payStructure: "$950 / route",
      payType: "Flat Rate",
      routePay: 950,
      perStop: 65,
      installPay: 0,
      monthlyRevenue: 19000,
      margin: 24.1,
      status: "Active",
      risk: "Low",
      team: "Team A",
      drivers: "2 Drivers, 2 Helpers",
      schedule: "Mon – Fri · 8:00 AM – 6:00 PM",
      startDate: "Jan 15, 2025",
      renewalDate: "Jan 31, 2026",
      renewalDays: 274,
      overview: "Large item delivery with scheduled residential drop-offs and room-of-choice service.",
      logo: "HD",
      notes: "Stable performance. Keep monitoring margin against labor cost.",
    },
    {
      id: "BB-TECH",
      name: "Best Buy Tech Delivery",
      customer: "Best Buy",
      customerType: "Retail",
      location: "Syracuse, NY",
      type: "Tech Delivery",
      payStructure: "$75 / stop",
      payType: "Per Stop",
      routePay: 0,
      perStop: 75,
      installPay: 35,
      monthlyRevenue: 13200,
      margin: 22.3,
      status: "Active",
      risk: "At Risk",
      team: "Team B",
      drivers: "2 Drivers, 1 Helper",
      schedule: "Tue – Sat · 9:00 AM – 7:00 PM",
      startDate: "Mar 1, 2025",
      renewalDate: "Mar 15, 2026",
      renewalDays: 317,
      overview: "Tech delivery and basic setup services across assigned market.",
      logo: "BB",
      notes: "Margin is thin and claim exposure needs review.",
    },
    {
      id: "RC-FURN",
      name: "RC Willey Furniture Delivery",
      customer: "RC Willey",
      customerType: "Retail",
      location: "Utica, NY",
      type: "Furniture Delivery",
      payStructure: "$1,100 / route",
      payType: "Flat Rate",
      routePay: 1100,
      perStop: 55,
      installPay: 0,
      monthlyRevenue: 20700,
      margin: 28.8,
      status: "Active",
      risk: "Low",
      team: "Team C",
      drivers: "2 Drivers, 2 Helpers",
      schedule: "Mon – Sat · 8:00 AM – 6:00 PM",
      startDate: "Jun 1, 2025",
      renewalDate: "Jun 30, 2026",
      renewalDays: 424,
      overview: "Furniture delivery with white-glove placement and customer damage prevention expectations.",
      logo: "RC",
      notes: "Strong margin, but team claim activity should be watched.",
    },
  ]);

  const contractTypeOptions = [
    "Appliance Delivery",
    "Large Item Delivery",
    "Tech Delivery",
    "Furniture Delivery",
    "Mattress Delivery",
    "White Glove Delivery",
    "Delivery Contract",
  ];

  const addContract = () => {
    const newId = `CONTRACT-${Date.now()}`;
    const newContract = {
      id: newId,
      name: "New Contract",
      customer: "New Customer",
      customerType: "Retail",
      location: "New Market",
      type: "Delivery Contract",
      payStructure: "$0 / route",
      payType: "Flat Rate",
      routePay: 0,
      perStop: 0,
      installPay: 0,
      monthlyRevenue: 0,
      margin: 0,
      status: "Pending",
      risk: "Watch",
      team: teams[0]?.name || "Unassigned",
      drivers: "Not assigned",
      schedule: "Not scheduled",
      startDate: new Date().toLocaleDateString(),
      renewalDate: "Not set",
      renewalDays: 0,
      overview: "New contract added. Update contract details when edit mode is added.",
      logo: "NEW",
      notes: "New contract needs terms, team assignment, and compliance requirements.",
    };

    setContracts((current) => [newContract, ...current]);
    setSelectedContractId(newId);
    setSelectedContractTab("Overview");
  };

  const isViewingAllContracts = selectedContractId === "ALL";
  const selectedContract = isViewingAllContracts ? contracts[0] : contracts.find((contract) => contract.id === selectedContractId) || contracts[0];

  const updateContractField = (key, value) => {
    const numberFields = ["routePay", "perStop", "installPay", "monthlyRevenue", "margin", "renewalDays"];
    const nextValue = numberFields.includes(key) ? Number(value || 0) : value;

    setContracts((current) =>
      current.map((contract) => {
        if (contract.id !== selectedContractId) return contract;

        const updatedContract = {
          ...contract,
          [key]: nextValue,
        };

        if (["routePay", "payType"].includes(key)) {
          updatedContract.payStructure =
            updatedContract.payType === "Per Stop"
              ? `${currency.format(updatedContract.perStop)} / stop`
              : `${currency.format(updatedContract.routePay)} / route`;
        }

        if (key === "perStop" && updatedContract.payType === "Per Stop") {
          updatedContract.payStructure = `${currency.format(nextValue)} / stop`;
        }

        return updatedContract;
      })
    );
  };

  useEffect(() => {
    setSelectedContractTab("Overview");
    setIsEditingContract(false);
  }, [selectedContractId]);

  const totalRevenue = contracts.reduce((sum, contract) => sum + contract.monthlyRevenue, 0);
  const averageMargin = contracts.reduce((sum, contract) => sum + contract.margin, 0) / Math.max(contracts.length, 1);
  const atRiskContracts = contracts.filter((contract) => contract.risk === "At Risk" || contract.risk === "Watch").length;
  const totalClaimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const allContractsRisk = atRiskContracts > 0 ? `${atRiskContracts} Need Review` : "Low";
  const getClaimDriver = (claim) => {
    if (claim.driver) return claim.driver;
    const matchingTeam = teams.find((team) => team.name === claim.team);
    return matchingTeam?.lead || "";
  };
  const selectedTeam = teams.find((team) => team.name === selectedContract.team);
  const selectedDrivers = [selectedTeam?.lead, selectedTeam?.helper].filter(Boolean);
  const selectedClaims = isViewingAllContracts ? claims : claims.filter((claim) => selectedDrivers.includes(getClaimDriver(claim)));
  const selectedExposure = isViewingAllContracts ? totalClaimsExposure : selectedClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const rowBorder = isDark ? "border-white/10" : "border-slate-200";
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500";

  const riskClass = (risk) => {
    if (risk === "At Risk") return isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700";
    if (risk === "Watch") return isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700";
    return isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700";
  };

  const statusClass = (status) => {
    if (status === "Active") return isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700";
    if (status === "Pending") return isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700";
    return isDark ? "bg-slate-500/10 text-slate-300" : "bg-slate-100 text-slate-700";
  };

  const logoClass = (logo) => {
    if (logo === "LOW") return "bg-blue-700 text-white";
    if (logo === "HD") return "bg-orange-600 text-white";
    if (logo === "BB") return "bg-blue-600 text-white";
    return isDark ? "bg-white/10 text-white" : "bg-slate-900 text-white";
  };

  const kpis = [
    {
      label: "Active Contracts",
      value: contracts.length,
      note: "1 vs prior 30 days",
      icon: FileText,
      tone: "blue",
    },
    {
      label: "Monthly Revenue",
      value: currency.format(totalRevenue),
      note: "12.4% vs prior 30 days",
      icon: DollarSign,
      tone: "green",
    },
    {
      label: "Average Margin",
      value: `${number.format(averageMargin)}%`,
      note: "3.1% vs prior 30 days",
      icon: BarChart3,
      tone: "blue",
    },
    {
      label: "At-Risk Contracts",
      value: atRiskContracts,
      note: "1 vs prior 30 days",
      icon: AlertTriangle,
      tone: "amber",
    },
  ];

  const toneClass = (tone) => {
    if (tone === "green") return isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700";
    if (tone === "amber") return isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700";
    return isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700";
  };

  const customerLogoBlock = (contract) => {
    const isLowes = contract.customer?.toLowerCase().includes("lowe");

    if (isLowes) {
      return (
        <div className="flex h-16 w-32 shrink-0 items-center justify-center">
          <div className="relative flex h-12 w-28 items-center justify-center bg-blue-700 text-white shadow-sm">
            <div className="absolute -top-3 left-1/2 h-7 w-16 -translate-x-1/2 bg-blue-700 [clip-path:polygon(50%_0%,100%_100%,0%_100%)]" />
            <span className="relative z-10 text-2xl font-black tracking-tight">Lowe's</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex h-16 w-32 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${logoClass(contract.logo)}`}>
        {contract.logo}
      </div>
    );
  };

  return (
    <div className={isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950"}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className={`text-3xl font-black tracking-tight sm:text-4xl ${titleText}`}>Contracts</h1>
          <p className={`mt-2 text-sm sm:text-base ${mutedText}`}>
            Manage your delivery contracts, terms, performance, and compliance.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={addContract}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-500"
          >
            + Add Contract
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={cardClass}>
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${toneClass(kpi.tone)}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${mutedText}`}>{kpi.label}</p>
                  <p className={`mt-2 text-2xl font-black ${titleText}`}>{kpi.value}</p>
                  <p className={kpi.tone === "amber" ? "mt-1 text-xs font-bold text-red-600" : "mt-1 text-xs font-bold text-emerald-700"}>
                    ↗ {kpi.note}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6">
        <div className={isDark ? "rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 shadow-xl shadow-black/20" : "rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm"}>
          <div className="grid gap-5 lg:grid-cols-[1fr_minmax(360px,620px)] lg:items-center">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-base font-black ${isViewingAllContracts ? "bg-blue-600 text-white" : logoClass(selectedContract.logo)}`}>
                {isViewingAllContracts ? "ALL" : selectedContract.logo}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">Viewing Contract</p>
                <h2 className={`mt-1 text-2xl font-black leading-tight ${titleText}`}>{isViewingAllContracts ? "All Contracts" : selectedContract.name}</h2>
                <p className={`mt-1 text-sm ${mutedText}`}>{isViewingAllContracts ? `${contracts.length} contracts shown together` : `${selectedContract.customer} · ${selectedContract.location}`}</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-blue-600">Change Contract</label>
              <select
                value={isViewingAllContracts ? "ALL" : selectedContract.id}
                onChange={(event) => setSelectedContractId(event.target.value)}
                className={
                  isDark
                    ? "w-full rounded-2xl border-2 border-blue-400/60 bg-slate-950 px-5 py-4 text-lg font-black text-white shadow-lg shadow-black/20 outline-none focus:border-blue-300"
                    : "w-full rounded-2xl border-2 border-blue-300 bg-white px-5 py-4 text-lg font-black text-slate-950 shadow-sm outline-none focus:border-blue-600"
                }
              >
                <option value="ALL">View All Contracts</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}
                  </option>
                ))}
              </select>
              <p className={`mt-2 text-xs font-semibold ${mutedText}`}>{contracts.length} contracts available</p>
            </div>
          </div>

          <div className={`mt-5 grid gap-3 border-t pt-4 md:grid-cols-4 ${rowBorder}`}>
            <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4" : "rounded-2xl border border-blue-100 bg-white p-4"}>
              <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Risk Status</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-sm font-black ${isViewingAllContracts ? riskClass(atRiskContracts > 0 ? "Watch" : "Low") : riskClass(selectedContract.risk)}`}>
                {isViewingAllContracts ? allContractsRisk : selectedContract.risk}
              </span>
            </div>
            <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4" : "rounded-2xl border border-blue-100 bg-white p-4"}>
              <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Claims Exposure</p>
              <p className={selectedExposure > 1000 ? "mt-2 text-xl font-black text-red-600" : selectedExposure > 0 ? "mt-2 text-xl font-black text-orange-600" : "mt-2 text-xl font-black text-emerald-700"}>
                {currency.format(selectedExposure)}
              </p>
            </div>
            <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4" : "rounded-2xl border border-blue-100 bg-white p-4"}>
              <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Margin</p>
              <p className={(isViewingAllContracts ? averageMargin : selectedContract.margin) >= 25 ? "mt-2 text-xl font-black text-emerald-700" : (isViewingAllContracts ? averageMargin : selectedContract.margin) >= 20 ? "mt-2 text-xl font-black text-orange-600" : "mt-2 text-xl font-black text-red-600"}>
                {number.format(isViewingAllContracts ? averageMargin : selectedContract.margin)}%
              </p>
            </div>
            <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4" : "rounded-2xl border border-blue-100 bg-white p-4"}>
              <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Contract Status</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-sm font-black ${isViewingAllContracts ? statusClass("Active") : statusClass(selectedContract.status)}`}>
                {isViewingAllContracts ? `${contracts.length} Active` : selectedContract.status}
              </span>
            </div>
          </div>
        </div>

        {isViewingAllContracts ? (
          <div className={`${cardClass} min-w-0 overflow-hidden`}>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`text-xl font-black ${titleText}`}>All Contracts</h2>
                <p className={`text-sm ${mutedText}`}>Review every contract together, then choose one from the dropdown when you need details.</p>
              </div>
              <p className={`text-sm font-bold ${mutedText}`}>{contracts.length} total contracts</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wide ${mutedText}`}>
                    <th className="border-b py-3 pr-4">Contract</th>
                    <th className="border-b py-3 pr-4">Customer</th>
                    <th className="border-b py-3 pr-4">Type</th>
                    <th className="border-b py-3 pr-4 text-right">Revenue</th>
                    <th className="border-b py-3 pr-4 text-right">Margin</th>
                    <th className="border-b py-3 pr-4">Risk</th>
                    <th className="border-b py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className={`border-b ${rowBorder}`}>
                      <td className={`border-b py-4 pr-4 ${rowBorder}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${logoClass(contract.logo)}`}>
                            {contract.logo}
                          </div>
                          <div>
                            <p className={`font-black ${titleText}`}>{contract.name}</p>
                            <p className={`text-xs ${mutedText}`}>{contract.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`border-b py-4 pr-4 font-bold ${isDark ? "text-slate-300" : "text-slate-700"} ${rowBorder}`}>{contract.customer}</td>
                      <td className={`border-b py-4 pr-4 ${isDark ? "text-slate-300" : "text-slate-700"} ${rowBorder}`}>{contract.type}</td>
                      <td className={`border-b py-4 pr-4 text-right font-black ${titleText} ${rowBorder}`}>{currency.format(contract.monthlyRevenue)}</td>
                      <td className={`border-b py-4 pr-4 text-right font-black ${contract.margin >= 25 ? "text-emerald-700" : contract.margin >= 20 ? "text-orange-600" : "text-red-600"} ${rowBorder}`}>{contract.margin}%</td>
                      <td className={`border-b py-4 pr-4 ${rowBorder}`}>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${riskClass(contract.risk)}`}>{contract.risk}</span>
                      </td>
                      <td className={`border-b py-4 text-right ${rowBorder}`}>
                        <button
                          onClick={() => setSelectedContractId(contract.id)}
                          className={isDark ? "rounded-lg border border-white/10 px-3 py-1.5 text-xs font-black text-white hover:bg-white/10" : "rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-50"}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
        <div className={`${cardClass} min-w-0 overflow-hidden`}>
          <div className={isDark ? "mb-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4" : "mb-6 rounded-2xl border border-blue-300 bg-white p-4 shadow-sm"}>
            <div className="grid min-w-0 gap-5 xl:grid-cols-[140px_minmax(220px,1fr)_minmax(150px,0.65fr)_minmax(160px,0.7fr)] xl:items-center">
              <div className="flex items-center justify-start">
                {customerLogoBlock(selectedContract)}
              </div>

              <div className={isDark ? "min-w-0 border-t border-white/10 pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0" : "min-w-0 border-t border-slate-200 pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0"}>
                <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Customer</p>
                <h2 className={`mt-2 break-words text-xl font-black leading-tight ${titleText}`}>{selectedContract.name}</h2>
                <p className={`mt-3 text-sm font-semibold ${mutedText}`}>⌖ {selectedContract.location}</p>
              </div>

              <div className={isDark ? "min-w-0 border-t border-white/10 pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0" : "min-w-0 border-t border-slate-200 pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0"}>
                <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Customer Short Name</p>
                <p className={`mt-2 break-words text-lg font-black ${titleText}`}>{selectedContract.customer}</p>
              </div>

              <div className={isDark ? "min-w-0 border-t border-white/10 pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0" : "min-w-0 border-t border-slate-200 pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0"}>
                <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Commodity</p>
                <p className={`mt-2 break-words text-lg font-black ${titleText}`}>{selectedContract.type}</p>
              </div>
            </div>

            <div className={isDark ? "mt-5 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-[1fr_1fr_auto]" : "mt-5 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-[1fr_1fr_auto]"}>
              <div>
                <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Route</p>
                <p className={`mt-2 text-xl font-black ${titleText}`}>{selectedContract.routePay || selectedContract.perStop || 0}</p>
              </div>

              <div>
                <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Rate Type</p>
                <p className={`mt-2 text-lg font-black ${titleText}`}>{selectedContract.payType}</p>
              </div>

              <div className="flex items-end justify-start md:justify-end">
                <button
                  onClick={() => setIsEditingContract((current) => !current)}
                  className={
                    isDark
                      ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
                      : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-blue-600 shadow-sm hover:bg-slate-50"
                  }
                >
                  {isEditingContract ? "Done Editing" : "Edit Contract"}
                </button>
              </div>
            </div>
          </div>

          <div className={`mb-6 flex gap-6 overflow-x-auto border-b pb-3 text-sm font-bold ${rowBorder}`}>
            {["Overview", "Requirements", "Performance", "Compliance", "Notes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedContractTab(tab)}
                className={
                  selectedContractTab === tab
                    ? "whitespace-nowrap border-b-2 border-blue-600 pb-3 text-blue-600"
                    : `whitespace-nowrap pb-3 ${mutedText} hover:text-blue-600`
                }
              >
                {tab}
              </button>
            ))}
          </div>

          {isEditingContract && (
            <div className={isDark ? "mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5" : "mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-5"}>
              <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className={`text-lg font-black ${titleText}`}>Edit Contract Details</h3>
                  <p className={`text-sm ${mutedText}`}>Update the contract name, pay structure, rates, schedule, and notes.</p>
                </div>
                <button
                  onClick={() => setIsEditingContract(false)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
                >
                  Save Changes
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Contract Name", "name", "text"],
                  ["Customer", "customer", "text"],
                  ["Customer Type", "customerType", "text"],
                  ["Location / Market", "location", "text"],
                  ["Service Type", "type", "text"],
                  ["Assigned Team", "team", "text"],
                  ["Crew / Drivers", "drivers", "text"],
                  ["Schedule", "schedule", "text"],
                  ["Start Date", "startDate", "text"],
                  ["Renewal Date", "renewalDate", "text"],
                  ["Renewal Days", "renewalDays", "number"],
                  ["Monthly Revenue", "monthlyRevenue", "number"],
                  ["Route Pay", "routePay", "number"],
                  ["Per Stop Pay", "perStop", "number"],
                  ["Install Pay", "installPay", "number"],
                  ["Margin %", "margin", "number"],
                  ["Logo Text", "logo", "text"],
                ].map(([label, key, type]) => (
                  <div key={key}>
                    <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</label>
                    <input
                      type={type}
                      value={selectedContract[key]}
                      onChange={(event) => updateContractField(key, event.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}

                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Pay Type</label>
                  <select
                    value={selectedContract.payType}
                    onChange={(event) => updateContractField("payType", event.target.value)}
                    className={inputClass}
                  >
                    <option>Flat Rate</option>
                    <option>Per Stop</option>
                    <option>Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Status</label>
                  <select
                    value={selectedContract.status}
                    onChange={(event) => updateContractField("status", event.target.value)}
                    className={inputClass}
                  >
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Risk</label>
                  <select
                    value={selectedContract.risk}
                    onChange={(event) => updateContractField("risk", event.target.value)}
                    className={inputClass}
                  >
                    <option>Low</option>
                    <option>Watch</option>
                    <option>At Risk</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Overview</label>
                  <textarea
                    value={selectedContract.overview}
                    onChange={(event) => updateContractField("overview", event.target.value)}
                    className={`${inputClass} min-h-28`}
                  />
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Notes</label>
                  <textarea
                    value={selectedContract.notes}
                    onChange={(event) => updateContractField("notes", event.target.value)}
                    className={`${inputClass} min-h-28`}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedContractTab !== "Overview" && (
            <div className={isDark ? "mb-5 rounded-2xl border border-white/10 bg-white/5 p-5" : "mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-5"}>
              {selectedContractTab === "Requirements" && (
                <div>
                  <h3 className={`text-lg font-black ${titleText}`}>Operating Requirements</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                      ["Coverage", selectedContract.schedule],
                      ["Assigned Team", selectedContract.team],
                      ["Crew Requirement", selectedContract.drivers],
                      ["Service Type", selectedContract.type],
                      ["Market", selectedContract.location],
                      ["Pay Type", selectedContract.payType],
                    ].map(([label, value]) => (
                      <div key={label} className={isDark ? "rounded-xl bg-slate-950/70 p-4" : "rounded-xl bg-white p-4"}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${mutedText}`}>{label}</p>
                        <p className={`mt-2 font-black ${titleText}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedContractTab === "Performance" && (
                <div>
                  <h3 className={`text-lg font-black ${titleText}`}>Performance</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                      ["Monthly Revenue", currency.format(selectedContract.monthlyRevenue), "text-emerald-700"],
                      ["Margin", `${selectedContract.margin}%`, "text-emerald-700"],
                      ["Claims Exposure", currency.format(selectedExposure), "text-red-600"],
                    ].map(([label, value, tone]) => (
                      <div key={label} className={isDark ? "rounded-xl bg-slate-950/70 p-4" : "rounded-xl bg-white p-4"}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${mutedText}`}>{label}</p>
                        <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedContractTab === "Compliance" && (
                <div>
                  <h3 className={`text-lg font-black ${titleText}`}>Compliance</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      ["Insurance on file", "Complete", "green"],
                      ["Driver documentation", "Complete", "green"],
                      ["Daily photo compliance", "Watch", "amber"],
                      ["Renewal review", selectedContract.renewalDate, "blue"],
                    ].map(([label, value, tone]) => (
                      <div key={label} className={isDark ? "flex items-center justify-between rounded-xl bg-slate-950/70 p-4" : "flex items-center justify-between rounded-xl bg-white p-4"}>
                        <p className={`font-bold ${titleText}`}>{label}</p>
                        <span className={tone === "green" ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700" : tone === "amber" ? "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700" : "rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-600"}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedContractTab === "Notes" && (
                <div>
                  <h3 className={`text-lg font-black ${titleText}`}>Notes</h3>
                  <p className={`mt-3 text-sm leading-relaxed ${mutedText}`}>{selectedContract.notes}</p>
                  <div className={isDark ? "mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4" : "mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"}>
                    <p className="font-black text-amber-700">Recommended Actions</p>
                    <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <li>Review claims exposure weekly.</li>
                      <li>Confirm team readiness before dispatch.</li>
                      <li>Monitor margin and renewal timing.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-5">
            <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <p className={`text-lg font-black ${titleText}`}>Contract Overview</p>
                  <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>{selectedContract.overview}</p>
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-2">
              <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <p className={`text-lg font-black ${titleText}`}>Pay Structure</p>
                </div>

                <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                  {[
                    ["Route Pay (Flat)", currency.format(selectedContract.routePay)],
                    ["Per Additional Stop", currency.format(selectedContract.perStop)],
                    ["Installation Pay", currency.format(selectedContract.installPay)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-3">
                      <p className={`text-sm font-semibold ${mutedText}`}>{label}</p>
                      <p className={`whitespace-nowrap text-sm font-black ${titleText}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <p className={`text-lg font-black ${titleText}`}>Financials</p>
                </div>

                <div className="grid gap-4 2xl:grid-cols-2">
                  <div className={isDark ? "min-w-0 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4" : "min-w-0 rounded-xl border border-emerald-100 bg-emerald-50 p-4"}>
                    <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Monthly Revenue</p>
                    <p className={`mt-2 truncate text-xl font-black tracking-tight ${titleText}`}>{currency.format(selectedContract.monthlyRevenue)}</p>
                    <p className="mt-2 text-xs font-bold leading-tight text-emerald-700">↗ 8.3% vs prior 30 days</p>
                  </div>

                  <div className={isDark ? "min-w-0 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4" : "min-w-0 rounded-xl border border-emerald-100 bg-emerald-50 p-4"}>
                    <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Margin</p>
                    <p className={`mt-2 truncate text-xl font-black tracking-tight ${titleText}`}>{selectedContract.margin}%</p>
                    <p className="mt-2 text-xs font-bold leading-tight text-emerald-700">↗ Healthy</p>
                  </div>
                </div>
              </div>

              <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <p className={`text-lg font-black ${titleText}`}>Schedule</p>
                </div>

                <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <p className={`text-sm font-semibold ${mutedText}`}>Operating Days</p>
                    <p className={`font-black ${titleText}`}>Mon – Sat</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <p className={`text-sm font-semibold ${mutedText}`}>Hours</p>
                    <p className={`font-black ${titleText}`}>7:00 AM – 7:00 PM</p>
                  </div>
                </div>
              </div>

              <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className={`text-lg font-black ${titleText}`}>Claims Exposure</p>
                </div>

                <div className="grid gap-4 2xl:grid-cols-2">
                  <div className={isDark ? "min-w-0 rounded-xl border border-red-500/20 bg-red-500/10 p-4" : "min-w-0 rounded-xl border border-red-100 bg-red-50 p-4"}>
                    <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Open Claims</p>
                    <p className={`mt-2 text-xl font-black ${titleText}`}>{selectedClaims.length}</p>
                    <button onClick={() => navigateToTab?.("Claims")} className="mt-3 text-xs font-bold text-blue-600">View Claims →</button>
                  </div>

                  <div className={isDark ? "min-w-0 rounded-xl border border-red-500/20 bg-red-500/10 p-4" : "min-w-0 rounded-xl border border-red-100 bg-red-50 p-4"}>
                    <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Total Exposure</p>
                    <p className="mt-2 truncate text-xl font-black tracking-tight text-red-600">{currency.format(selectedExposure)}</p>
                    <p className="mt-2 text-xs font-bold leading-tight text-red-600">↗ 15.2% vs prior 30 days</p>
                  </div>
                </div>
              </div>

              <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className={`text-lg font-black ${titleText}`}>Teams Assigned</p>
                </div>

                <p className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-600">{selectedContract.team}</p>
                <p className={`mt-3 text-sm ${mutedText}`}>{selectedContract.drivers}</p>
                <button onClick={() => navigateToTab?.("Teams")} className={isDark ? "mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15" : "mt-4 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50"}>
                  View Team Details
                </button>
              </div>

              <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <p className={`text-lg font-black ${titleText}`}>Contract Dates</p>
                </div>

                <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <p className={`text-sm font-semibold ${mutedText}`}>Start Date</p>
                    <p className={`font-black ${titleText}`}>{selectedContract.startDate}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <p className={`text-sm font-semibold ${mutedText}`}>Renewal Date</p>
                    <p className={`font-black ${titleText}`}>{selectedContract.renewalDate}</p>
                  </div>
                </div>

                <button onClick={() => setSelectedContractTab("Notes")} className={isDark ? "mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15" : "mt-4 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50"}>
                  View Contract History
                </button>
              </div>
            </div>

            <div className={isDark ? "rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5" : "rounded-2xl border border-amber-200 bg-amber-50 p-5"}>
              <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                <div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={selectedContract.risk === "Low" ? "h-6 w-6 text-emerald-700" : "h-6 w-6 text-amber-700"} />
                    <p className={`text-lg font-black ${titleText}`}>Risk Status</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${riskClass(selectedContract.risk)}`}>{selectedContract.risk}</span>
                  </div>

                  <p className={`mt-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{selectedContract.notes}</p>

                  <div className={`mt-4 border-t pt-4 ${isDark ? "border-white/10" : "border-amber-200"}`}>
                    <p className={`font-black ${titleText}`}>Why this contract is at risk</p>
                    <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <li>Claims exposure is above your average</li>
                      <li>{selectedClaims.length} open claim requires attention</li>
                    </ul>
                  </div>
                </div>

                <div className={isDark ? "rounded-xl border border-amber-500/20 bg-black/10 p-4" : "rounded-xl border border-amber-200 bg-white/60 p-4"}>
                  <p className="font-black text-amber-700">Recommended Actions</p>
                  <div className={`mt-3 space-y-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    <p>• Review open claim details</p>
                    <p>• Monitor claims frequency</p>
                    <p>• Ensure compliance requirements are met</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className={cardClass}>
          <h2 className={`text-lg font-black ${titleText}`}>Contracts at a Glance</h2>
          <p className={`text-sm ${mutedText}`}>By monthly revenue.</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={contracts.map((contract) => ({ name: contract.name, value: contract.monthlyRevenue }))} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2}>
                    {contracts.map((contract, index) => (
                      <Cell key={contract.id} fill={["#2563EB", "#F97316", "#0EA5E9", "#64748B"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => currency.format(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {contracts.map((contract, index) => {
                const pct = totalRevenue ? (contract.monthlyRevenue / totalRevenue) * 100 : 0;
                return (
                  <div key={contract.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ["#2563EB", "#F97316", "#0EA5E9", "#64748B"][index % 4] }} />
                      <p className={`text-sm font-bold ${titleText}`}>{contract.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${titleText}`}>{currency.format(contract.monthlyRevenue)}</p>
                      <p className={`text-xs ${mutedText}`}>{number.format(pct)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-black ${titleText}`}>Upcoming Renewals</h2>
              <p className={`text-sm ${mutedText}`}>Contracts nearing renewal dates.</p>
            </div>
            <button onClick={() => setSelectedContractId("ALL")} className="text-sm font-bold text-blue-600">View All</button>
          </div>

          <div className="space-y-3">
            {contracts
              .slice()
              .sort((a, b) => a.renewalDays - b.renewalDays)
              .map((contract) => (
                <div key={contract.id} className={`flex items-center justify-between border-b pb-3 ${rowBorder}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${logoClass(contract.logo)}`}>
                      {contract.logo}
                    </div>
                    <div>
                      <p className={`font-bold ${titleText}`}>{contract.name}</p>
                      <p className={`text-xs ${mutedText}`}>{contract.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${titleText}`}>{contract.renewalDate}</p>
                    <p className="mt-1 inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {contract.renewalDays} days
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractsDashboard;
