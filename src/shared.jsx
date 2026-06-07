import React, { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  BriefcaseBusiness,
  Calculator,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileDown,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageCircle,
  Moon,
  Sun,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  ReceiptText,
  Sparkles,
  Target,
  Trash2,
  Truck,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  BriefcaseBusiness,
  Calculator,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileDown,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageCircle,
  Moon,
  Sun,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  ReceiptText,
  Sparkles,
  Target,
  Trash2,
  Truck,
  Upload,
  UserPlus,
  Users,
  X,
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
};

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const defaultForm = {
  scenarioName: "Lowe's Appliance Route",
  routePay: 1200,
  perStopPay: 0,
  stops: 20,
  installPay: 0,
  accessorialPay: 0,
  fuelSurcharge: 0,
  reattemptPay: 0,
  miles: 120,
  mpg: 10,
  fuelPrice: 3.75,
  routeHours: 10,
  driverPay: 220,
  helperPay: 180,
  tollsParking: 25,
  dailyTruckPayment: 90,
  dailyInsurance: 65,
  maintenancePerMile: 0.5,
  phoneSoftware: 15,
  claimsChargebacks: 75,
  otherCosts: 0,
  targetProfit: 500,
  claimsPerWeek: 2,
  averageClaimAmount: 450,
  routesPerWeek: 10,
  escrowPerWeek: 200,
  weeksPerMonth: 4.33,
  weeksPerYear: 52,
  routeType: "Appliance Delivery",
  vehicleType: "Box Truck",
};

export const initialTeams = [
  {
    id: "TEAM-A",
    name: "Team A",
    lead: "Marcus J.",
    helper: "Devon R.",
    truck: "204",
    route: "Syracuse Appliance",
    complianceScore: 96,
    surveyAvg: 9.6,
    routesCompleted: 42,
    status: "Good",
    photoUrl: "",
    photoUploadedAt: "6:42 AM",
    photoStatus: "Uploaded",
  },
  {
    id: "TEAM-B",
    name: "Team B",
    lead: "Chris M.",
    helper: "Andre P.",
    truck: "118",
    route: "Furniture Route",
    complianceScore: 78,
    surveyAvg: 8.2,
    routesCompleted: 38,
    status: "Watch",
    photoUrl: "",
    photoUploadedAt: "7:04 AM",
    photoStatus: "Uploaded",
  },
  {
    id: "TEAM-C",
    name: "Team C",
    lead: "Mike S.",
    helper: "Jordan K.",
    truck: "309",
    route: "Syracuse Appliance",
    complianceScore: 62,
    surveyAvg: 7.9,
    routesCompleted: 31,
    status: "At Risk",
    photoUrl: "",
    photoUploadedAt: "Missing",
    photoStatus: "Missing",
  },
  {
    id: "TEAM-D",
    name: "Team D",
    lead: "Tony R.",
    helper: "Luis G.",
    truck: "226",
    route: "Mattress Route",
    complianceScore: 91,
    surveyAvg: 9.1,
    routesCompleted: 35,
    status: "Good",
    photoUrl: "",
    photoUploadedAt: "6:55 AM",
    photoStatus: "Uploaded",
  },
];

export const initialClaims = [
  {
    id: "CLM-1009",
    category: "Property",
    type: "Wall Damage",
    team: "Team C",
    driver: "Mike S.",
    route: "Syracuse Appliance",
    amount: 950,
    status: "Open",
    preventable: "Yes",
    date: "Today",
    risk: "High",
  },
  {
    id: "CLM-1008",
    category: "Cargo",
    type: "Product Damage",
    team: "Team B",
    driver: "Chris M.",
    route: "Furniture Route",
    amount: 725,
    status: "Under Review",
    preventable: "Maybe",
    date: "Today",
    risk: "Medium",
  },
  {
    id: "CLM-1007",
    category: "Penalty",
    type: "Missed Delivery Window",
    team: "Team D",
    driver: "Tony R.",
    route: "Mattress Route",
    amount: 250,
    status: "Open",
    preventable: "Yes",
    date: "Yesterday",
    risk: "Medium",
  },
  {
    id: "CLM-1006",
    category: "Property",
    type: "Floor Scratch",
    team: "Team C",
    driver: "Mike S.",
    route: "Syracuse Appliance",
    amount: 675,
    status: "Open",
    preventable: "Yes",
    date: "2 days ago",
    risk: "High",
  },
];


