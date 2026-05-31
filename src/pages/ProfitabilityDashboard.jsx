import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  BarChart3,
  CartesianGrid,
  currency,
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
}) {
  const [profitabilityView, setProfitabilityView] = useState("All Contracts");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState("home-depot");


  const [rollupRows, setRollupRows] = useState([
    {
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
    },
  ]);

  const toNumber = (value) => Number(value || 0);
  const marginFactors = appSettings?.marginFactors || {};
  const enabledFactor = (category, key) => marginFactors?.[category]?.[key] !== false;
  const categoryHasVisibleFactors = (category) => {
    const values = Object.values(marginFactors?.[category] || {});
    return values.length === 0 || values.some(Boolean);
  };
  const anyCostEnabled = (...keys) => keys.some((key) => enabledFactor("costs", key));
  const anyRevenueEnabled = (...keys) => keys.some((key) => enabledFactor("revenue", key));

  const rowsWithTotals = useMemo(() => {
    return rollupRows.map((row) => {
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
      const totalCosts =
        labor +
        fuel +
        truckInsurance +
        maintenance +
        claims +
        other;

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
    });
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

  const bestContract = rowsWithTotals.reduce((best, row) => (row.margin > best.margin ? row : best), rowsWithTotals[0]);
  const worstContract = rowsWithTotals.reduce((worst, row) => (row.margin < worst.margin ? row : worst), rowsWithTotals[0]);

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

  const trendData = [
    { week: "Mar 24", profit: 5200 },
    { week: "Mar 31", profit: 5300 },
    { week: "Apr 7", profit: 10100 },
    { week: "Apr 14", profit: 12600 },
    { week: "Apr 21", profit: 19000 },
    { week: "Apr 28", profit: 20400 },
    { week: "May 5", profit: 20550 },
    { week: "May 12", profit: 19950 },
  ];

  const updateRollupRow = (id, key, value) => {
    const numberFields = [
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

    setRollupRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
            ...row,
            [key]: numberFields.includes(key) ? Number(value || 0) : value,
          }
          : row
      )
    );
  };

  const addRollupRow = () => {
    const id = `contract-${Date.now()}`;
    setRollupRows((current) => [
      ...current,
      {
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
      },
    ]);
    setExpandedRowId(id);
  };

  const deleteRollupRow = (id) => {
    const row = rollupRows.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete ${row?.contract || "this contract"}? This cannot be undone.`
    );

    if (!confirmed) return;

    setRollupRows((current) => current.filter((row) => row.id !== id));
    if (expandedRowId === id) {
      setExpandedRowId(null);
    }
  };

  const exportRollup = () => {
    const summary = [
      "Final Mile Margin - Contract Roll-Up",
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
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const rowBorder = isDark ? "border-white/10" : "border-slate-200";
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-blue-500";

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
      tone: "green",
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
      tone: "purple",
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
  };

  const totalCostPercent = (value) => (totals.totalCosts > 0 ? ((value / totals.totalCosts) * 100).toFixed(1) : "0.0");

  if (profitabilityView === "Single Route") {
    const routeRevenue = enabledFactor("revenue", "routePay") ? toNumber(form.routePay) : 0;
    const extraStops = toNumber(form.stops);
    const perStopRevenue = anyRevenueEnabled("perStopPay", "extraStops") ? toNumber(form.perStopPay) : 0;
    const installRevenue = enabledFactor("revenue", "installRevenue") ? toNumber(form.installPay) : 0;
    const accessorialRevenue = anyRevenueEnabled("haulAwayRevenue", "stairsLongCarry", "detentionWaitTime", "assemblySetup", "otherAccessorials")
      ? toNumber(form.accessorialPay)
      : 0;
    const fuelSurcharge = enabledFactor("revenue", "fuelSurcharge") ? toNumber(form.fuelSurcharge) : 0;
    const reattemptRevenue = enabledFactor("revenue", "reattemptFee") ? toNumber(form.reattemptPay) : 0;

    const totalRouteRevenue =
      routeRevenue +
      extraStops * perStopRevenue +
      installRevenue +
      accessorialRevenue +
      fuelSurcharge +
      reattemptRevenue;

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

    const showStopsField = anyRevenueEnabled("extraStops", "perStopPay") || enabledFactor("metrics", "profitPerStop") || enabledFactor("metrics", "stopsPerHour") || enabledFactor("metrics", "milesPerStop");
    const showAccessorialField = anyRevenueEnabled("haulAwayRevenue", "stairsLongCarry", "detentionWaitTime", "assemblySetup", "otherAccessorials");

    const revenueFields = [
      ["Base Route Pay", "routePay", "Flat route revenue", enabledFactor("revenue", "routePay")],
      ["Stops", "stops", "Total stops on route", showStopsField],
      ["Per Stop Pay", "perStopPay", "Revenue per additional stop", anyRevenueEnabled("perStopPay", "extraStops")],
      ["Install Revenue", "installPay", "Install / accessory work", enabledFactor("revenue", "installRevenue")],
      ["Accessorials", "accessorialPay", "Haul away, stairs, special handling", showAccessorialField],
      ["Fuel Surcharge", "fuelSurcharge", "Fuel recovery revenue", enabledFactor("revenue", "fuelSurcharge")],
      ["Reattempt Pay", "reattemptPay", "Redelivery / trip fee revenue", enabledFactor("revenue", "reattemptFee")],
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
      ["Net Profit", routeNetProfit, "text-emerald-700", BarChart3, "", enabledFactor("metrics", "netProfit")],
      ["Margin", routeMargin, routeMargin >= 25 ? "text-emerald-700" : routeMargin >= 15 ? "text-orange-600" : "text-red-600", Truck, "%", enabledFactor("metrics", "marginPercent")],
    ].filter(([, , , , , visible]) => visible);

    const efficiencyCards = [
      ["Profit / Stop", profitPerStop, enabledFactor("metrics", "profitPerStop")],
      ["Profit / Mile", profitPerMile, enabledFactor("metrics", "profitPerMile")],
      ["Profit / Hour", profitPerHour, enabledFactor("metrics", "profitPerHour")],
      ["Fuel Cost", fuelCost, enabledFactor("costs", "fuel")],
    ].filter(([, , visible]) => visible);

    return (
      <div className={pageClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${titleText}`}>Profitability</h1>
            <p className={`mt-1 text-sm ${mutedText}`}>Single route calculator with accessorials, costs, and live margin.</p>
          </div>
        </div>

        <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-sm font-black ${titleText}`}>View:</span>
              <div className={isDark ? "rounded-2xl bg-white/5 p-1" : "rounded-2xl bg-slate-100 p-1"}>
                {["All Contracts", "Single Route"].map((view) => (
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

        <div className="grid gap-4 xl:grid-cols-4">
          {summaryCards.map(([label, value, tone, Icon, suffix]) => (
            <div key={label} className={cardClass}>
              <div className="flex items-center gap-4">
                <div className={isDark ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-blue-300" : "flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</p>
                  <p className={`mt-1 text-3xl font-black ${tone}`}>
                    {suffix === "%" ? `${value.toFixed(2)}%` : currency.format(value)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={cardClass}>
            <div className="mb-5">
              <h2 className={`text-xl font-black ${titleText}`}>Route Revenue</h2>
              <p className={`text-sm ${mutedText}`}>Enter pay items, extra stops, accessorials, and route revenue.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {revenueFields.map(([label, key, help]) => (
                <div key={key}>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</label>
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
          </div>

          <div className={cardClass}>
            <div className="mb-5">
              <h2 className={`text-xl font-black ${titleText}`}>Live Route Summary</h2>
              <p className={`text-sm ${mutedText}`}>Profitability updates as numbers change.</p>
            </div>

            <div className="space-y-4">
              {[
                ["Revenue", totalRouteRevenue, "text-blue-600", categoryHasVisibleFactors("revenue")],
                ["Cost", totalRouteCost, "text-red-600", categoryHasVisibleFactors("costs")],
                ["Net Profit", routeNetProfit, "text-emerald-700", enabledFactor("metrics", "netProfit")],
              ].filter(([, , , visible]) => visible).map(([label, value, tone]) => (
                <div key={label} className={`flex items-center justify-between border-b pb-3 ${rowBorder}`}>
                  <p className={`font-bold ${mutedText}`}>{label}</p>
                  <p className={`text-xl font-black ${tone}`}>{currency.format(value)}</p>
                </div>
              ))}

              {enabledFactor("metrics", "marginPercent") && (
                <div className={isDark ? "rounded-2xl bg-slate-950/70 p-4" : "rounded-2xl bg-emerald-50 p-4"}>
                  <p className={`text-sm font-black ${mutedText}`}>Margin</p>
                  <p className={`mt-1 text-4xl font-black ${routeMargin >= 25 ? "text-emerald-700" : routeMargin >= 15 ? "text-orange-600" : "text-red-600"}`}>
                    {routeMargin.toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={cardClass}>
            <div className="mb-5">
              <h2 className={`text-xl font-black ${titleText}`}>Route Costs</h2>
              <p className={`text-sm ${mutedText}`}>Labor, fuel, truck, insurance, maintenance, and claim reserves.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {costFields.map(([label, key, help]) => (
                <div key={key}>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</label>
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
          </div>

          <div className={cardClass}>
            <div className="mb-5">
              <h2 className={`text-xl font-black ${titleText}`}>Route Efficiency</h2>
              <p className={`text-sm ${mutedText}`}>See whether the route is worth the work.</p>
            </div>

            <div className="grid gap-4">
              {efficiencyCards.map(([label, value]) => (
                <div key={label} className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/70 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
                  <p className={`text-sm font-black ${mutedText}`}>{label}</p>
                  <p className={`mt-1 text-2xl font-black ${value >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {currency.format(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={`text-xl font-black ${titleText}`}>Scenario Buttons</h2>
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

      <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-sm font-black ${titleText}`}>View:</span>
            <div className={isDark ? "rounded-2xl bg-white/5 p-1" : "rounded-2xl bg-slate-100 p-1"}>
              {["All Contracts", "Single Route"].map((view) => (
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

      <div className="grid gap-4 xl:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const chartColor = card.tone === "red" ? "#EF4444" : card.tone === "green" ? "#16A34A" : card.tone === "purple" ? "#7C3AED" : "#2563EB";

          return (
            <div key={card.title} className={`${cardClass} overflow-hidden`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${toneStyles[card.tone]}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>{card.title}</p>
                  <p
                    className={`mt-2 truncate text-2xl font-black ${card.tone === "green"
                        ? "text-emerald-700"
                        : card.tone === "red"
                          ? "text-red-600"
                          : titleText
                      }`}
                  >
                    {card.value}
                  </p>
                  <p className={`mt-2 text-xs font-semibold ${mutedText}`}>{card.note}</p>
                </div>
              </div>

              <div className={isDark ? "mt-5 h-16 overflow-hidden rounded-xl bg-slate-950/30" : "mt-5 h-16 overflow-hidden rounded-xl bg-slate-50/70"}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke={chartColor}
                      fill={chartColor}
                      fillOpacity={isDark ? 0.14 : 0.18}
                      strokeWidth={3}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
                <p className={isDark ? "text-xs font-black uppercase tracking-wide text-amber-300" : "text-xs font-black uppercase tracking-wide text-amber-800"}>Margin Range</p>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-1 min-w-0">
                      <p className="text-xs font-black uppercase leading-tight text-emerald-700">Strongest Margin</p>
                      <p className="mt-1 break-words text-lg font-black leading-tight text-emerald-700">{bestContract?.margin.toFixed(2)}%</p>
                    </div>
                    <p className={isDark ? "break-words text-sm font-black leading-snug text-white" : "break-words text-sm font-black leading-snug text-slate-950"}>{bestContract?.contract}</p>
                  </div>

                  <div className={isDark ? "border-t border-white/10 pt-4" : "border-t border-amber-200 pt-4"}>
                    <div className="mb-1 min-w-0">
                      <p className="text-xs font-black uppercase leading-tight text-red-600">Needs Review</p>
                      <p className="mt-1 break-words text-lg font-black leading-tight text-red-600">{worstContract?.margin.toFixed(2)}%</p>
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
              <h2 className={`text-lg font-black ${titleText}`}>Net Profit by Contract</h2>
              <p className={`mt-1 text-xs ${mutedText}`}>Ranked from strongest to weakest.</p>
            </div>
            <button onClick={() => setProfitabilityView("All Contracts")} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600">View chart</button>
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
                      <p className="whitespace-nowrap text-sm font-black text-emerald-700">{currency.format(row.netProfit)}</p>
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
              <h2 className={`text-lg font-black ${titleText}`}>Cost Breakdown (Totals)</h2>
              <p className={`mt-1 text-xs ${mutedText}`}>Clean dollar view by category.</p>
            </div>
            <button onClick={() => setProfitabilityView("All Contracts")} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600">View chart</button>
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
            <h2 className={`text-lg font-black ${titleText}`}>Profitability Trend (8 Weeks)</h2>
            <button onClick={() => setProfitabilityView("All Contracts")} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600">View chart</button>
          </div>
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
          </div>
        )}
      </div>

      <div className={cardClass}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-xl font-black ${titleText}`}>Contracts Roll-Up</h2>
            <p className={`text-sm ${mutedText}`}>
              Click any row to expand and edit details. All values are editable.
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
                const expanded = expandedRowId === row.id;
                const marginTone = row.margin >= 28 ? "text-emerald-700" : row.margin >= 22 ? "text-orange-600" : "text-red-600";

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => setExpandedRowId(expanded ? null : row.id)}
                      className={`cursor-pointer border-b transition ${expanded
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
                          <div>
                            <input
                              value={row.contract}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateRollupRow(row.id, "contract", event.target.value)}
                              className={isDark ? "w-full rounded-lg bg-transparent px-1 py-1 font-black text-white outline-none focus:bg-slate-950" : "w-full rounded-lg bg-transparent px-1 py-1 font-black text-slate-950 outline-none focus:bg-white"}
                            />
                          </div>
                        </div>
                      </td>
                      <td className={`border-b py-4 pr-3 text-center ${rowBorder}`}>{row.routes}</td>
                      <td className={`border-b py-4 pr-3 text-center ${rowBorder}`}>{row.stops}</td>
                      <td className={`border-b py-4 pr-3 text-right font-black ${titleText} ${rowBorder}`}>{currency.format(row.revenue)}</td>
                      <td className={`border-b py-4 pr-3 text-right font-black ${titleText} ${rowBorder}`}>{currency.format(row.totalCosts)}</td>
                      <td className={`border-b py-4 pr-3 text-center font-black text-red-600 ${rowBorder}`}>{row.claims.toLocaleString()}</td>
                      <td className={`border-b py-4 pr-3 text-right font-black text-emerald-700 ${rowBorder}`}>{currency.format(row.netProfit)}</td>
                      <td className={`border-b py-4 pr-3 text-right font-black ${marginTone} ${rowBorder}`}>{row.margin.toFixed(2)}%</td>
                      <td className={`border-b py-4 text-center ${rowBorder}`}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedRowId(expanded ? null : row.id);
                            }}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"
                          >
                            {expanded ? "Close" : "Edit"}
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

                    {expanded && (
                      <tr>
                        <td colSpan="10" className={`border-b p-0 ${rowBorder}`}>
                          <div className={isDark ? "m-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4" : "m-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4"}>
                            <div className="grid gap-4 xl:grid-cols-[1fr_230px]">
                              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                  ["Labor", "labor"],
                                  ["Fuel", "fuel"],
                                  ["Truck / Insurance", "truckInsurance"],
                                  ["Maintenance", "maintenance"],
                                  ["Other Costs", "other"],
                                  ["Routes / Week", "routes"],
                                  ["Stops / Week", "stops"],
                                  ["Revenue", "revenue"],
                                  ["Claims", "claims"],
                                ].map(([label, key]) => (
                                  <div key={key}>
                                    <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</label>
                                    <input
                                      type="number"
                                      value={row[key]}
                                      onChange={(event) => updateRollupRow(row.id, key, event.target.value)}
                                      className={inputClass}
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/70 p-5" : "rounded-2xl border border-emerald-100 bg-emerald-50 p-5"}>
                                <p className={`text-sm font-black ${mutedText}`}>Net Profit</p>
                                <p className="mt-2 text-2xl font-black text-emerald-700">{currency.format(row.netProfit)}</p>
                                <p className={`mt-5 text-sm font-black ${mutedText}`}>Margin %</p>
                                <p className={`mt-2 text-2xl font-black ${marginTone}`}>{row.margin.toFixed(2)}%</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
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
                <td className="py-4 pr-3 text-right font-black text-emerald-700">{currency.format(totals.netProfit)}</td>
                <td className="py-4 pr-3 text-right font-black text-emerald-700">{totals.margin.toFixed(2)}%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProfitabilityDashboard;
