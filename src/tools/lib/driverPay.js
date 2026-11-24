// Crew pay math for the public driver pay calculator. Pure.
// Pay types: "day" (flat per day), "stop" (per stop), "hour" (per hour).
//
// Overtime follows the federal method for non-exempt workers: every hour is paid at
// straight time, and each hour over 40 in the week adds half the regular rate, where
// the regular rate = straight-time weekly pay / hours worked. For hourly pay that's
// the familiar 1.5x; it also covers day-rate and per-stop pay.

export function dailyWages(type, rate, { stops, hours }) {
  if (type === "stop") return rate * stops;
  if (type === "hour") return rate * hours;
  return rate;
}

function person(type, rate, work, overtime) {
  const day = dailyWages(type, rate, work);
  const weeklyHours = work.hours * work.days;
  const straight = day * work.days;
  const regularRate = weeklyHours > 0 ? straight / weeklyHours : 0;
  const otHours = Math.max(0, weeklyHours - 40);
  const otPremium = 0.5 * regularRate * otHours;
  const week = straight + (overtime ? otPremium : 0);
  return {
    day,
    week,
    otPremium,
    effectiveHourly: weeklyHours > 0 ? week / weeklyHours : 0,
    perStop: work.stops > 0 ? day / work.stops : 0,
    perHour: work.hours > 0 ? day / work.hours : 0,
  };
}

export function computeCrewPay(n) {
  const work = { stops: Math.max(0, n.stops), hours: Math.max(0, n.hours), days: Math.max(0, n.days) };
  const helpers = Math.max(0, Math.round(n.helperCount));
  const burden = Math.max(0, n.burdenPct) / 100;

  const driver = person(n.driverType, n.driverRate, work, n.overtime);
  const helper = person(n.helperType, n.helperRate, work, n.overtime);

  const weeklyWages = driver.week + helper.week * helpers;
  const weeklyCost = weeklyWages * (1 + burden);
  const dailyCost = work.days > 0 ? weeklyCost / work.days : 0;
  const otExposure = (driver.otPremium + helper.otPremium * helpers) * (1 + burden);

  const atVolume = (stops) => {
    const w = { ...work, stops };
    const d = person(n.driverType, n.driverRate, w, n.overtime);
    const h = person(n.helperType, n.helperRate, w, n.overtime);
    const cost = ((d.week + h.week * helpers) * (1 + burden)) / (work.days || 1);
    return { stops, cost, perStop: stops > 0 ? cost / stops : 0, driverHourly: d.effectiveHourly };
  };

  return {
    driver,
    helper,
    helpers,
    weeklyHours: work.hours * work.days,
    otHours: Math.max(0, work.hours * work.days - 40),
    otExposure,
    weeklyWages,
    weeklyCost,
    dailyCost,
    monthlyCost: weeklyCost * 4.33,
    yearlyCost: weeklyCost * 52,
    perStop: work.stops > 0 ? dailyCost / work.stops : 0,
    laborShare: n.routeRevenue > 0 ? dailyCost / n.routeRevenue : null,
    volumes: [0.75, 1, 1.25].map((f) => atVolume(Math.round(work.stops * f))),
  };
}