export const claimTypeOptions = {
  Penalty: [
    "Missed delivery window",
    "Late arrival",
    "No call-ahead",
    "Failed photo compliance",
    "Incomplete paperwork",
    "Failed install requirement",
    "Service level failure",
    "Retailer chargeback",
    "Refused route / no coverage",
    "Improper status update",
    "Late departure",
    "No access / no attempt penalty",
    "Customer not contacted",
    "Route abandonment",
    "Failure to scan / status order",
  ],
  Cargo: [
    "Product damage",
    "Concealed damage",
    "Missing parts",
    "Wrong item delivered",
    "Improper securement",
    "Appliance dent / scratch",
    "Furniture damage",
    "Lost item",
    "Failed return pickup",
    "Unreported damage",
    "Crushed box / packaging damage",
    "Water line kit damage",
    "Haul-away item issue",
    "Product not secured in truck",
  ],
  Property: [
    "Wall damage",
    "Floor scratch",
    "Door frame damage",
    "Stair damage",
    "Railing damage",
    "Driveway damage",
    "Yard / lawn damage",
    "Water leak",
    "Home fixture damage",
    "Customer personal property damage",
    "Cabinet damage",
    "Countertop damage",
    "Ceiling damage",
    "Garage door damage",
    "Appliance install leak",
  ],
};

export const defaultSettings = {
  companyName: "Will's Fleet",
  themeMode: "light",
  accentColor: "blue",
  tourCompleted: false,
  dashboardWidgets: {
    periodMetrics: true,
    todaysProfit: true,
    financialSummary: true,
    needsAttention: true,
    routeHealth: true,
    routeEfficiency: true,
    recentClaims: true,
    savedRoutes: true,
    recentActivity: true,
    teamReadiness: false,
    complianceStatus: false,
    activeContracts: false,
    contractPerformance: false,
    upcomingRenewals: false,
    fuelCostTracker: false,
    documentExpirations: false,
    insuranceSummary: false,
  },
  dashboardWidgetOrder: [
    "periodMetrics",
    "todaysProfit",
    "financialSummary",
    "needsAttention",
    "routeHealth",
    "routeEfficiency",
    "recentClaims",
    "savedRoutes",
    "recentActivity",
    "teamReadiness",
    "activeContracts",
    "contractPerformance",
    "upcomingRenewals",
    "complianceStatus",
    "fuelCostTracker",
    "documentExpirations",
    "insuranceSummary",
  ],
  claimRiskThresholds: {
    medium: 200,
    high: 500,
  },
  profitabilityBenchmarks: {
    enabled: true,
    targetMargin: 25,
    claimsReserveTarget: 2500,
    reviewLineMargin: 20,
  },
};

export const accentThemes = {
  blue: {
    name: "Blue",
    button: "bg-blue-600 hover:bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-500/40",
    soft: "bg-blue-500/10",
    icon: "bg-blue-600",
  },
  emerald: {
    name: "Emerald",
    button: "bg-emerald-600 hover:bg-emerald-500",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    soft: "bg-emerald-500/10",
    icon: "bg-emerald-600",
  },
  purple: {
    name: "Purple",
    button: "bg-purple-600 hover:bg-purple-500",
    text: "text-purple-400",
    border: "border-purple-500/40",
    soft: "bg-purple-500/10",
    icon: "bg-purple-600",
  },
  red: {
    name: "Red",
    button: "bg-red-600 hover:bg-red-500",
    text: "text-red-400",
    border: "border-red-500/40",
    soft: "bg-red-500/10",
    icon: "bg-red-600",
  },
  orange: {
    name: "Orange",
    button: "bg-orange-600 hover:bg-orange-500",
    text: "text-orange-400",
    border: "border-orange-500/40",
    soft: "bg-orange-500/10",
    icon: "bg-orange-600",
  },
};

