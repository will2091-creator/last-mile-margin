// Cash Position — offline/demo seed data (mobile port).
//
// Mirror of the web app's src/data/cashPositionMockData.js and the SEED block in
// docs/supabase-cash-position.sql. Same payers, amounts (integer cents), and
// statuses; expected-pay dates are relative to TODAY so the aging buckets line
// up with the SQL (which uses current_date + N). When Supabase is configured AND
// the schema has been run, mobileRepository.loadCashPosition() replaces this with
// real rows; otherwise the screen renders from this seed.
//
// Named fixtures match the rest of the demo (Lowe's / Home Depot / Best Buy /
// RC Willey; drivers Marcus J., Mike S., Tony R., Chris M.).

const DAY_MS = 86400000;
const ymd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
// Local-midnight today + n days, as YYYY-MM-DD.
const addDays = (n) => {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return ymd(new Date(base.getTime() + n * DAY_MS));
};
const isoDaysAgo = (n) => new Date(Date.now() - n * DAY_MS).toISOString();

export const financingDefaults = { advanceRate: 0.85, feeRate: 0.02 };

export const mockReceivables = [
  { id: "rcv-101", payerName: "Lowe's",    sourceContractRef: "LOWES-APPL", sourceRoute: "Syracuse Appliance", amountCents: 482000, status: "verified",  expectedPayDate: addDays(8),  paidAt: null },
  { id: "rcv-102", payerName: "Lowe's",    sourceContractRef: "LOWES-APPL", sourceRoute: "Syracuse Appliance", amountCents: 315000, status: "invoiced",  expectedPayDate: addDays(22), paidAt: null },
  { id: "rcv-103", payerName: "Home Depot", sourceContractRef: "HD-LARGE",  sourceRoute: "Furniture Route",    amountCents: 294000, status: "completed", expectedPayDate: addDays(12), paidAt: null },
  { id: "rcv-104", payerName: "Home Depot", sourceContractRef: "HD-LARGE",  sourceRoute: "Furniture Route",    amountCents: 560000, status: "pending",   expectedPayDate: addDays(38), paidAt: null },
  { id: "rcv-105", payerName: "Best Buy",   sourceContractRef: "BBY-TECH",  sourceRoute: "Tech Route",         amountCents: 187500, status: "verified",  expectedPayDate: addDays(27), paidAt: null },
  { id: "rcv-106", payerName: "RC Willey",  sourceContractRef: "RCW-FURN",  sourceRoute: "Furniture Route",    amountCents: 624000, status: "completed", expectedPayDate: addDays(52), paidAt: null },
  { id: "rcv-107", payerName: "Best Buy",   sourceContractRef: "BBY-TECH",  sourceRoute: "Tech Route",         amountCents: 98050,  status: "invoiced",  expectedPayDate: addDays(5),  paidAt: null },
  { id: "rcv-108", payerName: "Lowe's",     sourceContractRef: "LOWES-APPL", sourceRoute: "Syracuse Appliance", amountCents: 145000, status: "disputed",  expectedPayDate: addDays(18), paidAt: null },
  { id: "rcv-109", payerName: "Home Depot", sourceContractRef: "HD-LARGE",  sourceRoute: "Furniture Route",    amountCents: 330000, status: "paid",      expectedPayDate: addDays(-6), paidAt: isoDaysAgo(6) },
];

export const mockDriverSettlements = [
  { id: "set-201", driverName: "Marcus J.", periodStart: addDays(-7),  periodEnd: addDays(-1), grossCents: 184000, deductionsCents: 12000, accessorialsCents: 9000,  netOwedCents: 181000, status: "finalized", expectedPayDate: addDays(3) },
  { id: "set-202", driverName: "Mike S.",   periodStart: addDays(-7),  periodEnd: addDays(-1), grossCents: 162000, deductionsCents: 20000, accessorialsCents: 0,     netOwedCents: 142000, status: "draft",     expectedPayDate: addDays(3) },
  { id: "set-203", driverName: "Tony R.",   periodStart: addDays(-14), periodEnd: addDays(-8), grossCents: 150000, deductionsCents: 5000,  accessorialsCents: 7500,  netOwedCents: 152500, status: "paid",      expectedPayDate: addDays(-4) },
  { id: "set-204", driverName: "Chris M.",  periodStart: addDays(-7),  periodEnd: addDays(-1), grossCents: 191000, deductionsCents: 0,     accessorialsCents: 13000, netOwedCents: 204000, status: "finalized", expectedPayDate: addDays(3) },
];
