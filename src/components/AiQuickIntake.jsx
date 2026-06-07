import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle2,
  claimTypeOptions,
  ClipboardCheck,
  currency,
  DollarSign,
  FileText,
  ShieldCheck,
  Skeleton,
  Truck,
  Upload,
} from "../shared";

const getAmount = (text) => {
  const dollarMatch = text.match(/\$\s*([0-9][0-9,]*(?:\.\d{2})?)/);
  const labelMatch = text.match(/(?:amount|claim|chargeback|deduction|total|revenue|route pay|pay)\D{0,24}([0-9][0-9,]*(?:\.\d{2})?)/i);
  return Number((dollarMatch?.[1] || labelMatch?.[1] || "0").replace(/,/g, ""));
};

const getNumberAfter = (text, labels) => {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\D{0,24}([0-9][0-9,]*(?:\\.\\d{1,2})?)`, "i"));
    if (match) return Number(match[1].replace(/,/g, ""));
  }
  return 0;
};

const findClaimType = (text) => {
  const normalized = text.toLowerCase();
  for (const [category, options] of Object.entries(claimTypeOptions)) {
    const match = options.find((option) => normalized.includes(option.toLowerCase()));
    if (match) return { category, type: match };
  }

  if (normalized.includes("wall")) return { category: "Property", type: "Wall damage" };
  if (normalized.includes("floor")) return { category: "Property", type: "Floor scratch" };
  if (normalized.includes("door")) return { category: "Property", type: "Door frame damage" };
  if (normalized.includes("dent") || normalized.includes("scratch")) return { category: "Cargo", type: "Appliance dent / scratch" };
  if (normalized.includes("late") || normalized.includes("window")) return { category: "Penalty", type: "Missed delivery window" };
  if (normalized.includes("photo")) return { category: "Penalty", type: "Failed photo compliance" };

  return { category: "Property", type: claimTypeOptions.Property[0] };
};

const getTodayLabel = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

const readFileAsText = (file) =>
  new Promise((resolve) => {
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      resolve(`[${file.type || "file"} attached: ${file.name}]`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve(`[Unreadable file attached: ${file.name}]`);
    reader.readAsText(file);
  });

const getEmailFromText = (text) => text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";

const getSourceLabel = (draft) => {
  if (!draft) return "Not analyzed";
  if (draft.type === "claim") return "Claim";
  if (draft.type === "route") return "Route Sheet";
  if (draft.type === "contract") return "Contract Terms";
  if (draft.type === "receipt") return "Receipt";
  return "File";
};

const intakeMockForms = [
  {
    id: "claim-email",
    label: "Claim Email",
    type: "Email",
    text: `From: claims@retailer.example
Subject: Claim REF-QA-101 - Wall damage chargeback

Please review claim REF-QA-101 for Syracuse Appliance route. Driver Mike S. / Team C reported wall damage at customer delivery.
Claim amount: $950.00.
Photos are missing from the packet. This is a property damage deduction and should be reviewed for dispute readiness.`,
  },
  {
    id: "route-sheet",
    label: "Route Sheet",
    type: "Route Sheet",
    text: `Route Sheet REF-QA-202
Customer: Lowe's Appliance Delivery
Route pay: $1,450.00
Stops: 18
Miles: 132
Fuel price: 3.89
Driver pay: 240
Helper pay: 170
Driver: Marcus J.
Notes: Includes two extra upstairs deliveries and one redelivery window.`,
  },
  {
    id: "contract-terms",
    label: "Contract Terms",
    type: "Contract Terms",
    text: `Contract terms REF-QA-303
Customer: Home Depot
Service area: Syracuse and surrounding ZIP codes
Flat rate: $1,250.00
Per stop: 65
Install: 30
Renewal: Jan 31, 2026
Terms: photos required before departure, POD required after delivery, claims packet due within 24 hours.`,
  },
  {
    id: "receipt-upload",
    label: "Receipt",
    type: "Receipt",
    text: `Receipt REF-QA-515
Vendor: Shell
Amount: $46.20
Type: Gas
Route: Lowe's Appliance Delivery
Truck: Demo Truck 214
Notes: Fuel purchased before north market appliance route.`,
  },
  {
    id: "mixed-intake",
    label: "Mixed Notes",
    type: "Notes",
    text: `Operations notes REF-QA-404
Team B / Chris M. handled Furniture Route.
Product damage reported on delivery, claim amount $725.00.
Route pay: $1,100.00
Stops: 16
Miles: 118
Fuel price: 3.75
Possible contract follow-up: Best Buy per stop rate should be reviewed.`,
  },
];

function AiQuickIntake({ teams, claims, isDark, appSettings, onAddClaim, onApplyRoute, onSaveToDay, navigateToTab, standalone = false, isDemoMode = false }) {
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [recentIntakes, setRecentIntakes] = useState([]);
  const [saveConfirmation, setSaveConfirmation] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState("");

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const softCard = isDark
    ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4"
    : "rounded-2xl border border-slate-200 bg-slate-50/80 p-4";
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none focus:border-blue-500";
  const dropClass = isDragging
    ? "rounded-2xl border-2 border-dashed border-blue-500 bg-blue-500/10 p-6"
    : isDark
      ? "rounded-2xl border border-dashed border-blue-500/60 bg-slate-950/70 p-6"
      : "rounded-2xl border border-dashed border-slate-300 bg-slate-300/60 p-6";

  const driverOptions = teams
    .flatMap((team) => [
      { name: team.lead, team: team.name, route: team.route },
      { name: team.helper, team: team.name, route: team.route },
    ])
    .filter((driver) => driver.name);

  const activeDraft = drafts.find((draft) => draft.id === activeDraftId) || drafts[0] || null;
  const sourceEmail = getEmailFromText(inputText);
  const sourceLabel = attachedFiles.length ? attachedFiles[0].name : sourceEmail || "Pasted text";
  const riskThresholds = {
    medium: Number(appSettings?.claimRiskThresholds?.medium ?? 200),
    high: Number(appSettings?.claimRiskThresholds?.high ?? 500),
  };
  const getRiskLevel = (amount) => {
    const numericAmount = Number(amount || 0);
    if (numericAmount >= riskThresholds.high) return "High";
    if (numericAmount >= riskThresholds.medium) return "Medium";
    return "Low";
  };

  const getDraftSourceType = (draft) => {
    if (!draft) return "Not analyzed";
    if (draft.type === "claim") return "Email";
    if (draft.type === "route") return "Route Sheet";
    if (draft.type === "contract") return "Contract Terms";
    if (draft.type === "receipt") return "Receipt";
    return "File";
  };

  const getNextClaimId = () => {
    const highestId = claims.reduce((highest, claim) => {
      const numericId = Number(String(claim?.id || "").replace(/\D/g, ""));
      return Number.isFinite(numericId) ? Math.max(highest, numericId) : highest;
    }, 1000);
    return `CLM-${highestId + 1}`;
  };

  const applyDraftResults = (nextDrafts, nextMessage, status = "") => {
    setDrafts(nextDrafts);
    setActiveDraftId(nextDrafts[0]?.id || "");
    setSaveConfirmation(null);
    setRecentIntakes((current) => [
      ...nextDrafts.map((draft) => ({
        id: `${draft.id}-recent`,
        source: draft.source,
        type: getSourceLabel(draft),
        date: getTodayLabel(),
        status: "Review Complete",
        confidence: draft.confidence,
        draftId: draft.id,
      })),
      ...current,
    ].slice(0, 5));
    setMessage(nextMessage);
    setAiStatus(status);
  };

  const buildDrafts = async (text, files = attachedFiles) => {
    setIsAnalyzingAi(true);
    setAiStatus("");
    let fallbackStatus = "Used local parser.";

    try {
      const response = await fetch("/api/analyze-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          files: files.map((file) => ({ name: file.name, type: file.type })),
          teams,
          claims,
          appSettings,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const nextDrafts = Array.isArray(result.drafts)
          ? result.drafts.map((draft, index) => ({
            id: `ai-${draft.type || "draft"}-${Date.now()}-${index}`,
            type: draft.type || "file",
            title: draft.title || "AI Draft",
            confidence: Number(draft.confidence || 70),
            summary: draft.summary || "AI extracted draft",
            source: sourceLabel,
            data: {
              ...(draft.data || {}),
              id: draft.type === "claim" ? draft.data?.id || getNextClaimId() : draft.data?.id,
              status: draft.type === "claim" ? draft.data?.status || "Under Review" : draft.data?.status,
              date: draft.type === "claim" ? draft.data?.date || getTodayLabel() : draft.data?.date,
              risk: draft.type === "claim" ? draft.data?.risk || getRiskLevel(draft.data?.amount) : draft.data?.risk,
              preventable: draft.type === "claim" ? draft.data?.preventable || "Maybe" : draft.data?.preventable,
              sourceType: draft.data?.sourceType || getDraftSourceType(draft),
              from: draft.data?.from || sourceEmail || "",
              notes: draft.data?.notes || text.slice(0, 500),
            },
            claimIntelligence: draft.claimIntelligence,
          }))
          : [];

        if (nextDrafts.length) {
          applyDraftResults(
            nextDrafts,
            result.message || `${nextDrafts.length} AI draft${nextDrafts.length === 1 ? "" : "s"} ready for review.`,
            "Analyzed by OpenAI."
          );
          setIsAnalyzingAi(false);
          return;
        }
      } else {
        const error = await response.json().catch(() => ({}));
        fallbackStatus = error.error || "AI unavailable, using local parser.";
        setAiStatus(fallbackStatus);
      }
    } catch {
      fallbackStatus = "AI unavailable, using local parser.";
      setAiStatus(fallbackStatus);
    }

    const normalized = text.toLowerCase();
    const nextDrafts = [];
    const amount = getAmount(text);
    const matchedDriver = driverOptions.find((driver) => normalized.includes(driver.name.toLowerCase()));
    const matchedRoute = driverOptions.find((driver) => driver.route && normalized.includes(driver.route.toLowerCase()));
    const hasHardClaimSignals = /chargeback|damage|deduction|scratch|dent|property|cargo|penalty|wall|floor|broken|reimbursement/i.test(text);
    const hasClaimWord = /\bclaims?\b/i.test(text);
    const routePay = getNumberAfter(text, ["route pay", "flat rate", "revenue", "pay"]);
    const stops = getNumberAfter(text, ["stops", "stop count"]);
    const miles = getNumberAfter(text, ["miles", "mileage"]);
    const fuelPrice = getNumberAfter(text, ["fuel price", "gas price"]);
    const helperPay = getNumberAfter(text, ["helper pay"]);
    const driverPay = getNumberAfter(text, ["driver pay"]);
    const hasRouteSignals =
      /route sheet|stop count|route pay|fuel price|gas price|driver pay|helper pay|mileage/i.test(text) ||
      [routePay, stops, miles, fuelPrice, helperPay, driverPay].filter(Boolean).length >= 2;
    const hasContractSignals = /contract|renewal|rate card|per stop|flat rate|schedule|terms|service area|install/i.test(text);
    const hasClaimSignals = hasHardClaimSignals || (!hasContractSignals && hasClaimWord) || (!hasRouteSignals && !hasContractSignals && /late|window|missing|refused|returned|reason/i.test(text));
    const hasReceiptSignals = /receipt|vendor|gas|fuel|maintenance|toll|parking|tools|amount/i.test(text) && !hasClaimSignals && !hasContractSignals;

    if (hasClaimSignals) {
      const type = findClaimType(text);
      const driver = matchedDriver || matchedRoute || driverOptions[0] || {};
      const risk = getRiskLevel(amount);
      nextDrafts.push({
        id: `ai-claim-${Date.now()}`,
        type: "claim",
        title: "Claim Draft",
        confidence: Math.min(95, 45 + [amount > 0, matchedDriver, matchedRoute, hasClaimSignals].filter(Boolean).length * 13),
        summary: `${type.type}${amount ? ` for ${currency.format(amount)}` : ""}`,
        source: sourceLabel,
        data: {
          id: getNextClaimId(),
          category: type.category,
          type: type.type,
          driver: driver.name || "",
          team: driver.team || "",
          route: driver.route || "",
          amount,
          status: "Under Review",
          preventable: normalized.includes("not preventable") ? "No" : "Maybe",
          date: getTodayLabel(),
          risk,
          notes: text.slice(0, 500),
          sourceType: "Email",
          from: sourceEmail || "",
          customer: driver.team || driver.route || "",
          reference: text.match(/\b(?:PO|REF|REFERENCE)[-\s#:]*([A-Z0-9-]+)/i)?.[1] || "",
        },
      });
    }

    if (hasRouteSignals) {
      nextDrafts.push({
        id: `ai-route-${Date.now()}`,
        type: "route",
        title: "Route Profit Draft",
        confidence: Math.min(92, 40 + [routePay, stops, miles, fuelPrice, helperPay, driverPay].filter(Boolean).length * 9),
        summary: `${routePay ? currency.format(routePay) : "Route"}${stops ? ` · ${stops} stops` : ""}${miles ? ` · ${miles} miles` : ""}`,
        source: sourceLabel,
        data: {
          routePay: routePay || undefined,
          stops: stops || undefined,
          miles: miles || undefined,
          fuelPrice: fuelPrice || undefined,
          helperPay: helperPay || undefined,
          driverPay: driverPay || undefined,
          notes: text.slice(0, 500),
          sourceType: "Route Sheet",
          from: sourceEmail || "",
          customer: matchedRoute?.route || "",
          reference: text.match(/\b(?:PO|REF|REFERENCE)[-\s#:]*([A-Z0-9-]+)/i)?.[1] || "",
          route: matchedRoute?.route || "",
          driver: matchedDriver?.name || "",
        },
      });
    }

    if (hasContractSignals) {
      const routePay = getNumberAfter(text, ["route pay", "flat rate"]);
      const perStop = getNumberAfter(text, ["per stop", "stop pay"]);
      const installPay = getNumberAfter(text, ["install", "installation"]);
      const customerMatch = text.match(/\b(Lowe'?s|Home Depot|Best Buy|RC Willey|Amazon|Costco|Wayfair)\b/i);
      nextDrafts.push({
        id: `ai-contract-${Date.now()}`,
        type: "contract",
        title: "Contract Terms Draft",
        confidence: Math.min(90, 42 + [routePay, perStop, installPay, customerMatch].filter(Boolean).length * 12),
        summary: `${customerMatch?.[0] || "New customer"} terms${routePay ? ` · ${currency.format(routePay)} route` : ""}`,
        source: sourceLabel,
        data: {
          customer: customerMatch?.[0] || "New customer",
          routePay,
          perStop,
          installPay,
          notes: text.slice(0, 500),
          sourceType: "Contract Terms",
          from: sourceEmail || "",
          reference: text.match(/\b(?:PO|REF|REFERENCE)[-\s#:]*([A-Z0-9-]+)/i)?.[1] || "",
          route: "",
          driver: matchedDriver?.name || "",
        },
      });
    }

    if (hasReceiptSignals) {
      const vendor = text.match(/vendor:\s*([^\n|]+)/i)?.[1]?.trim() || text.match(/\b(Shell|Home Depot|Lowe'?s|E-ZPass|Fleet Repair|AutoZone)\b/i)?.[0] || "Receipt vendor";
      const receiptType = text.match(/type:\s*([^\n|]+)/i)?.[1]?.trim() || (normalized.includes("toll") ? "Parking/Tolls" : normalized.includes("maintenance") ? "Maintenance" : normalized.includes("tool") ? "Tools" : "Gas");
      nextDrafts.push({
        id: `ai-receipt-${Date.now()}`,
        type: "receipt",
        title: "Receipt Draft",
        confidence: Math.min(90, 42 + [amount, vendor, receiptType].filter(Boolean).length * 14),
        summary: `${vendor}${amount ? ` · ${currency.format(amount)}` : ""} · ${receiptType}`,
        source: sourceLabel,
        data: {
          customer: vendor,
          route: matchedRoute?.route || text.match(/route:\s*([^\n|]+)/i)?.[1]?.trim() || "",
          amount,
          type: receiptType,
          notes: text.slice(0, 500),
          sourceType: "Receipt",
          from: sourceEmail || "",
          reference: text.match(/\b(?:PO|REF|REFERENCE)[-\s#:]*([A-Z0-9-]+)/i)?.[1] || "",
          driver: matchedDriver?.name || "",
        },
      });
    }

    if (files.some((file) => file.type.startsWith("image/") || file.type === "application/pdf")) {
      nextDrafts.push({
        id: `ai-file-${Date.now()}`,
        type: "file",
        title: "Screenshot / PDF Intake",
        confidence: 55,
        summary: `${files.length} file${files.length === 1 ? "" : "s"} ready for OCR review`,
        source: sourceLabel,
        data: {
          files: files.map((file) => file.name),
          notes: text.slice(0, 500),
          sourceType: "File",
          from: sourceEmail || "",
          customer: "",
          reference: "",
          route: "",
          driver: matchedDriver?.name || "",
        },
      });
    }

    applyDraftResults(
      nextDrafts,
      nextDrafts.length ? `${nextDrafts.length} draft${nextDrafts.length === 1 ? "" : "s"} ready for review.` : "I did not find enough detail yet. Paste the email, route sheet, or contract terms and try again.",
      fallbackStatus
    );
    setIsAnalyzingAi(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files || []);
    const plainText = event.dataTransfer.getData("text/plain");
    const fileText = files.length ? (await Promise.all(files.map(readFileAsText))).join("\n\n") : "";
    setAttachedFiles(files);
    setInputText([inputText, plainText, fileText].filter(Boolean).join("\n\n"));
  };

  const clearIntake = () => {
    setInputText("");
    setDrafts([]);
    setActiveDraftId("");
    setAttachedFiles([]);
    setMessage("");
    setSaveConfirmation(null);
  };

  const askForDraft = () => {
    setMessage("Paste or attach something, then click Analyze Intake first.");
  };

  const loadMockForm = (mockForm) => {
    setInputText(mockForm.text);
    setAttachedFiles([]);
    setDrafts([]);
    setActiveDraftId("");
    setSaveConfirmation(null);
    setMessage(`${mockForm.label} sample loaded. Click Analyze Intake to test it.`);
  };

  const updateActiveDraftData = (key, value) => {
    if (!activeDraft) return;
    setSaveConfirmation(null);
    setDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== activeDraft.id) return draft;

        const numericValue = key === "amount" || key === "routePay" || key === "stops" || key === "miles" ? Number(value || 0) : value;
        const nextData = {
          ...draft.data,
          [key]: numericValue,
        };

        if (draft.type === "claim" && key === "amount") {
          nextData.risk = getRiskLevel(numericValue);
        }

        return {
          ...draft,
          data: nextData,
          summary:
            key === "amount"
              ? `${draft.data.type || draft.title}${value ? ` for ${currency.format(Number(value || 0))}` : ""}`
              : draft.summary,
        };
      })
    );
  };

  const showSavedConfirmation = ({ title, detail, tab }) => {
    setSaveConfirmation({ title, detail, tab });
  };

  const applyDraft = (draft, destination = draft?.type) => {
    if (!draft) {
      askForDraft();
      return;
    }

    if (destination === "claim" && draft.type === "claim") {
      const claim = {
        ...draft.data,
        amount: Number(draft.data.amount || 0),
        team: draft.data.team || draft.data.customer || "",
        route: draft.data.route || draft.data.customer || "",
        status: "Under Review",
      };
      onAddClaim(claim);
      setRecentIntakes((current) =>
        current.map((item) =>
          item.draftId === draft.id
            ? {
                ...item,
                status: "Saved to Claims",
              }
            : item
        )
      );
      setMessage("Claim saved to Needs Review.");
      showSavedConfirmation({
        title: "Saved to Claims Review",
        detail: `${claim.id || "Claim"} is now waiting in the Needs Review lane.`,
        tab: "Claims",
      });
      return;
    }

    if (destination === "route" || destination === "profitability") {
      onApplyRoute(draft.data);
      setMessage("Route values filled into Profitability.");
      showSavedConfirmation({
        title: "Saved to Profitability",
        detail: "Route numbers were copied into the profitability calculator.",
        tab: "Profitability",
      });
      return;
    }

    if (destination === "contract" || draft.type === "contract") {
      localStorage.setItem("finalMileContractImportDraft", JSON.stringify(draft.data));
      setMessage("Contract terms saved as a draft note. Open Contracts to review.");
      showSavedConfirmation({
        title: "Saved to Contracts",
        detail: `${draft.data.customer || "Contract"} is ready to review in Contracts.`,
        tab: "Contracts",
      });
      return;
    }

    if (destination === "savedDay") {
      onSaveToDay?.(draft);
      setMessage("Intake is attached to today's workday notes.");
      showSavedConfirmation({
        title: "Saved to Today",
        detail: "This intake was attached to the current saved day snapshot.",
        tab: "Dashboard",
      });
      return;
    }

    setMessage("Screenshot/PDF queued. Full image OCR needs the AI backend connection next.");
  };

  const extractedRows = [
    ["Source Type", "sourceType", activeDraft?.data?.sourceType || getDraftSourceType(activeDraft), FileText, "text"],
    ["Date", "date", activeDraft?.data?.date || getTodayLabel(), ClipboardCheck, "text"],
    ["From", "from", activeDraft?.data?.from || sourceEmail || activeDraft?.source || "", FileText, "text"],
    ["Customer / Store", "customer", activeDraft?.data?.customer || activeDraft?.data?.team || activeDraft?.data?.route || "", Truck, "text"],
    ["PO / Reference #", "reference", activeDraft?.data?.reference || inputText.match(/\b(?:PO|REF|REFERENCE)[-\s#:]*([A-Z0-9-]+)/i)?.[1] || "", ShieldCheck, "text"],
    ["Route / Stop", "route", activeDraft?.data?.route || "", Truck, "text"],
    ["Issue Type", "type", activeDraft?.data?.type || activeDraft?.title || "", AlertTriangle, "text"],
    ["Claim Amount", activeDraft?.type === "route" ? "routePay" : "amount", activeDraft?.type === "route" ? activeDraft?.data?.routePay || "" : activeDraft?.data?.amount || "", DollarSign, "number"],
    ["Driver", "driver", activeDraft?.data?.driver || "", FileText, "text"],
  ];
  const isClaimDraft = activeDraft?.type === "claim";
  const claimIntelligence = useMemo(() => {
    if (!isClaimDraft || !activeDraft) return null;
    if (activeDraft.claimIntelligence) {
      return {
        disputeScore: Number(activeDraft.claimIntelligence.disputeScore || 60),
        missingEvidence: Array.isArray(activeDraft.claimIntelligence.missingEvidence) ? activeDraft.claimIntelligence.missingEvidence : [],
        recommendation: activeDraft.claimIntelligence.recommendation || "Review the claim packet before saving.",
        nextAction: activeDraft.claimIntelligence.nextAction || "Confirm evidence and assign an owner.",
      };
    }

    const notes = `${activeDraft.data?.notes || ""} ${inputText || ""}`.toLowerCase();
    const amount = Number(activeDraft.data?.amount || 0);
    const evidenceChecks = [
      ["Photos", /photo|picture|image|screenshot/.test(notes)],
      ["POD", /pod|proof of delivery|signed|signature/.test(notes)],
      ["Driver notes", /driver|team|statement|notes/.test(notes)],
      ["Reference", Boolean(activeDraft.data?.reference)],
    ];
    const missingEvidence = evidenceChecks.filter(([, present]) => !present).map(([label]) => label);
    const disputeScore = Math.max(
      25,
      Math.min(
        96,
        38 +
          (amount >= riskThresholds.high ? 18 : amount >= riskThresholds.medium ? 10 : 4) +
          evidenceChecks.filter(([, present]) => present).length * 9 +
          (activeDraft.data?.preventable === "No" ? 14 : activeDraft.data?.preventable === "Maybe" ? 6 : 0)
      )
    );

    return {
      disputeScore,
      missingEvidence,
      recommendation:
        disputeScore >= 75
          ? "Strong dispute candidate if the packet is complete."
          : disputeScore >= 55
            ? "Review before accepting. Add missing proof first."
            : "Weak dispute packet right now. Build evidence before sending.",
      nextAction:
        missingEvidence.length > 0
          ? `Collect ${missingEvidence.slice(0, 2).join(" and ")} before dispute.`
          : "Generate the dispute packet and assign an owner.",
    };
  }, [activeDraft, inputText, isClaimDraft, riskThresholds.high, riskThresholds.medium]);

  if (!standalone && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mb-5 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
      >
        AI Quick Intake
      </button>
    );
  }

  const sourceChips = [
    ["Email", FileText],
    ["Screenshot", Camera],
    ["PDF", FileText],
    ["Route Sheet", BarChart3],
    ["Contract Terms", ClipboardCheck],
    ["Notes", FileText],
  ];

  const nextSteps = [
    ["Save to Claim", "Create or update a claim", AlertTriangle, "claim", "text-red-500"],
    ["Save to Contract", "Link or update contract details", FileText, "contract", "text-blue-500"],
    ["Save to Profitability", "Add to revenue or expense", BarChart3, "profitability", "text-emerald-500"],
    ["Save to Saved Day", "Add to today's operational records", ClipboardCheck, "savedDay", "text-amber-500"],
  ];

  return (
    <div className="space-y-5">
      {standalone && (
        <div data-tour="intake-header">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Intake</span>
            {isDemoMode && (
              <span className={isDark ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200" : "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"}>
                Demo examples available
              </span>
            )}
            <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
              Email, screenshot, PDF, route sheet, or contract terms
            </span>
          </div>
          <h1 className={`text-4xl font-black tracking-tight sm:text-5xl ${titleText}`}>Intake</h1>
          <p className={`mt-2 max-w-3xl text-base font-semibold ${mutedText}`}>
            {isDemoMode ? "Process the demo claim email, receipt, contract, or route sheet examples to see how Intake turns messy input into clean drafts." : "Capture it once. We'll pull out what matters."}
          </p>
        </div>
      )}

      {standalone && (
        <section data-tour="intake-examples" className={isDark ? "rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3" : "rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"}>
          <p className={`text-xs font-bold leading-5 ${mutedText}`}>
            <span className={`font-black ${titleText}`}>Handles</span> claim emails · route sheets · contract terms · receipts · notes. AI drafts entries first — nothing saves until you choose where it goes.
          </p>
        </section>
      )}

      {!standalone && (
        <div className={`${cardClass} mb-5`}>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">AI Quick Intake</span>
                <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
                  Drop email, route sheet, contract terms, screenshot, or notes
                </span>
              </div>
              <h2 className={`text-xl font-bold ${titleText}`}>Put it in once. Let the system sort it.</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>AI drafts entries first, then you choose what gets saved.</p>
            </div>
            <button onClick={() => setIsOpen(false)} className={isDark ? "self-start rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15 lg:self-auto" : "self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 lg:self-auto"}>
              Hide
            </button>
          </div>
        </div>
      )}

      <div
        data-tour="intake-drop-zone"
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={dropClass}
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className={isDark ? "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300" : "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"}>
            <Upload className="h-7 w-7" />
          </div>
          <h2 className={`text-xl font-bold ${titleText}`}>Drop a claim email, file, or notes here</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>The fastest path is claim intake: paste it, review the draft, then save it to Needs Review.</p>

          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            className={isDark ? "mt-5 h-24 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500" : "mt-5 h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500"}
            placeholder="Paste an email, route sheet, contract terms, or delivery notes here..."
          />

          <div className={isDark ? "mt-3 flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-3" : "mt-3 flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3"}>
            <span className={`mr-1 text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Mock forms</span>
            {intakeMockForms.map((mockForm) => (
              <button
                key={mockForm.id}
                type="button"
                onClick={() => loadMockForm(mockForm)}
                className={isDark ? "rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-slate-200 hover:bg-white/15" : "rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200"}
                title={`Load ${mockForm.type} sample`}
              >
                {mockForm.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => buildDrafts(inputText)}
              disabled={isAnalyzingAi}
              className={isAnalyzingAi ? "rounded-xl bg-blue-400 px-5 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20" : "rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"}
            >
              {isAnalyzingAi ? "Analyzing..." : "Analyze Intake"}
            </button>
            <label className={isDark ? "cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}>
              <Upload className="mr-2 inline h-4 w-4" />
              <span>Attach Files</span>
              <input
                type="file"
                multiple
                accept=".txt,.eml,.csv,.pdf,image/*"
                className="hidden"
                onChange={async (event) => {
                  const files = Array.from(event.target.files || []);
                  const fileText = files.length ? (await Promise.all(files.map(readFileAsText))).join("\n\n") : "";
                  setAttachedFiles(files);
                  setInputText((current) => [current, fileText].filter(Boolean).join("\n\n"));
                }}
              />
            </label>
            <button onClick={clearIntake} className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}>
              Clear
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {sourceChips.map(([label, Icon]) => (
              <span key={label} className={isDark ? "inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-300" : "inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm"}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>

          {attachedFiles.length > 0 && (
            <p className={`mt-3 text-xs font-bold ${mutedText}`}>{attachedFiles.map((file) => file.name).join(", ")}</p>
          )}
          {message && <p className={`mt-3 text-sm font-black ${message.includes("not") || message.includes("first") ? "text-amber-600" : "text-emerald-600"}`}>{message}</p>}
          {aiStatus && <p className={`mt-2 text-xs font-bold ${mutedText}`}>{aiStatus}</p>}
        </div>
      </div>

      {isAnalyzingAi && (
        <div className={cardClass}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <ClipboardCheck className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <p className={`text-sm font-black ${titleText}`}>Analyzing your intake…</p>
              <p className={`mt-0.5 text-xs font-bold ${mutedText}`}>Extracting fields, amounts, and claim signals.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <div data-tour="intake-review-draft" className={cardClass}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-lg font-bold ${titleText}`}>{isClaimDraft ? "Review Claim Draft" : "Extracted Information"}</h2>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">
                  {isClaimDraft ? "Claim Ready" : "AI Review Complete"}
                </span>
              </div>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {isClaimDraft
                  ? "Confirm the driver, amount, type, and notes before sending it to Claims."
                  : "Review and edit anything that looks off."}
              </p>
            </div>
            {activeDraft && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-xs font-bold ${mutedText}`}>Confidence Score</p>
                  <p className={`text-2xl font-black ${titleText}`}>{activeDraft.confidence || 0}%</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-emerald-500/80 text-sm font-black text-emerald-600">
                  {activeDraft.confidence || 0}%
                </div>
              </div>
            )}
          </div>

          {!activeDraft ? (
            <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 text-center ${mutedText} ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <p className={`text-base font-black ${titleText}`}>Drop a document to analyze it</p>
              <p className={`max-w-xs text-sm ${mutedText}`}>Paste text, upload a file, or pick a sample above — AI will extract the key fields and confidence score.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {extractedRows.map(([label, key, value, Icon, type]) => (
                <label key={label} className="block">
                  <span className={`mb-1 block text-xs font-black ${mutedText}`}>{label}</span>
                  <div className="relative">
                    <Icon className={`absolute left-3 top-3 h-4 w-4 ${mutedText}`} />
                    <input
                      type={type}
                      value={value}
                      onChange={(event) => updateActiveDraftData(key, event.target.value)}
                      className={`${inputClass} pl-9`}
                      placeholder="Review"
                    />
                    <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-600" />
                  </div>
                </label>
              ))}
            </div>
          )}

          <label className="mt-4 block">
            <span className={`mb-1 block text-xs font-black ${mutedText}`}>Notes / Summary</span>
            <textarea
              value={activeDraft?.data?.notes || inputText || ""}
              onChange={(event) => updateActiveDraftData("notes", event.target.value)}
              className={`${inputClass} min-h-28 resize-none leading-6`}
              placeholder="A summary will appear here after intake is analyzed."
            />
          </label>

          {isClaimDraft && (
            <div className={isDark ? "mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4" : "mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={isDark ? "text-sm font-black text-amber-200" : "text-sm font-black text-amber-800"}>This will go to Claims under Needs Review</p>
                  <p className={`mt-1 text-xs font-semibold ${mutedText}`}>
                    It will not be marked approved or resolved. You can drag it later to In Progress or Resolved.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-white" : "rounded-full bg-white px-3 py-1 text-slate-700"}>{activeDraft.data.risk || "Low"} Risk</span>
                  <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-white" : "rounded-full bg-white px-3 py-1 text-slate-700"}>
                    {currency.format(Number(activeDraft.data.amount || 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {claimIntelligence && (
            <div className={isDark ? "mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4" : "mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className={isDark ? "text-sm font-black text-blue-100" : "text-sm font-black text-blue-800"}>AI Claim Intelligence</p>
                  <p className={`mt-2 text-sm leading-6 ${mutedText}`}>{claimIntelligence.recommendation}</p>
                  <p className={`mt-2 text-sm font-black ${titleText}`}>{claimIntelligence.nextAction}</p>
                </div>
                <div className={isDark ? "rounded-2xl bg-slate-950/60 p-4 text-center" : "rounded-2xl bg-white p-4 text-center shadow-sm"}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Dispute Score</p>
                  <p className="mt-1 text-3xl font-black text-blue-600">{claimIntelligence.disputeScore}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(claimIntelligence.missingEvidence.length ? claimIntelligence.missingEvidence : ["Packet looks complete"]).map((item) => (
                  <span key={item} className={claimIntelligence.missingEvidence.length ? "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700" : "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700"}>
                    {claimIntelligence.missingEvidence.length ? `Missing ${item}` : item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={`mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/10" : "border-slate-200"}`}>
            <p className={`text-xs font-semibold ${mutedText}`}>AI suggestions. Always review for accuracy.</p>
            <button onClick={clearIntake} className="text-left text-xs font-black text-blue-600 sm:text-right">
              Not correct? Clear and start over
            </button>
          </div>
        </div>

        <div data-tour="intake-next-step" className={cardClass}>
          <h2 className={`text-lg font-bold ${titleText}`}>Next Step</h2>
          <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
            {isClaimDraft ? "Save the draft when the claim details look right." : "Choose where you want to send this intake after review."}
          </p>

          {saveConfirmation && (
            <div className={isDark ? "mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4" : "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-emerald-700">{saveConfirmation.title}</p>
                  <p className={`mt-1 text-sm ${mutedText}`}>{saveConfirmation.detail}</p>
                  <button
                    onClick={() => navigateToTab(saveConfirmation.tab)}
                    className="mt-3 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500"
                  >
                    Open {saveConfirmation.tab}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isClaimDraft && !saveConfirmation && (
            <button
              onClick={() => applyDraft(activeDraft, "claim")}
              className={isDark ? "mt-4 w-full rounded-2xl border border-blue-500/40 bg-blue-600 p-4 text-left text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500" : "mt-4 w-full rounded-2xl bg-blue-600 p-4 text-left text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"}
            >
              <span className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black">Save to Claims Review</span>
                  <span className="mt-1 block text-sm font-semibold text-blue-100">
                    Adds {activeDraft.data.id || "this claim"} to the Needs Review lane.
                  </span>
                </span>
              </span>
            </button>
          )}

          <div className="mt-4 space-y-2">
            {(isClaimDraft ? nextSteps.filter(([, , , destination]) => destination !== "claim") : nextSteps).map(([title, subtitle, Icon, destination, tone]) => (
              <button
                key={title}
                onClick={() => applyDraft(activeDraft, destination)}
                className={isDark ? "flex w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-left transition hover:border-blue-500/50 hover:bg-white/5" : "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50"}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current/10 ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-black ${tone}`}>{title}</span>
                  <span className={`block text-xs font-semibold ${mutedText}`}>{subtitle}</span>
                </span>
                <span className={mutedText}>›</span>
              </button>
            ))}
          </div>

          <div className={`mt-5 border-t pt-4 ${isDark ? "border-white/10" : "border-slate-200"}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`font-black ${titleText}`}>Drafts ({drafts.length})</h3>
              <button onClick={() => setActiveDraftId(drafts[0]?.id || "")} className="text-xs font-black text-blue-600">
                View all drafts
              </button>
            </div>

            {drafts.length === 0 ? (
              <p className={`rounded-xl py-6 text-center text-sm font-semibold ${mutedText}`}>You do not have any drafts yet.</p>
            ) : (
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    onClick={() => setActiveDraftId(draft.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                      activeDraft?.id === draft.id
                        ? "bg-blue-600 text-white"
                        : isDark
                          ? "bg-white/5 text-slate-300 hover:bg-white/10"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span className="block font-black">{draft.title}</span>
                    <span className="block text-xs opacity-80">{draft.summary}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div data-tour="intake-recent" className={cardClass}>
          <h2 className={`text-lg font-bold ${titleText}`}>Recent Intakes</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className={isDark ? "border-b border-white/10 text-slate-400" : "border-b border-slate-200 text-slate-500"}>
                <tr className="text-xs uppercase tracking-wide">
                  <th className="py-3">Source</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Confidence</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentIntakes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={`py-8 text-center ${mutedText}`}>Recent analyzed intakes will appear here.</td>
                  </tr>
                ) : (
                  recentIntakes.map((item) => (
                    <tr key={item.id} className={isDark ? "border-b border-white/10" : "border-b border-slate-200"}>
                      <td className={`py-3 font-bold ${titleText}`}>{item.source}</td>
                      <td className={`py-3 ${mutedText}`}>{item.type}</td>
                      <td className={`py-3 ${mutedText}`}>{item.date}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">{item.status}</span>
                      </td>
                      <td className={`py-3 font-black ${titleText}`}>{item.confidence}%</td>
                      <td className="py-3">
                        <button onClick={() => setActiveDraftId(item.draftId)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-500">
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={softCard}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">?</span>
            <div className="min-w-0 flex-1">
              <h2 className={`font-black ${titleText}`}>Need help?</h2>
              <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                Drop your file, check the extracted details, and send it where it belongs.
              </p>
              <button
                onClick={() => setShowHelp((current) => !current)}
                className="mt-3 text-left text-sm font-black text-blue-600 hover:text-blue-500"
              >
                {showHelp ? "Hide Intake help" : "Learn more about Intake"}
              </button>
            </div>
          </div>

          {showHelp && (
            <div className={isDark ? "mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4" : "mt-5 rounded-2xl border border-slate-200 bg-white p-4"}>
              <h3 className={`text-sm font-black ${titleText}`}>What Intake Does</h3>
              <div className={`mt-3 space-y-3 text-sm leading-6 ${mutedText}`}>
                <p>
                  Intake is the fast entry point. Paste an email, route sheet, contract terms, notes, or attach a file, then click Analyze Intake.
                </p>
                <p>
                  The app reads what it can find and turns it into a draft. You can edit the extracted fields before saving, so bad guesses do not go into your records.
                </p>
                <p>
                  Save to Claim sends a claim to the Claims review board. Save to Contract creates a contract draft. Save to Profitability fills route numbers. Save to Saved Day attaches the note to today's snapshot.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiQuickIntake;
