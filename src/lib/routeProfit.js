// Route profit math. Shared by the app's Route Profit Check (App.jsx) and the public
// route profit calculator (/tools/route-profit-calculator) so both always agree.
// Pure and dependency-free.

export function toNum(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// One route day: revenue, costs, profit, and per-stop/mile/hour ratios.
export function computeRouteResults(form) {
  const routePay = toNum(form.routePay);
  const stops = toNum(form.stops);
  const miles = toNum(form.miles);
  const mpg = Math.max(toNum(form.mpg), 0.01);
  const routeHours = Math.max(toNum(form.routeHours), 0.01);

  const totalRevenue =
    routePay +
    toNum(form.perStopPay) * stops +
    toNum(form.installPay) +
    toNum(form.accessorialPay) +
    toNum(form.fuelSurcharge) +
    toNum(form.reattemptPay);

  const fuelCost = (miles / mpg) * toNum(form.fuelPrice);
  const maintenanceCost = miles * toNum(form.maintenancePerMile);
  const laborCosts = toNum(form.driverPay) + toNum(form.helperPay);
  const fixedCosts = toNum(form.dailyTruckPayment) + toNum(form.dailyInsurance) + toNum(form.phoneSoftware);
  const variableCosts = fuelCost + maintenanceCost + laborCosts + toNum(form.tollsParking) + toNum(form.claimsChargebacks) + toNum(form.otherCosts);
  const totalCost = fixedCosts + variableCosts;
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;
  const profitPerStop = stops > 0 ? netProfit / stops : 0;
  const profitPerMile = miles > 0 ? netProfit / miles : 0;
  const profitPerHour = routeHours > 0 ? netProfit / routeHours : 0;
  const revenuePerMile = miles > 0 ? totalRevenue / miles : 0;
  const costPerMile = miles > 0 ? totalCost / miles : 0;
  const requiredRevenue = totalCost + toNum(form.targetProfit);
  const requiredPerStop = stops > 0 ? requiredRevenue / stops : 0;
  const requiredRoutePay = Math.max(requiredRevenue - (totalRevenue - routePay), 0);

  return {
    totalRevenue,
    fuelCost,
    maintenanceCost,
    laborCosts,
    fixedCosts,
    variableCosts,
    totalCost,
    netProfit,
    profitMargin,
    profitPerStop,
    profitPerMile,
    profitPerHour,
    revenuePerMile,
    costPerMile,
    requiredRevenue,
    requiredPerStop,
    requiredRoutePay,
  };
}

export function getGrade(results) {
  const { netProfit, profitMargin, profitPerStop, revenuePerMile, costPerMile } = results;
  let score = 0;

  if (netProfit >= 500) score += 35;
  else if (netProfit >= 350) score += 28;
  else if (netProfit >= 200) score += 18;
  else if (netProfit >= 100) score += 8;

  if (profitMargin >= 0.3) score += 25;
  else if (profitMargin >= 0.2) score += 20;
  else if (profitMargin >= 0.12) score += 12;
  else if (profitMargin >= 0.06) score += 5;

  if (profitPerStop >= 25) score += 20;
  else if (profitPerStop >= 15) score += 15;
  else if (profitPerStop >= 8) score += 8;

  if (revenuePerMile - costPerMile >= 2.5) score += 20;
  else if (revenuePerMile - costPerMile >= 1.5) score += 14;
  else if (revenuePerMile - costPerMile >= 0.75) score += 8;

  if (netProfit < 0) return { grade: "F", label: "Losing Money", score, color: "text-red-400" };
  if (score >= 85) return { grade: "A", label: "Strong Route", score, color: "text-emerald-400" };
  if (score >= 70) return { grade: "B", label: "Good Route", score, color: "text-emerald-300" };
  if (score >= 50) return { grade: "C", label: "Thin Margin", score, color: "text-yellow-300" };
  if (score >= 30) return { grade: "D", label: "High Risk", score, color: "text-orange-400" };
  return { grade: "F", label: "Do Not Take", score, color: "text-red-400" };
}

// Plain-language warnings for a route day (same rules the app shows).
export function getRouteRisks(form, results) {
  const list = [];
  if (results.netProfit < 200) list.push("Net profit is low for a full route.");
  if (results.profitMargin < 0.15) list.push("Profit margin is thin. One claim or repair could wipe out the day.");
  if (results.laborCosts > results.totalRevenue * 0.35) list.push("Labor is taking more than 35% of revenue.");
  if (toNum(form.claimsChargebacks) > 100) list.push("Claims and chargebacks are eating too much margin.");
  if (results.profitPerStop < 10) list.push("Profit per stop is weak. Busy truck, sad wallet.");
  if (!list.length) list.push("Route looks healthy based on the numbers entered.");
  return list;
}
