import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  BarChart3,
  CartesianGrid,
  currency,
  defaultSettings,
  DollarSign,
  FileDown,
  FileText,
  ResponsiveContainer,
  ShieldCheck,
  Tooltip,
  Trash2,
  Truck,
  Users,
  XAxis,
  YAxis,
} from "../shared";
import EmptyState from "../components/EmptyState";
import ContractChargeRules from "../components/profitability/ContractChargeRules";
import RouteInputSections from "../components/profitability/RouteInputSections";
import RollupEditorPanel from "../components/profitability/RollupEditorPanel";

const chargeOptions = [
  ["routePay", "Flat Route Pay", "Base route rate"],
  ["perStopPay", "Per Stop Pay", "Stop or extra-stop rate"],
  ["installPay", "Install Pay", "Appliance, setup, or service work"],
  ["accessorialPay", "Accessorials", "Stairs, long carry, haul away, special handling"],
  ["fuelSurcharge", "Fuel Surcharge", "Fuel recovery charge"],
  ["reattemptPay", "Reattempt Pay", "Redelivery or second trip fee"],
];

const defaultChargeRules = {
  routePay: true,
  perStopPay: false,
  installPay: false,
  accessorialPay: false,
  fuelSurcharge: false,
  reattemptPay: false,
};

const chargeRuleDefaultsByContract = {
  lowes: {
    routePay: true,
    perStopPay: true,
    installPay: true,
    accessorialPay: true,
    fuelSurcharge: true,
    reattemptPay: true,
  },
  "home-depot": {
    routePay: true,
    perStopPay: true,
    accessorialPay: true,
    fuelSurcharge: true,
  },
  "best-buy": {
    routePay: false,
    perStopPay: true,
    installPay: true,
    accessorialPay: true,
    reattemptPay: true,
  },
  "rc-willey": {
    routePay: true,
    perStopPay: true,
    accessorialPay: true,
  },
};

const getDefaultChargeRulesForContract = (contractId) => ({
  ...defaultChargeRules,
  ...(chargeRuleDefaultsByContract[contractId] || {}),
});

const routeContractDefaults = {
  lowes: {
    scenarioName: "Lowe's Appliance Delivery",
    routePay: 1200,
    perStopPay: 75,
    installPay: 25,
    routeType: "Appliance Delivery",
  },
  "home-depot": {
    scenarioName: "Home Depot Large Item Delivery",
    routePay: 950,
    perStopPay: 65,
    installPay: 0,
    routeType: "Large Item Delivery",
  },
  "best-buy": {
    scenarioName: "Best Buy Tech Delivery",
    routePay: 0,
    perStopPay: 75,
    installPay: 35,
    routeType: "Tech Delivery",
  },
  "rc-willey": {
    scenarioName: "RC Willey Furniture Delivery",
    routePay: 1100,
    perStopPay: 55,
    installPay: 0,
    routeType: "Furniture Delivery",
  },
};

const routeProfitDefaultKeys = ["scenarioName", "routePay", "perStopPay", "installPay", "routeType"];