export function toNum(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

export function Card({ children, className = "" }) {
  return (
    <div className={`app-card rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

// Shimmer placeholder for loading states. Compose several to mimic the shape
// of the content that's about to appear (lines, chips, avatars).
export function Skeleton({ className = "" }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

// Shared button primitive. Encapsulates the primary/secondary/ghost/danger
// styles that were previously re-implemented inline across every page, so they
// stay consistent (and tactile — the base layer animates transform/shadow).
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60";

export function Button({ variant = "primary", isDark = false, className = "", type = "button", children, ...props }) {
  const variants = {
    primary: "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500",
    danger: "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-500",
    secondary: isDark
      ? "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: isDark
      ? "text-slate-300 hover:bg-white/5"
      : "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button type={type} className={`${BUTTON_BASE} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Shared status/label pill. `tone` maps to the app's semantic color language.
export function Badge({ tone = "neutral", isDark = false, className = "", children }) {
  const tones = {
    good: "bg-emerald-500/10 text-emerald-700",
    warn: "bg-amber-500/10 text-amber-700",
    danger: "bg-red-500/10 text-red-700",
    info: "bg-blue-500/10 text-blue-700",
    neutral: isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
}

export function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
      />
    </div>
  );
}

export function Field({ label, value, onChange, prefix, suffix, step = "0.01" }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-2.5 text-sm text-slate-500">{prefix}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500 ${
            prefix ? "pl-7" : ""
          } ${suffix ? "pr-12" : ""}`}
        />
        {suffix && <span className="absolute right-3 top-2.5 text-sm text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

export function MetricCard({ title, value, note, icon: Icon, color = "text-white" }) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-400">{title}</p>
          <p className={`safe-number mt-2 text-3xl font-black tracking-tight ${color}`} title={String(value)}>{value}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{note}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-white/5 p-3">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
      </div>
    </Card>
  );
}

export function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-blue-500/10 p-2">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Card>
  );
}

export function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <span className={strong ? "truncate font-semibold text-white" : "truncate text-slate-400"}>{label}</span>
      <span className={strong ? "safe-number text-right font-bold text-white" : "safe-number text-right text-slate-200"} title={String(value)}>{value}</span>
    </div>
  );
}

export function StatusBadge({ status }) {
  const classes =
    status === "Good" || status === "Uploaded" || status === "Closed" || status === "Valid"
      ? "bg-emerald-500/15 text-emerald-400"
      : status === "Watch" || status === "Medium" || status === "Under Review" || status === "Expiring Soon"
      ? "bg-yellow-500/15 text-yellow-400"
      : "bg-red-500/15 text-red-400";

  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${classes}`}>{status}</span>;
}

export function CostPieChart({ results }) {
  const data = [
    { name: "Fuel", value: results.fuelCost },
    { name: "Labor", value: results.laborCosts },
    { name: "Maintenance", value: results.maintenanceCost },
    { name: "Fixed Costs", value: results.fixedCosts },
    {
      name: "Other Variable",
      value: Math.max(results.variableCosts - results.fuelCost - results.laborCosts - results.maintenanceCost, 0),
    },
  ].filter((item) => item.value > 0);

  const colors = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#eab308"];

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Cost Breakdown</h2>
        <p className="text-sm text-slate-400">Where the route money disappears, tragically.</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => currency.format(value)}
              contentStyle={{
                background: "#020617",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <div>
              <p className="text-xs text-slate-400">{item.name}</p>
              <p className="text-sm font-bold text-white">{currency.format(item.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ProfitTrendChart() {
  const data = [
    { day: "Mon", profit: 225 },
    { day: "Tue", profit: 300 },
    { day: "Wed", profit: 565 },
    { day: "Thu", profit: 475 },
    { day: "Fri", profit: 430 },
    { day: "Sat", profit: 810 },
    { day: "Sun", profit: 645 },
  ];

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            Profit Trend <span className="text-sm font-medium text-slate-400">(Last 7 Days)</span>
          </h2>
          <p className="text-sm text-slate-400">Daily net profit performance</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
          Daily View
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value) => currency.format(value)}
              contentStyle={{
                background: "#020617",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                color: "#fff",
                boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#22c55e"
              strokeWidth={3}
              fill="url(#profitGradient)"
              dot={{ r: 4, fill: "#22c55e", stroke: "#020617", strokeWidth: 2 }}
              activeDot={{ r: 7, fill: "#22c55e", stroke: "#bbf7d0", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