function ProfitabilityDashboard({
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
  isBlankDemo = false,
  isDemoMode = false,
  navigateToTab,
}) {
  const [profitabilityView, setProfitabilityView] = useState(() => {
    const savedView = localStorage.getItem("finalMileProfitabilityView");
    return savedView === "Single Route" ? "Route Profit Check" : savedView || "All Contracts";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRollupId, setEditingRollupId] = useState(null);
  const [rollupDraft, setRollupDraft] = useState(null);
  const [rollupEditorPosition, setRollupEditorPosition] = useState(null);
  const [editingRouteSection, setEditingRouteSection] = useState(null);
  const [routeEditorPosition, setRouteEditorPosition] = useState(null);
  const [activeChartKey, setActiveChartKey] = useState(null);
  const [chartPopupPosition, setChartPopupPosition] = useState(null);
  const rollupEditorRef = useRef(null);
  const routeEditorRef = useRef(null);
  const chartPopupRef = useRef(null);
  const rollupStorageKey = isDemoMode ? "finalMileDemoRollupRows" : isBlankDemo ? "finalMileBlankDemoRollupRows" : "finalMileRollupRows";
  const [selectedRouteContractId, setSelectedRouteContractId] = useState(() => isBlankDemo ? "new-contract" : isDemoMode ? "DEMO-LOWES-APPL" : localStorage.getItem("finalMileRouteProfitContractId") || "lowes");
  const [contractChargeRules, setContractChargeRules] = useState(() => {
    try {
      const saved = localStorage.getItem("finalMileContractChargeRules");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [contractCustomCharges, setContractCustomCharges] = useState(() => {
    try {
      const saved = localStorage.getItem("finalMileContractCustomCharges");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [customChargeDraft, setCustomChargeDraft] = useState({ name: "", amount: "" });
  const [routeContractSaveStatus, setRouteContractSaveStatus] = useState("");

  const applyRouteContractDefaults = (contractId, explicitDefaults) => {
    const defaults = explicitDefaults || routeContractDefaults[contractId];
    if (!defaults) return;

    routeProfitDefaultKeys.forEach((key) => {
      if (defaults[key] !== undefined) {
        update(key, defaults[key]);
      }
    });
  };

  const loadSavedRouteContract = (contractId) => {
    const row = rollupRows.find((item) => item.id === contractId);
    if (!row) return false;

    update("scenarioName", row.contract || "");
    update("routePay", row.revenue || 0);
    update("stops", row.stops || 0);
    update("driverPay", row.labor || 0);
    update("dailyTruckPayment", row.truckInsurance || 0);
    update("maintenancePerMile", 0);
    update("claimsChargebacks", row.claims || 0);
    update("otherCosts", row.other || 0);
    return true;
  };


  const [rollupRows, setRollupRows] = useState(() => {
    try {
      const saved = localStorage.getItem(rollupStorageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Ignore malformed saved rows and fall back below.
    }

    if (isBlankDemo) return [];

    return [{
      id: "rc-willey",
      logo: "RC",
      logoClass: "bg-blue-700 text-white",
      contract: "RC Willey Furniture Delivery",
      routes: 5,
      stops: 60,
      revenue: 20700,
      labor: 6300,
      fuel: 1900,
      truckInsurance: 2500,
      maintenance: 900,
      claims: 250,
      other: 880,
    },
    {
      id: "home-depot",
      logo: "HD",
      logoClass: "bg-orange-600 text-white",
      contract: "Home Depot Large Item Delivery",
      routes: 6,
      stops: 78,
      revenue: 19000,
      labor: 6100,
      fuel: 1800,
      truckInsurance: 2400,
      maintenance: 950,
      claims: 400,
      other: 2150,
    },
    {
      id: "best-buy",
      logo: "BB",
      logoClass: "bg-yellow-400 text-slate-950",
      contract: "Best Buy Tech Delivery",
      routes: 4,
      stops: 52,
      revenue: 13200,
      labor: 4800,
      fuel: 1100,
      truckInsurance: 1900,
      maintenance: 750,
      claims: 725,
      other: 775,
    },
    {
      id: "lowes",
      logo: "LOW",
      logoClass: "bg-blue-800 text-white",
      contract: "Lowe's Appliance Delivery",
      routes: 5,
      stops: 65,
      revenue: 15600,
      labor: 5200,
      fuel: 1450,
      truckInsurance: 2100,
      maintenance: 800,
      claims: 1625,
      other: 1525,
    }];
  });

  useEffect(() => {
    localStorage.setItem("finalMileProfitabilityView", profitabilityView);
  }, [profitabilityView]);

  useEffect(() => {
    localStorage.setItem(rollupStorageKey, JSON.stringify(rollupRows));
  }, [rollupRows, rollupStorageKey]);

  useEffect(() => {
    localStorage.setItem(isDemoMode ? "finalMileDemoRouteProfitContractId" : "finalMileRouteProfitContractId", selectedRouteContractId);
  }, [isDemoMode, selectedRouteContractId]);

  useEffect(() => {
    localStorage.setItem("finalMileContractChargeRules", JSON.stringify(contractChargeRules));
  }, [contractChargeRules]);

  useEffect(() => {
    localStorage.setItem("finalMileContractCustomCharges", JSON.stringify(contractCustomCharges));
  }, [contractCustomCharges]);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("finalMileRouteProfitContractDraft");
      if (!savedDraft) return;

      const draft = JSON.parse(savedDraft);
      if (draft.rateCardId) {
        setSelectedRouteContractId(draft.rateCardId);
      }
      applyRouteContractDefaults(draft.rateCardId, draft);
      localStorage.removeItem("finalMileRouteProfitContractDraft");
    } catch {
      localStorage.removeItem("finalMileRouteProfitContractDraft");
    }
  }, []);

  useEffect(() => {
    if (!editingRouteSection) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (routeEditorRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-route-editor-trigger='true']")) return;
      setEditingRouteSection(null);
      setRouteEditorPosition(null);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setEditingRouteSection(null);
        setRouteEditorPosition(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingRouteSection]);

  useEffect(() => {
    if (!activeChartKey) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (chartPopupRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-chart-popup-trigger='true']")) return;
      setActiveChartKey(null);
      setChartPopupPosition(null);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveChartKey(null);
        setChartPopupPosition(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeChartKey]);

  const toNumber = (value) => Number(value || 0);
  const marginFactors = appSettings?.marginFactors || {};
  const enabledFactor = (category, key) => marginFactors?.[category]?.[key] !== false;
  const categoryHasVisibleFactors = (category) => {
    const values = Object.values(marginFactors?.[category] || {});
    return values.length === 0 || values.some(Boolean);
  };
  const anyCostEnabled = (...keys) => keys.some((key) => enabledFactor("costs", key));
  const anyRevenueEnabled = (...keys) => keys.some((key) => enabledFactor("revenue", key));
  const rollupNumberFields = [
    "routes",
    "stops",
    "revenue",
    "labor",
    "fuel",
    "truckInsurance",
    "maintenance",
    "claims",
    "other",
  ];

  const getRollupRowWithTotals = (row) => {
    const revenue = categoryHasVisibleFactors("revenue") ? toNumber(row.revenue) : 0;
    const labor = anyCostEnabled("driverPay", "helperPay") ? toNumber(row.labor) : 0;
    const fuel = enabledFactor("costs", "fuel") ? toNumber(row.fuel) : 0;
    const truckInsurance = anyCostEnabled("truckPayment", "truckInsurance") ? toNumber(row.truckInsurance) : 0;
    const maintenance = enabledFactor("costs", "maintenance") ? toNumber(row.maintenance) : 0;
    const claims = enabledFactor("costs", "claimsReserve") ? toNumber(row.claims) : 0;
    const other = anyCostEnabled(
      "otherExpenses",
      "bond",
      "phonesSoftware",
      "warehouseFees",
      "uniformsPpe",
      "backgroundChecks",
      "drugTests",
      "dotCompliance",
      "tollsParking"
    )
      ? toNumber(row.other)
      : 0;
    const totalCosts = labor + fuel + truckInsurance + maintenance + claims + other;
    const netProfit = revenue - totalCosts;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      ...row,
      calculatedRevenue: revenue,
      calculatedLabor: labor,
      calculatedFuel: fuel,
      calculatedTruckInsurance: truckInsurance,
      calculatedMaintenance: maintenance,
      calculatedClaims: claims,
      calculatedOther: other,
      totalCosts,
      netProfit,
      margin,
    };
  };

  const rowsWithTotals = useMemo(() => {
    return rollupRows.map(getRollupRowWithTotals);
  }, [rollupRows, marginFactors]);

  const filteredRows = rowsWithTotals.filter((row) =>
    row.contract.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = useMemo(() => {
    const total = rowsWithTotals.reduce(
      (acc, row) => {
        acc.routes += toNumber(row.routes);
        acc.stops += toNumber(row.stops);
        acc.revenue += toNumber(row.calculatedRevenue);
        acc.labor += toNumber(row.calculatedLabor);
        acc.fuel += toNumber(row.calculatedFuel);
        acc.truckInsurance += toNumber(row.calculatedTruckInsurance);
        acc.maintenance += toNumber(row.calculatedMaintenance);
        acc.claims += toNumber(row.calculatedClaims);
        acc.other += toNumber(row.calculatedOther);
        acc.totalCosts += toNumber(row.totalCosts);
        acc.netProfit += toNumber(row.netProfit);
        return acc;
      },
      {
        routes: 0,
        stops: 0,
        revenue: 0,
        labor: 0,
        fuel: 0,
        truckInsurance: 0,
        maintenance: 0,
        claims: 0,
        other: 0,
        totalCosts: 0,
        netProfit: 0,
      }
    );

    total.margin = total.revenue > 0 ? (total.netProfit / total.revenue) * 100 : 0;
    return total;
  }, [rowsWithTotals]);

  const bestContract = rowsWithTotals.length
    ? rowsWithTotals.reduce((best, row) => (row.margin > best.margin ? row : best), rowsWithTotals[0])
    : null;
  const worstContract = rowsWithTotals.length
    ? rowsWithTotals.reduce((worst, row) => (row.margin < worst.margin ? row : worst), rowsWithTotals[0])
    : null;

  const profitChartData = rowsWithTotals
    .slice()
    .sort((a, b) => b.netProfit - a.netProfit)
    .map((row) => ({
      name: row.contract
        .replace("Furniture Delivery", "Furniture")
        .replace("Large Item Delivery", "Large Item")
        .replace("Tech Delivery", "Tech")
        .replace("Appliance Delivery", "Appliance"),
      profit: row.netProfit,
    }));

  const costBreakdownData = [
    { name: "Labor", value: totals.labor },
    { name: "Fuel", value: totals.fuel },
    { name: "Truck / Insurance", value: totals.truckInsurance },
    { name: "Maintenance", value: totals.maintenance },
    { name: "Other Costs", value: totals.other },
  ].filter((item) => item.value > 0);

  const trendData = isBlankDemo && rowsWithTotals.length === 0
    ? []
    : [
      { week: "Mar 24", profit: 5200 },
      { week: "Mar 31", profit: 5300 },
      { week: "Apr 7", profit: 10100 },
      { week: "Apr 14", profit: 12600 },
      { week: "Apr 21", profit: 19000 },
      { week: "Apr 28", profit: 20400 },
      { week: "May 5", profit: 20550 },
      { week: "May 12", profit: 19950 },
    ];
  const hasTrendData = trendData.length > 0;

  const normalizeRollupRow = (row) => ({
    ...row,
    ...Object.fromEntries(
      rollupNumberFields.map((key) => [key, Number(row?.[key] || 0)])
    ),
  });

  const updateRollupDraft = (key, value) => {
    setRollupDraft((current) =>
      current
        ? {
          ...current,
          [key]: rollupNumberFields.includes(key) ? Number(value || 0) : value,
        }
        : current
    );
  };

  const saveRollupDraft = () => {
    if (!rollupDraft) return;

    const savedRow = normalizeRollupRow(rollupDraft);
    setRollupRows((current) => {
      const exists = current.some((row) => row.id === savedRow.id);
      return exists
        ? current.map((row) => (row.id === savedRow.id ? savedRow : row))
        : [...current, savedRow];
    });
    closeRollupEditor();
  };

  const updateContractChargeRule = (contractId, key, enabled) => {
    setContractChargeRules((current) => ({
      ...current,
      [contractId]: {
        ...getDefaultChargeRulesForContract(contractId),
        ...(current[contractId] || {}),
        [key]: enabled,
      },
    }));
  };

  const addCustomContractCharge = (contractId) => {
    const name = customChargeDraft.name.trim();
    if (!name) return;

    const amount = Number(customChargeDraft.amount || 0);
    const newCharge = {
      id: `custom-charge-${Date.now()}`,
      name,
      amount: Number.isFinite(amount) ? amount : 0,
      enabled: true,
    };

    setContractCustomCharges((current) => ({
      ...current,
      [contractId]: [...(current[contractId] || []), newCharge],
    }));
    setCustomChargeDraft({ name: "", amount: "" });
  };

  const updateCustomContractCharge = (contractId, chargeId, key, value) => {
    setContractCustomCharges((current) => ({
      ...current,
      [contractId]: (current[contractId] || []).map((charge) =>
        charge.id === chargeId
          ? {
            ...charge,
            [key]: key === "amount" ? Number(value || 0) : value,
          }
          : charge
      ),
    }));
  };

  const deleteCustomContractCharge = (contractId, chargeId) => {
    setContractCustomCharges((current) => ({
      ...current,
      [contractId]: (current[contractId] || []).filter((charge) => charge.id !== chargeId),
    }));
  };

  const closeRouteSectionEditor = () => {
    setEditingRouteSection(null);
    setRouteEditorPosition(null);
  };

  const closeRollupEditor = () => {
    setEditingRollupId(null);
    setRollupEditorPosition(null);
    setRollupDraft(null);
  };

  const closeChartPopup = () => {
    setActiveChartKey(null);
    setChartPopupPosition(null);
  };

  const getFloatingPosition = (source, preferredWidth = 680, preferredHeight = 610) => {
    const gap = 16;
    const width = Math.min(preferredWidth, window.innerWidth - gap * 2);
    const estimatedHeight = Math.min(preferredHeight, window.innerHeight - gap * 2);
    let anchorX = window.innerWidth / 2;
    let anchorY = 96;

    if (source?.clientX !== undefined && source?.clientY !== undefined) {
      anchorX = source.clientX;
      anchorY = source.clientY;
    } else if (source?.getBoundingClientRect) {
      const rect = source.getBoundingClientRect();
      anchorX = rect.right;
      anchorY = rect.top;
    }

    let left = anchorX + gap;
    if (left + width > window.innerWidth - gap) {
      left = anchorX - width - gap;
    }
    if (left < gap) {
      left = Math.min(window.innerWidth - width - gap, Math.max(gap, anchorX - width / 2));
    }

    const top = Math.max(gap, Math.min(anchorY - 32, window.innerHeight - estimatedHeight - gap));

    return {
      left,
      top,
      width,
      maxHeight: Math.max(320, window.innerHeight - top - gap),
    };
  };

  const openRouteSectionEditor = (sectionId, source) => {
    setRouteEditorPosition(getFloatingPosition(source, 680, 610));
    setEditingRouteSection(sectionId);
  };

  const openRollupEditor = (id, source) => {
    const row = rollupRows.find((item) => item.id === id);
    if (!row) return;
    setRollupEditorPosition(getFloatingPosition(source, 720, 640));
    setRollupDraft({ ...row });
    setEditingRollupId(id);
  };

  const openChartPopup = (chartKey, source) => {
    setChartPopupPosition(getFloatingPosition(source, 560, 420));
    setActiveChartKey(chartKey);
  };

  const addRollupRow = (event) => {
    const id = `contract-${Date.now()}`;
    setRollupDraft({
      id,
      logo: "NEW",
      logoClass: "bg-slate-700 text-white",
      contract: "New Contract",
      routes: 0,
      stops: 0,
      revenue: 0,
      labor: 0,
      fuel: 0,
      truckInsurance: 0,
      maintenance: 0,
      claims: 0,
      other: 0,
    });
    setRollupEditorPosition(getFloatingPosition(event?.currentTarget || event, 720, 640));
    setEditingRollupId(id);
  };

  const deleteRollupRow = (id) => {
    const row = rollupRows.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete ${row?.contract || "this contract"}? This cannot be undone.`
    );

    if (!confirmed) return;

    setRollupRows((current) => current.filter((row) => row.id !== id));
    if (editingRollupId === id) {
      closeRollupEditor();
    }
  };

  const exportRollup = () => {
    const summary = [
      "Last Mile Margin - Contract Roll-Up",
      "",
      `Total Revenue: ${currency.format(totals.revenue)}`,
      `Total Costs: ${currency.format(totals.totalCosts)}`,
      `Net Profit: ${currency.format(totals.netProfit)}`,
      `Average Margin: ${totals.margin.toFixed(2)}%`,
      "",
      ...rowsWithTotals.map(
        (row) =>
          `${row.contract}: Revenue ${currency.format(row.revenue)}, Costs ${currency.format(
            row.totalCosts
          )}, Net Profit ${currency.format(row.netProfit)}, Margin ${row.margin.toFixed(2)}%`
      ),
    ].join("\n");

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "final-mile-contract-rollup.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const pageClass = isDark ? "space-y-5 text-white" : "space-y-5 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const rowBorder = isDark ? "border-white/10" : "border-slate-200";
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-blue-500";
  const editingRollupRow = rollupDraft ? getRollupRowWithTotals(rollupDraft) : null;
  const signedNumberClass = (value) => {
    if (value < 0) return "text-red-600";
    if (value > 0) return "text-emerald-700";
    return isDark ? "text-slate-300" : "text-slate-700";
  };
  const signedTone = (value) => {
    if (value < 0) return "red";
    if (value > 0) return "green";
    return "slate";
  };
  const draftTotalsPanelClass = (value) => {
    if (isDark) {
      if (value < 0) return "rounded-2xl border border-red-500/25 bg-red-500/10 p-5";
      if (value > 0) return "rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5";
      return "rounded-2xl border border-white/10 bg-slate-950/70 p-5";
    }

    if (value < 0) return "rounded-2xl border border-red-100 bg-red-50 p-5";
    if (value > 0) return "rounded-2xl border border-emerald-100 bg-emerald-50 p-5";
    return "rounded-2xl border border-slate-200 bg-slate-50 p-5";
  };
  const draftTotalsBorderClass = (value) => {
    if (isDark) {
      if (value < 0) return "border-red-500/25 text-slate-300";
      if (value > 0) return "border-emerald-500/25 text-slate-300";
      return "border-white/10 text-slate-400";
    }

    if (value < 0) return "border-red-100 text-slate-600";
    if (value > 0) return "border-emerald-100 text-slate-600";
    return "border-slate-200 text-slate-600";
  };

  const costColors = ["#2563EB", "#16A34A", "#F97316", "#8B5CF6", "#EF4444"];

  const kpiCards = [
    {
      title: "Total Revenue",
      value: currency.format(totals.revenue),
      note: "All weekly contract revenue",
      icon: DollarSign,
      tone: "blue",
      mini: "line",
      visible: categoryHasVisibleFactors("revenue"),
    },
    {
      title: "Net Profit",
      value: currency.format(totals.netProfit),
      note: `${totals.margin.toFixed(2)}% average margin`,
      icon: BarChart3,
      tone: signedTone(totals.netProfit),
      mini: "line",
      visible: enabledFactor("metrics", "netProfit"),
    },
    {
      title: "Claims Exposure",
      value: currency.format(totals.claims),
      note: "Weekly claims entered",
      icon: ShieldCheck,
      tone: "red",
      mini: "bars",
      visible: enabledFactor("costs", "claimsReserve"),
    },
    {
      title: "Average Margin",
      value: `${totals.margin.toFixed(2)}%`,
      note: "Across all contracts",
      icon: BarChart3,
      tone: signedTone(totals.margin),
      mini: "line",
      visible: enabledFactor("metrics", "marginPercent"),
    },
  ].filter((card) => card.visible);

  const toneStyles = {
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-emerald-500/10 text-emerald-700",
    red: "bg-red-500/10 text-red-600",
    purple: "bg-purple-500/10 text-purple-600",
    amber: "bg-amber-500/10 text-amber-700",
    slate: isDark ? "bg-slate-500/10 text-slate-300" : "bg-slate-500/10 text-slate-600",
  };

  const totalCostPercent = (value) => (totals.totalCosts > 0 ? ((value / totals.totalCosts) * 100).toFixed(1) : "0.0");
  const clampPercent = (value) => Math.max(0, Math.min(100, value));
  const profitabilityBenchmarks = {
    ...defaultSettings.profitabilityBenchmarks,
    ...(appSettings?.profitabilityBenchmarks || {}),
    targetMargin: Number(appSettings?.profitabilityBenchmarks?.targetMargin ?? defaultSettings.profitabilityBenchmarks.targetMargin),
    claimsReserveTarget: Number(appSettings?.profitabilityBenchmarks?.claimsReserveTarget ?? defaultSettings.profitabilityBenchmarks.claimsReserveTarget),
    reviewLineMargin: Number(appSettings?.profitabilityBenchmarks?.reviewLineMargin ?? defaultSettings.profitabilityBenchmarks.reviewLineMargin),
  };
  const hasSavedContractData = rowsWithTotals.length > 0;
  const showBenchmarkTargets = hasSavedContractData && profitabilityBenchmarks.enabled !== false;
  const getKpiBreakdown = (title) => {
    const revenue = Math.max(totals.revenue, 1);
    const cost = Math.max(totals.totalCosts, 0);
    const profit = Math.max(totals.netProfit, 0);
    const claims = Math.max(totals.claims, 0);

    if (title === "Total Revenue") {
      return [
        { label: "Profit kept", value: currency.format(profit), width: clampPercent((profit / revenue) * 100), color: "bg-emerald-500" },
        { label: "Costs paid", value: currency.format(cost), width: clampPercent((cost / revenue) * 100), color: "bg-orange-500" },
      ];
    }

    if (title === "Net Profit") {
      const rows = [
        { label: "Actual margin", value: `${totals.margin.toFixed(2)}%`, width: clampPercent((totals.margin / 35) * 100), color: "bg-emerald-500" },
      ];
      if (showBenchmarkTargets) {
        rows.push({
          label: "Target margin",
          value: `${profitabilityBenchmarks.targetMargin.toFixed(2)}%`,
          width: clampPercent((profitabilityBenchmarks.targetMargin / 35) * 100),
          color: "bg-blue-500",
        });
      }
      return rows;
    }

    if (title === "Claims Exposure") {
      const rows = [
        { label: "Exposure", value: currency.format(claims), width: clampPercent((claims / 4000) * 100), color: "bg-red-500" },
      ];
      if (showBenchmarkTargets) {
        rows.push({
          label: "Reserve target",
          value: currency.format(profitabilityBenchmarks.claimsReserveTarget),
          width: clampPercent((profitabilityBenchmarks.claimsReserveTarget / 4000) * 100),
          color: "bg-amber-500",
        });
      }
      return rows;
    }

    const rows = [
      { label: "Average", value: `${totals.margin.toFixed(2)}%`, width: clampPercent((totals.margin / 40) * 100), color: "bg-purple-500" },
    ];
    if (showBenchmarkTargets) {
      rows.push({
        label: "Review line",
        value: `${profitabilityBenchmarks.reviewLineMargin.toFixed(2)}%`,
        width: clampPercent((profitabilityBenchmarks.reviewLineMargin / 40) * 100),
        color: "bg-slate-500",
      });
    }
    return rows;
  };

  if (profitabilityView === "Route Profit Check") {
    const isNewRouteContract = selectedRouteContractId === "new-contract" || rowsWithTotals.length === 0;
    const selectedRouteContract = isNewRouteContract ? null : rowsWithTotals.find((row) => row.id === selectedRouteContractId) || rowsWithTotals[0];
    const activeRouteContractId = selectedRouteContract?.id || "new-contract";
    const activeRouteContractName = selectedRouteContract?.contract || form.scenarioName || "";
    const selectedChargeRules = {
      ...getDefaultChargeRulesForContract(activeRouteContractId),
      ...(contractChargeRules[activeRouteContractId] || {}),
    };
    const chargeEnabled = (key) => selectedChargeRules[key] !== false;
    const enabledChargeLabels = chargeOptions.filter(([key]) => chargeEnabled(key)).map(([, label]) => label);
    const customCharges = (contractCustomCharges[activeRouteContractId] || []).map((charge) => ({
      ...charge,
      amount: Number(charge.amount || 0),
      enabled: charge.enabled !== false,
    }));
    const enabledCustomCharges = customCharges.filter((charge) => charge.enabled);
    const customRevenue = enabledCustomCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const enabledPayTypeCount = enabledChargeLabels.length + enabledCustomCharges.length;
    const routeRevenue = enabledFactor("revenue", "routePay") && chargeEnabled("routePay") ? toNumber(form.routePay) : 0;
    const extraStops = toNumber(form.stops);
    const perStopRevenue = anyRevenueEnabled("perStopPay", "extraStops") && chargeEnabled("perStopPay") ? toNumber(form.perStopPay) : 0;
    const installRevenue = enabledFactor("revenue", "installRevenue") && chargeEnabled("installPay") ? toNumber(form.installPay) : 0;
    const accessorialRevenue = anyRevenueEnabled("haulAwayRevenue", "stairsLongCarry", "detentionWaitTime", "assemblySetup", "otherAccessorials")
      && chargeEnabled("accessorialPay")
      ? toNumber(form.accessorialPay)
      : 0;
    const fuelSurcharge = enabledFactor("revenue", "fuelSurcharge") && chargeEnabled("fuelSurcharge") ? toNumber(form.fuelSurcharge) : 0;
    const reattemptRevenue = enabledFactor("revenue", "reattemptFee") && chargeEnabled("reattemptPay") ? toNumber(form.reattemptPay) : 0;

    const totalRouteRevenue =
      routeRevenue +
      extraStops * perStopRevenue +
      installRevenue +
      accessorialRevenue +
      fuelSurcharge +
      reattemptRevenue +
      customRevenue;

    const miles = Math.max(toNumber(form.miles), 0);
    const routeHours = Math.max(toNumber(form.routeHours), 1);
    const mpg = Math.max(toNumber(form.mpg), 1);
    const fuelPrice = toNumber(form.fuelPrice);
    const fuelCost = enabledFactor("costs", "fuel") ? (miles / mpg) * fuelPrice : 0;

    const driverPay = enabledFactor("costs", "driverPay") ? toNumber(form.driverPay) : 0;
    const helperPay = enabledFactor("costs", "helperPay") ? toNumber(form.helperPay) : 0;
    const laborCost = driverPay + helperPay;
    const truckCost = enabledFactor("costs", "truckPayment") ? toNumber(form.dailyTruckPayment) : 0;
    const insuranceCost = enabledFactor("costs", "truckInsurance") ? toNumber(form.dailyInsurance) : 0;
    const maintenanceCost = enabledFactor("costs", "maintenance") ? miles * toNumber(form.maintenancePerMile) : 0;
    const tollsParking = enabledFactor("costs", "tollsParking") ? toNumber(form.tollsParking) : 0;
    const phoneSoftware = enabledFactor("costs", "phonesSoftware") ? toNumber(form.phoneSoftware) : 0;
    const claimsReserve = enabledFactor("costs", "claimsReserve") ? toNumber(form.claimsChargebacks) : 0;
    const otherCosts = enabledFactor("costs", "otherExpenses") ? toNumber(form.otherCosts) : 0;

    const totalRouteCost =
      laborCost +
      fuelCost +
      truckCost +
      insuranceCost +
      maintenanceCost +
      tollsParking +
      phoneSoftware +
      claimsReserve +
      otherCosts;

    const routeNetProfit = totalRouteRevenue - totalRouteCost;
    const routeMargin = totalRouteRevenue > 0 ? (routeNetProfit / totalRouteRevenue) * 100 : 0;
    const profitPerStop = extraStops > 0 ? routeNetProfit / extraStops : 0;
    const profitPerMile = miles > 0 ? routeNetProfit / miles : 0;
    const profitPerHour = routeNetProfit / routeHours;

    const showStopsField = (anyRevenueEnabled("extraStops", "perStopPay") && chargeEnabled("perStopPay")) || enabledFactor("metrics", "profitPerStop") || enabledFactor("metrics", "stopsPerHour") || enabledFactor("metrics", "milesPerStop");
    const showAccessorialField = anyRevenueEnabled("haulAwayRevenue", "stairsLongCarry", "detentionWaitTime", "assemblySetup", "otherAccessorials") && chargeEnabled("accessorialPay");

    const revenueFields = [
      ["Base Route Pay", "routePay", "Flat route revenue", enabledFactor("revenue", "routePay") && chargeEnabled("routePay")],
      ["Stops", "stops", "Total stops on route", showStopsField],
      ["Per Stop Pay", "perStopPay", "Revenue per additional stop", anyRevenueEnabled("perStopPay", "extraStops") && chargeEnabled("perStopPay")],
      ["Install Revenue", "installPay", "Install / accessory work", enabledFactor("revenue", "installRevenue") && chargeEnabled("installPay")],
      ["Accessorials", "accessorialPay", "Haul away, stairs, special handling", showAccessorialField],
      ["Fuel Surcharge", "fuelSurcharge", "Fuel recovery revenue", enabledFactor("revenue", "fuelSurcharge") && chargeEnabled("fuelSurcharge")],
      ["Reattempt Pay", "reattemptPay", "Redelivery / trip fee revenue", enabledFactor("revenue", "reattemptFee") && chargeEnabled("reattemptPay")],
    ].filter(([, , , visible]) => visible);

    const costFields = [
      ["Miles", "miles", "Total route miles", enabledFactor("costs", "fuel") || enabledFactor("costs", "maintenance") || enabledFactor("metrics", "profitPerMile") || enabledFactor("metrics", "milesPerStop")],
      ["MPG", "mpg", "Truck fuel efficiency", enabledFactor("costs", "fuel")],
      ["Fuel Price", "fuelPrice", "Price per gallon", enabledFactor("costs", "fuel")],
      ["Driver Pay", "driverPay", "Daily driver cost", enabledFactor("costs", "driverPay")],
      ["Helper Pay", "helperPay", "Daily helper cost", enabledFactor("costs", "helperPay")],
      ["Truck Cost", "dailyTruckPayment", "Truck payment / rental", enabledFactor("costs", "truckPayment")],
      ["Insurance", "dailyInsurance", "Daily insurance cost", enabledFactor("costs", "truckInsurance")],
      ["Maintenance / Mile", "maintenancePerMile", "Maintenance reserve", enabledFactor("costs", "maintenance")],
      ["Tolls / Parking", "tollsParking", "Route fees", enabledFactor("costs", "tollsParking")],
      ["Phone / Software", "phoneSoftware", "Daily software and phone cost", enabledFactor("costs", "phonesSoftware")],
      ["Claims Reserve", "claimsChargebacks", "Damage / claim reserve", enabledFactor("costs", "claimsReserve")],
      ["Other Costs", "otherCosts", "Anything else", enabledFactor("costs", "otherExpenses")],
    ].filter(([, , , visible]) => visible);

    const summaryCards = [
      ["Total Revenue", totalRouteRevenue, "text-blue-600", DollarSign, "", categoryHasVisibleFactors("revenue")],
      ["Total Cost", totalRouteCost, "text-red-600", ShieldCheck, "", categoryHasVisibleFactors("costs")],
      ["Net Profit", routeNetProfit, signedNumberClass(routeNetProfit), BarChart3, "", enabledFactor("metrics", "netProfit")],
      ["Margin", routeMargin, signedNumberClass(routeMargin), Truck, "%", enabledFactor("metrics", "marginPercent")],
    ].filter(([, , , , , visible]) => visible);

    const efficiencyCards = [
      ["Profit / Stop", profitPerStop, enabledFactor("metrics", "profitPerStop")],
      ["Profit / Mile", profitPerMile, enabledFactor("metrics", "profitPerMile")],
      ["Profit / Hour", profitPerHour, enabledFactor("metrics", "profitPerHour")],
      ["Fuel Cost", fuelCost, enabledFactor("costs", "fuel")],
    ].filter(([, , visible]) => visible);

    const routeDetailFields = [
      ["Route Hours", "routeHours", "Used for profit per hour", enabledFactor("metrics", "profitPerHour")],
      ["Target Profit", "targetProfit", "Daily goal for this route", true],
    ].filter(([, , , visible]) => visible);

    const getFieldsByKey = (fields, keys) => fields.filter(([, key]) => keys.includes(key));
    const routeInputSections = [
      {
        id: "revenue",
        title: "Revenue",
        subtitle: "Route pay, stops, accessorials, and surcharges.",
        icon: DollarSign,
        tone: "blue",
        value: totalRouteRevenue,
        note: `${extraStops} stops`,
        items: enabledCustomCharges.map((charge) => ({ name: charge.name || "Custom charge", amount: charge.amount })),
        fields: revenueFields,
      },
      {
        id: "labor",
        title: "Labor",
        subtitle: "Driver and helper cost for this route.",
        icon: Users,
        tone: "green",
        value: laborCost,
        note: `${currency.format(driverPay)} driver / ${currency.format(helperPay)} helper`,
        fields: getFieldsByKey(costFields, ["driverPay", "helperPay"]),
      },
      {
        id: "truck",
        title: "Truck, Fuel & Miles",
        subtitle: "Fuel, mileage, truck, insurance, and maintenance.",
        icon: Truck,
        tone: "amber",
        value: fuelCost + truckCost + insuranceCost + maintenanceCost + tollsParking + phoneSoftware,
        note: `${miles} miles at ${mpg} MPG`,
        fields: getFieldsByKey(costFields, ["miles", "mpg", "fuelPrice", "dailyTruckPayment", "dailyInsurance", "maintenancePerMile", "tollsParking", "phoneSoftware"]),
      },
      {
        id: "claims",
        title: "Claims & Other",
        subtitle: "Reserve for damages, chargebacks, and one-off costs.",
        icon: ShieldCheck,
        tone: "red",
        value: claimsReserve + otherCosts,
        note: `${currency.format(claimsReserve)} claim reserve`,
        fields: getFieldsByKey(costFields, ["claimsChargebacks", "otherCosts"]),
      },
      {
        id: "route-details",
        title: "Route Details",
        subtitle: "Time and target numbers that affect route health.",
        icon: FileText,
        tone: "purple",
        value: profitPerHour,
        note: `${routeHours} hours / ${currency.format(toNumber(form.targetProfit))} target`,
        fields: routeDetailFields,
      },
    ].filter((section) => section.fields.length > 0);
    const editingRouteSectionData = routeInputSections.find((section) => section.id === editingRouteSection);
    const EditingRouteIcon = editingRouteSectionData?.icon;
    const routeToneClass = {
      blue: isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-600",
      green: isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700",
      amber: isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700",
      red: isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-600",
      purple: isDark ? "bg-purple-500/10 text-purple-300" : "bg-purple-50 text-purple-600",
    };
    const getContractLogo = (name) => {
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

      return initials || "NEW";
    };
    const saveRouteContract = () => {
      const contractName = activeRouteContractName.trim();
      if (!contractName) {
        setRouteContractSaveStatus("Enter a contract name first.");
        return;
      }

      const id = selectedRouteContract?.id || `contract-${Date.now()}`;
      const savedRow = {
        id,
        logo: selectedRouteContract?.logo || getContractLogo(contractName),
        logoClass: selectedRouteContract?.logoClass || "bg-slate-700 text-white",
        contract: contractName,
        routes: Math.max(toNumber(form.routesPerWeek), 1),
        stops: extraStops,
        revenue: totalRouteRevenue,
        labor: laborCost,
        fuel: fuelCost,
        truckInsurance: truckCost + insuranceCost + phoneSoftware,
        maintenance: maintenanceCost,
        claims: claimsReserve,
        other: tollsParking + otherCosts,
      };

      setRollupRows((current) => {
        const alreadyExists = current.some((row) => row.id === id);
        return alreadyExists ? current.map((row) => (row.id === id ? savedRow : row)) : [...current, savedRow];
      });
      setSelectedRouteContractId(id);
      update("scenarioName", contractName);
      setRouteContractSaveStatus(`Saved ${contractName}.`);
    };
    const startNewRouteContract = () => {
      setSelectedRouteContractId("new-contract");
      setRouteContractSaveStatus("");
      [
        ["scenarioName", ""],
        ["routePay", 0],
        ["perStopPay", 0],
        ["installPay", 0],
        ["accessorialPay", 0],
        ["fuelSurcharge", 0],
        ["reattemptPay", 0],
        ["stops", 0],
        ["miles", 0],
        ["routeHours", 1],
        ["driverPay", 0],
        ["helperPay", 0],
        ["tollsParking", 0],
        ["dailyTruckPayment", 0],
        ["dailyInsurance", 0],
        ["maintenancePerMile", 0],
        ["phoneSoftware", 0],
        ["claimsChargebacks", 0],
        ["otherCosts", 0],
        ["routesPerWeek", 1],
        ["routeType", ""],
      ].forEach(([key, value]) => update(key, value));
    };

    return (
      <div className={pageClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${titleText}`}>Route Profit Check</h1>
            <p className={`mt-1 text-sm ${mutedText}`}>Quickly decide if one route is worth running today.</p>
          </div>
        </div>

        <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-card" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-sm font-black ${titleText}`}>View:</span>
              <div className={isDark ? "rounded-2xl bg-white/5 p-1" : "rounded-2xl bg-slate-100 p-1"}>
                {["All Contracts", "Route Profit Check"].map((view) => (
                  <button
                    key={view}
                    onClick={() => setProfitabilityView(view)}
                    className={`rounded-xl px-5 py-2 text-sm font-black transition ${profitabilityView === view
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : isDark
                          ? "text-slate-300 hover:bg-white/10"
                          : "text-slate-600 hover:bg-white"
                      }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

            </div>

            {profitabilityView === "Route Profit Check" && (
              <div className="flex flex-wrap items-center gap-3">
                <label className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Contract Name</label>
                {!isNewRouteContract && rowsWithTotals.length > 0 ? (
                  <select
                    value={selectedRouteContract?.id || ""}
                    onChange={(event) => {
                      const nextContractId = event.target.value;
                      setSelectedRouteContractId(nextContractId);
                      setRouteContractSaveStatus("");
                      if (!loadSavedRouteContract(nextContractId)) {
                        applyRouteContractDefaults(nextContractId);
                      }
                    }}
                    className={isDark ? "min-w-72 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500" : "min-w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-blue-500"}
                  >
                    {rowsWithTotals.map((row) => (
                      <option key={row.id} value={row.id}>{row.contract}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={activeRouteContractName}
                    onChange={(event) => update("scenarioName", event.target.value)}
                    placeholder="Enter contract name"
                    className={isDark ? "min-w-72 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500" : "min-w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500"}
                  />
                )}
                <span className={isDark ? "rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-black text-emerald-200" : "rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"}>
                  {enabledPayTypeCount} pay types on
                </span>
                <button
                  onClick={saveRouteContract}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                >
                  Save Contract
                </button>
                <button
                  onClick={startNewRouteContract}
                  className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                >
                  + Add Another
                </button>
                {routeContractSaveStatus && (
                  <span className={routeContractSaveStatus.startsWith("Saved") ? "text-sm font-black text-emerald-600" : "text-sm font-black text-red-600"}>
                    {routeContractSaveStatus}
                  </span>
                )}
              </div>
            )}

            {profitabilityView === "All Contracts" && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={addRollupRow}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-600 hover:bg-blue-50"
                >
                  + Add Contract Row
                </button>
                <button
                  onClick={exportRollup}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
                >
                  Export Roll-Up
                </button>
              </div>
            )}
          </div>
        </div>

        {isBlankDemo && !hasSavedContractData && (
          <EmptyState
            isDark={isDark}
            eyebrow="Profit check"
            title="Run your first route profit check"
            description="Start with revenue, then enter labor, fuel, truck, insurance, maintenance, and claim reserve. This calculator will show margin, profit per stop, and route risk before you save the contract."
            Icon={DollarSign}
            primaryAction={{ label: "Start Blank Calculator", onClick: resetRouteCalculator }}
            secondaryActions={[
              { label: "Save Scenario", onClick: saveScenario },
              { label: "Open Contracts", onClick: () => navigateToTab?.("Contracts") },
            ]}
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {["1. Enter revenue", "2. Enter route costs", "3. Review profit per stop"].map((item) => (
                <div key={item} className={isDark ? "rounded-xl bg-white/5 px-3 py-2 text-sm font-black text-slate-200" : "rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm"}>
                  {item}
                </div>
              ))}
            </div>
          </EmptyState>
        )}

        <div className="grid gap-4 xl:grid-cols-4">
          {summaryCards.map(([label, value, tone, Icon, suffix]) => (
            <div key={label} className={cardClass}>
              <div className="flex items-center gap-4">
                <div className={isDark ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-blue-300" : "flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>{label}</p>
                  <p className={`mt-1 text-3xl font-black ${tone}`}>
                    {suffix === "%" ? `${value.toFixed(2)}%` : currency.format(value)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={cardClass}>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`text-xl font-bold ${titleText}`}>Route Inputs</h2>
                <p className={`text-sm ${mutedText}`}>Click any section to edit the numbers behind this route.</p>
              </div>
              <span className={isDark ? "rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-200" : "rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"}>
                Click to edit
              </span>
            </div>

            <ContractChargeRules
              isDark={isDark}
              activeRouteContractName={activeRouteContractName}
              activeRouteContractId={activeRouteContractId}
              chargeOptions={chargeOptions}
              chargeEnabled={chargeEnabled}
              customCharges={customCharges}
              customChargeDraft={customChargeDraft}
              setCustomChargeDraft={setCustomChargeDraft}
              updateContractChargeRule={updateContractChargeRule}
              updateCustomContractCharge={updateCustomContractCharge}
              deleteCustomContractCharge={deleteCustomContractCharge}
              addCustomContractCharge={addCustomContractCharge}
              inputClass={inputClass}
              titleText={titleText}
              mutedText={mutedText}
            />

            <RouteInputSections
              isDark={isDark}
              routeInputSections={routeInputSections}
              routeToneClass={routeToneClass}
              openRouteSectionEditor={openRouteSectionEditor}
              titleText={titleText}
              mutedText={mutedText}
              rowBorder={rowBorder}
            />
          </div>

          <div className={cardClass}>
            <div className="mb-5">
              <h2 className={`text-xl font-bold ${titleText}`}>Live Route Summary</h2>
              <p className={`text-sm ${mutedText}`}>Profitability updates as section numbers change.</p>
            </div>

            <div className="space-y-4">
              {[
                ["Revenue", totalRouteRevenue, "text-blue-600", categoryHasVisibleFactors("revenue")],
                ["Cost", totalRouteCost, "text-red-600", categoryHasVisibleFactors("costs")],
                ["Net Profit", routeNetProfit, signedNumberClass(routeNetProfit), enabledFactor("metrics", "netProfit")],
              ].filter(([, , , visible]) => visible).map(([label, value, tone]) => (
                <div key={label} className={`flex items-center justify-between gap-4 border-b pb-3 ${rowBorder}`}>
                  <p className={`font-bold ${mutedText}`}>{label}</p>
                  <p className={`safe-number text-right text-xl font-bold ${tone}`}>{currency.format(value)}</p>
                </div>
              ))}

              {enabledFactor("metrics", "marginPercent") && (
                <div className={isDark ? "rounded-2xl bg-slate-950/70 p-4" : "rounded-2xl bg-emerald-50 p-4"}>
                  <p className={`text-sm font-black ${mutedText}`}>Margin</p>
                  <p className={`mt-1 text-4xl font-black ${signedNumberClass(routeMargin)}`}>
                    {routeMargin.toFixed(2)}%
                  </p>
                </div>
              )}

              {efficiencyCards.length > 0 && (
                <div className={`grid gap-3 border-t pt-4 sm:grid-cols-2 ${rowBorder}`}>
                  {efficiencyCards.map(([label, value]) => (
                    <div key={label} className={isDark ? "rounded-xl bg-white/5 p-3" : "rounded-xl bg-slate-50 p-3"}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>{label}</p>
                      <p className={`safe-number mt-1 text-lg font-bold ${value >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {currency.format(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={`text-xl font-bold ${titleText}`}>Scenario Buttons</h2>
              <p className={`text-sm ${mutedText}`}>Quickly test common final-mile route changes.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Add 5 Stops", () => update("stops", extraStops + 5)],
              ["Add $250 Accessorials", () => update("accessorialPay", accessorialRevenue + 250)],
              ["Add Helper Cost", () => update("helperPay", helperPay + 180)],
              ["Fuel +10%", () => update("fuelPrice", Number((fuelPrice * 1.1).toFixed(2)))],
            ].map(([label, action]) => (
              <button
                key={label}
                onClick={action}
                className={isDark ? "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white hover:bg-white/10" : "rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-600 hover:bg-blue-50"}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {editingRouteSectionData && (
          <div
            ref={routeEditorRef}
            className="fixed z-50 w-[min(680px,calc(100vw-2rem))]"
            style={{
              left: `${routeEditorPosition?.left ?? 16}px`,
              top: `${routeEditorPosition?.top ?? 96}px`,
              width: `${routeEditorPosition?.width ?? 680}px`,
            }}
          >
            <div
              className={isDark ? "overflow-y-auto rounded-2xl border border-blue-500/25 bg-slate-950/95 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl" : "overflow-y-auto rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/60 backdrop-blur-xl"}
              style={{ maxHeight: `${routeEditorPosition?.maxHeight ?? 620}px` }}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${routeToneClass[editingRouteSectionData.tone]}`}>
                    {EditingRouteIcon && <EditingRouteIcon className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Edit Route Section</p>
                      <span className={isDark ? "rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-200" : "rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"}>
                        Live update
                      </span>
                    </div>
                    <h3 className={`mt-1 text-2xl font-black ${titleText}`}>{editingRouteSectionData.title}</h3>
                    <p className={`mt-1 text-sm ${mutedText}`}>{editingRouteSectionData.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={closeRouteSectionEditor}
                  className={isDark ? "rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15" : "rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"}
                >
                  Close
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {editingRouteSectionData.fields.map(([label, key, help]) => (
                  <div key={key}>
                    <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>{label}</label>
                    <input
                      type="number"
                      value={form[key]}
                      onChange={(event) => update(key, event.target.value)}
                      className={inputClass}
                    />
                    <p className={`mt-1 text-[11px] ${mutedText}`}>{help}</p>
                  </div>
                ))}
              </div>

              {editingRouteSectionData.id === "revenue" && customCharges.length > 0 && (
                <div className={isDark ? "mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4" : "mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-sm font-black ${titleText}`}>Custom Charges</p>
                    <p className={`mt-1 text-xs font-semibold ${mutedText}`}>These are saved to {activeRouteContractName || "New Contract"}.</p>
                    </div>
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                      {currency.format(customRevenue)}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {customCharges.map((charge) => (
                      <div key={charge.id} className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-3" : "rounded-xl border border-emerald-100 bg-white p-3"}>
                        <label className="mb-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={charge.enabled}
                            onChange={(event) => updateCustomContractCharge(activeRouteContractId, charge.id, "enabled", event.target.checked)}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          <span className={`truncate text-sm font-black ${charge.enabled ? titleText : mutedText}`}>{charge.name}</span>
                        </label>
                        <div className="relative">
                          <span className={`absolute left-3 top-2 text-sm font-black ${mutedText}`}>$</span>
                          <input
                            type="number"
                            value={charge.amount}
                            onChange={(event) => updateCustomContractCharge(activeRouteContractId, charge.id, "amount", event.target.value)}
                            className={isDark ? "w-full rounded-lg border border-white/10 bg-slate-950/60 py-2 pl-7 pr-3 text-sm font-black text-white outline-none focus:border-emerald-500" : "w-full rounded-lg border border-emerald-100 bg-white py-2 pl-7 pr-3 text-sm font-black text-slate-950 outline-none focus:border-emerald-500"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={isDark ? "mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-5" : "mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5"}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Section Total</p>
                    <p className={`safe-number mt-1 text-2xl font-black ${titleText}`}>{currency.format(editingRouteSectionData.value)}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Net Profit</p>
                    <p className={`safe-number mt-1 text-2xl font-black ${signedNumberClass(routeNetProfit)}`}>{currency.format(routeNetProfit)}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Margin</p>
                    <p className={`mt-1 text-2xl font-black ${signedNumberClass(routeMargin)}`}>{routeMargin.toFixed(2)}%</p>
                  </div>
                </div>
              </div>

              <div className={`mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${rowBorder}`}>
                <p className={`text-sm ${mutedText}`}>Changes update the route summary immediately.</p>
                <button
                  onClick={closeRouteSectionEditor}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${titleText}`}>Profitability</h1>
          <p className={`mt-1 text-sm ${mutedText}`}>Track and improve contract-level profitability.</p>
        </div>
      </div>

      <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-card" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-sm font-black ${titleText}`}>View:</span>
            <div className={isDark ? "rounded-2xl bg-white/5 p-1" : "rounded-2xl bg-slate-100 p-1"}>
              {["All Contracts", "Route Profit Check"].map((view) => (
                <button
                  key={view}
                  onClick={() => setProfitabilityView(view)}
                  className={`rounded-xl px-5 py-2 text-sm font-black transition ${profitabilityView === view
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : isDark
                        ? "text-slate-300 hover:bg-white/10"
                        : "text-slate-600 hover:bg-white"
                    }`}
                >
                  {view}
                </button>
              ))}
            </div>

          </div>

          {profitabilityView === "All Contracts" && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={addRollupRow}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-600 hover:bg-blue-50"
              >
                + Add Contract Row
              </button>
              <button
                onClick={exportRollup}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
              >
                Export Roll-Up
              </button>
            </div>
          )}
        </div>
      </div>

      {isBlankDemo && !hasSavedContractData && (
        <EmptyState
          isDark={isDark}
          eyebrow="Profitability setup"
          title="No contract profit rows yet"
          description="Add your first contract row or switch to Route Profit Check to build the math step by step. Once saved, revenue, costs, margin, and claims reserve will show here."
          Icon={BarChart3}
          primaryAction={{ label: "Add Contract Row", onClick: addRollupRow }}
          secondaryActions={[
            { label: "Open Route Profit Check", onClick: () => setProfitabilityView("Route Profit Check") },
            { label: "Open Intake", onClick: () => navigateToTab?.("Intake") },
          ]}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const breakdown = getKpiBreakdown(card.title);

          return (
            <div key={card.title} className={`${cardClass} overflow-hidden`}>
              <div className="min-w-0">
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${toneStyles[card.tone]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>{card.title}</p>
                <p
                  className={`safe-number mt-2 text-2xl font-black ${card.tone === "green"
                      ? "text-emerald-700"
                      : card.tone === "red"
                        ? "text-red-600"
                        : titleText
                    }`}
                  title={card.value}
                >
                  {card.value}
                </p>
                <p className={`mt-2 text-xs font-semibold ${mutedText}`}>{card.note}</p>
              </div>

              <div className={isDark ? "mt-5 space-y-3 rounded-xl bg-slate-950/30 p-3" : "mt-5 space-y-3 rounded-xl bg-slate-50/80 p-3"}>
                {breakdown.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className={`truncate text-[11px] font-semibold uppercase tracking-wide ${mutedText}`}>{item.label}</p>
                      <p className={`safe-number text-right text-xs font-black ${titleText}`} title={item.value}>{item.value}</p>
                    </div>
                    <div className={isDark ? "h-2 overflow-hidden rounded-full bg-white/10" : "h-2 overflow-hidden rounded-full bg-slate-200"}>
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {enabledFactor("metrics", "marginPercent") && (
          <div className={isDark ? `${cardClass} border-white/10 bg-slate-900/80` : `${cardClass} border-amber-200 bg-gradient-to-br from-white to-amber-50`}>
            <div className="flex items-start gap-4">
              <div className={isDark ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300" : "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700"}>
                <Truck className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-amber-300" : "text-xs font-semibold uppercase tracking-wide text-amber-800"}>Margin Range</p>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-1 min-w-0">
                      <p className="text-xs font-semibold uppercase leading-tight text-emerald-700">Strongest Margin</p>
                      <p className="mt-1 break-words text-lg font-bold leading-tight text-emerald-700">{bestContract?.margin.toFixed(2)}%</p>
                    </div>
                    <p className={isDark ? "break-words text-sm font-black leading-snug text-white" : "break-words text-sm font-black leading-snug text-slate-950"}>{bestContract?.contract}</p>
                  </div>

                  <div className={isDark ? "border-t border-white/10 pt-4" : "border-t border-amber-200 pt-4"}>
                    <div className="mb-1 min-w-0">
                      <p className="text-xs font-semibold uppercase leading-tight text-red-600">Needs Review</p>
                      <p className="mt-1 break-words text-lg font-bold leading-tight text-red-600">{worstContract?.margin.toFixed(2)}%</p>
                    </div>
                    <p className={isDark ? "break-words text-sm font-black leading-snug text-white" : "break-words text-sm font-black leading-snug text-slate-950"}>{worstContract?.contract}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {enabledFactor("metrics", "netProfit") && (
          <div className={`${cardClass} xl:col-span-4`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${titleText}`}>Net Profit by Contract</h2>
              <p className={`mt-1 text-xs ${mutedText}`}>Ranked from strongest to weakest.</p>
            </div>
            <button
              type="button"
              data-chart-popup-trigger="true"
              onClick={(event) => openChartPopup("profit", event)}
              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-50"
            >
              View chart
            </button>
          </div>

          <div className="space-y-5">
            {rowsWithTotals
              .slice()
              .sort((a, b) => b.netProfit - a.netProfit)
              .map((row) => {
                const width = bestContract?.netProfit > 0 ? Math.max((row.netProfit / bestContract.netProfit) * 100, 8) : 0;
                return (
                  <div key={row.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className={`truncate text-sm font-black ${titleText}`}>{row.contract}</p>
                      <p className={`whitespace-nowrap text-sm font-black ${signedNumberClass(row.netProfit)}`}>{currency.format(row.netProfit)}</p>
                    </div>
                    <div className={isDark ? "h-5 overflow-hidden rounded-full bg-slate-950" : "h-5 overflow-hidden rounded-full bg-slate-100"}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          </div>
        )}

        <div className={`${cardClass} xl:col-span-4`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${titleText}`}>Cost Breakdown (Totals)</h2>
              <p className={`mt-1 text-xs ${mutedText}`}>Clean dollar view by category.</p>
            </div>
            <button
              type="button"
              data-chart-popup-trigger="true"
              onClick={(event) => openChartPopup("costs", event)}
              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-50"
            >
              View chart
            </button>
          </div>

          <div className="space-y-4">
            {costBreakdownData.map((item, index) => (
              <div key={item.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: costColors[index] }} />
                  <p className={`text-sm font-black ${mutedText}`}>{item.name}</p>
                </div>
                <p className={`text-sm font-black ${titleText}`}>{currency.format(item.value)}</p>
                <p className={`w-14 text-right text-sm font-black ${mutedText}`}>{totalCostPercent(item.value)}%</p>
              </div>
            ))}
          </div>

          <div className={`mt-6 flex items-center justify-between border-t pt-4 ${rowBorder}`}>
            <p className={`text-sm font-black ${mutedText}`}>Total Costs</p>
            <p className={`text-2xl font-black ${titleText}`}>{currency.format(totals.totalCosts)}</p>
          </div>
        </div>

        {enabledFactor("metrics", "netProfit") && (
          <div className={`${cardClass} xl:col-span-4`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-lg font-bold ${titleText}`}>Profitability Trend (8 Weeks)</h2>
            {hasTrendData && (
              <button
                type="button"
                data-chart-popup-trigger="true"
                onClick={(event) => openChartPopup("trend", event)}
                className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-50"
              >
                View chart
              </button>
            )}
          </div>
          {hasTrendData ? (
            <>
              <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
                {trendData.slice(-4).map((point) => (
                  <div key={point.week} className={isDark ? "rounded-lg bg-white/5 px-2 py-1 text-center" : "rounded-lg bg-emerald-50 px-2 py-1 text-center"}>
                    <p className="font-black text-emerald-700">{currency.format(point.profit).replace(",000.00", "K").replace(".00", "")}</p>
                    <p className={mutedText}>{point.week}</p>
                  </div>
                ))}
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${Math.round(value / 1000)}K`} />
                    <Tooltip formatter={(value) => currency.format(value)} />
                    <Area type="monotone" dataKey="profit" stroke="#16A34A" strokeWidth={3} fill="url(#profitTrendFill)" dot={{ r: 5, fill: "#16A34A", strokeWidth: 2, stroke: "#ffffff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className={isDark ? "flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center" : "flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"}>
              <BarChart3 className={isDark ? "mb-3 h-9 w-9 text-slate-500" : "mb-3 h-9 w-9 text-slate-400"} />
              <p className={`text-lg font-bold ${titleText}`}>No profit history yet</p>
              <p className={`mt-2 max-w-sm text-sm leading-relaxed ${mutedText}`}>
                Save your first contract or daily route result to start building an 8-week profitability trend.
              </p>
              <button
                type="button"
                onClick={() => setProfitabilityView("Route Profit Check")}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
              >
                Add Contract
              </button>
            </div>
          )}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-xl font-bold ${titleText}`}>Contracts Roll-Up</h2>
            <p className={`text-sm ${mutedText}`}>
              Click any contract row to open the detail popup and update the numbers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search contracts..."
              className={inputClass}
            />
            <button
              onClick={addRollupRow}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-600 hover:bg-blue-50"
            >
              + Add Contract
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className={`border-b text-xs uppercase tracking-wide ${mutedText}`}>
                <th className="border-b py-3 pr-3">#</th>
                <th className="border-b py-3 pr-3">Contract</th>
                <th className="border-b py-3 pr-3 text-center">Routes / Wk</th>
                <th className="border-b py-3 pr-3 text-center">Stops / Wk</th>
                <th className="border-b py-3 pr-3 text-right">Revenue</th>
                <th className="border-b py-3 pr-3 text-right">Total Costs</th>
                <th className="border-b py-3 pr-3 text-center">Claims</th>
                <th className="border-b py-3 pr-3 text-right">Net Profit</th>
                <th className="border-b py-3 pr-3 text-right">Margin %</th>
                <th className="border-b py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row, index) => {
                const editing = editingRollupId === row.id;
                const marginTone = signedNumberClass(row.margin);

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      data-rollup-editor-trigger="true"
                      onClick={(event) => openRollupEditor(row.id, event)}
                      className={`cursor-pointer border-b transition ${editing
                          ? isDark
                            ? "bg-blue-500/10"
                            : "bg-blue-50/70"
                          : isDark
                            ? "hover:bg-white/5"
                            : "hover:bg-slate-50"
                        }`}
                    >
                      <td className={`border-b py-4 pr-3 font-black text-blue-600 ${rowBorder}`}>{index + 1}</td>
                      <td className={`min-w-[260px] border-b py-4 pr-3 ${rowBorder}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${row.logoClass}`}>
                            {row.logo}
                          </div>
                          <p className={`truncate rounded-lg px-1 py-1 font-black ${titleText}`}>{row.contract}</p>
                        </div>
                      </td>
                      <td className={`border-b py-4 pr-3 text-center ${rowBorder}`}>{row.routes}</td>
                      <td className={`border-b py-4 pr-3 text-center ${rowBorder}`}>{row.stops}</td>
                      <td className={`border-b py-4 pr-3 text-right font-black ${titleText} ${rowBorder}`}>{currency.format(row.revenue)}</td>
                      <td className={`border-b py-4 pr-3 text-right font-black ${titleText} ${rowBorder}`}>{currency.format(row.totalCosts)}</td>
                      <td className={`border-b py-4 pr-3 text-center font-black text-red-600 ${rowBorder}`}>{row.claims.toLocaleString()}</td>
                      <td className={`border-b py-4 pr-3 text-right font-black ${signedNumberClass(row.netProfit)} ${rowBorder}`}>{currency.format(row.netProfit)}</td>
                      <td className={`border-b py-4 pr-3 text-right font-black ${marginTone} ${rowBorder}`}>{row.margin.toFixed(2)}%</td>
                      <td className={`border-b py-4 text-center ${rowBorder}`}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            data-rollup-editor-trigger="true"
                            onClick={(event) => {
                              event.stopPropagation();
                              openRollupEditor(row.id, event);
                            }}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteRollupRow(row.id);
                            }}
                            className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr className={isDark ? "bg-white/5" : "bg-blue-50/60"}>
                <td className="py-4 pr-3 font-black" colSpan="2">PORTFOLIO TOTALS</td>
                <td className="py-4 pr-3 text-center font-black">{totals.routes}</td>
                <td className="py-4 pr-3 text-center font-black">{totals.stops}</td>
                <td className="py-4 pr-3 text-right font-black">{currency.format(totals.revenue)}</td>
                <td className="py-4 pr-3 text-right font-black">{currency.format(totals.totalCosts)}</td>
                <td className="py-4 pr-3 text-center font-black text-red-600">{totals.claims.toLocaleString()}</td>
                <td className={`py-4 pr-3 text-right font-black ${signedNumberClass(totals.netProfit)}`}>{currency.format(totals.netProfit)}</td>
                <td className={`py-4 pr-3 text-right font-black ${signedNumberClass(totals.margin)}`}>{totals.margin.toFixed(2)}%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {activeChartKey && (
        <div
          ref={chartPopupRef}
          className="fixed z-50 w-[min(560px,calc(100vw-2rem))]"
          style={{
            left: `${chartPopupPosition?.left ?? 16}px`,
            top: `${chartPopupPosition?.top ?? 96}px`,
            width: `${chartPopupPosition?.width ?? 560}px`,
          }}
        >
          <div
            className={isDark ? "overflow-y-auto rounded-2xl border border-blue-500/25 bg-slate-950/95 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl" : "overflow-y-auto rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/60 backdrop-blur-xl"}
            style={{ maxHeight: `${chartPopupPosition?.maxHeight ?? 420}px` }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Chart View</p>
                <h3 className={`mt-1 text-xl font-bold ${titleText}`}>
                  {activeChartKey === "profit" && "Net Profit by Contract"}
                  {activeChartKey === "costs" && "Cost Breakdown"}
                  {activeChartKey === "trend" && "Profitability Trend"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeChartPopup}
                className={isDark ? "rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15" : "rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"}
              >
                Close
              </button>
            </div>

            {activeChartKey === "profit" && (
              <div className="space-y-4">
                {rowsWithTotals
                  .slice()
                  .sort((a, b) => b.netProfit - a.netProfit)
                  .map((row) => {
                    const width = bestContract?.netProfit > 0 ? Math.max((row.netProfit / bestContract.netProfit) * 100, 8) : 0;
                    return (
                      <div key={row.id}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className={`truncate text-sm font-black ${titleText}`}>{row.contract}</p>
                          <p className={`whitespace-nowrap text-sm font-black ${signedNumberClass(row.netProfit)}`}>{currency.format(row.netProfit)}</p>
                        </div>
                        <div className={isDark ? "h-6 overflow-hidden rounded-full bg-white/10" : "h-6 overflow-hidden rounded-full bg-slate-100"}>
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {activeChartKey === "costs" && (
              <div className="space-y-4">
                {costBreakdownData.map((item, index) => {
                  const percent = Number(totalCostPercent(item.value));
                  return (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: costColors[index] }} />
                          <p className={`truncate text-sm font-black ${titleText}`}>{item.name}</p>
                        </div>
                        <p className={`whitespace-nowrap text-sm font-black ${titleText}`}>{currency.format(item.value)}</p>
                      </div>
                      <div className={isDark ? "h-5 overflow-hidden rounded-full bg-white/10" : "h-5 overflow-hidden rounded-full bg-slate-100"}>
                        <div className="h-full rounded-full" style={{ width: `${Math.max(percent, 6)}%`, backgroundColor: costColors[index] }} />
                      </div>
                      <p className={`mt-1 text-right text-xs font-black ${mutedText}`}>{percent.toFixed(1)}% of total costs</p>
                    </div>
                  );
                })}
              </div>
            )}

            {activeChartKey === "trend" && (
              hasTrendData ? (
                <div className="h-72 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="profitTrendPopupFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16A34A" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${Math.round(value / 1000)}K`} />
                      <Tooltip formatter={(value) => currency.format(value)} />
                      <Area type="monotone" dataKey="profit" stroke="#16A34A" strokeWidth={3} fill="url(#profitTrendPopupFill)" dot={{ r: 5, fill: "#16A34A", strokeWidth: 2, stroke: "#ffffff" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={isDark ? "rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center" : "rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"}>
                  <p className={`text-lg font-bold ${titleText}`}>No trend data yet</p>
                  <p className={`mt-2 text-sm ${mutedText}`}>Profit history will appear after real contracts or route results are saved.</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <RollupEditorPanel
        isDark={isDark}
        editingRollupRow={editingRollupRow}
        rollupEditorRef={rollupEditorRef}
        rollupEditorPosition={rollupEditorPosition}
        mutedText={mutedText}
        rowBorder={rowBorder}
        signedNumberClass={signedNumberClass}
        draftTotalsPanelClass={draftTotalsPanelClass}
        draftTotalsBorderClass={draftTotalsBorderClass}
        closeRollupEditor={closeRollupEditor}
        updateRollupDraft={updateRollupDraft}
        saveRollupDraft={saveRollupDraft}
      />
    </div>
  );
}

export default ProfitabilityDashboard;
