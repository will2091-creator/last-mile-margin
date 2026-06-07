import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  claimTypeOptions,
  currency,
  DollarSign,
  FileText,
  Truck,
} from "../shared";
import EmptyState from "../components/EmptyState";

function ClaimsDashboard({ claims, setClaims, teams, isDark, appSettings, backendStatus, navigateToTab }) {
  const unassignedDriverLabel = "Unassigned";
  const driverOptions = teams
    .map((team) => ({
      name: team.lead,
      team: team.name,
      route: team.route,
    }))
    .filter((driver) => driver.name);
  const getClaimDriver = (claim) => {
    if (claim.driver) return claim.driver;
    const matchingTeam = teams.find((team) => team.name === claim.team);
    return matchingTeam?.lead || unassignedDriverLabel;
  };
  const getDriverTeam = (driverName) => {
    if (!driverName || driverName === unassignedDriverLabel) return "Unassigned";
    return driverOptions.find((driver) => driver.name === driverName)?.team || "Unassigned";
  };
  const getDriverRoute = (driverName) => driverOptions.find((driver) => driver.name === driverName)?.route || "";

  const blankClaim = {
    id: "",
    category: "Property",
    type: claimTypeOptions.Property[0],
    driver: driverOptions[0]?.name || unassignedDriverLabel,
    team: driverOptions[0]?.team || "Unassigned",
    route: "",
    amount: "",
    status: "Open",
    preventable: "Yes",
    date: "Today",
    risk: "Medium",
  };

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [claimEmailText, setClaimEmailText] = useState("");
  const [isEmailDragging, setIsEmailDragging] = useState(false);
  const [importDraft, setImportDraft] = useState(null);
  const [importConfidence, setImportConfidence] = useState(0);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [claimReviewQueue, setClaimReviewQueue] = useState(() => {
    try {
      const savedQueue = localStorage.getItem("finalMileClaimReviewQueue");
      return savedQueue ? JSON.parse(savedQueue) : [];
    } catch {
      return [];
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [claimForm, setClaimForm] = useState(blankClaim);
  const [claimFilters, setClaimFilters] = useState({
    team: "All",
    driver: "All",
    claimType: "All",
    preventable: "All",
    status: "All",
    risk: "All",
  });
  const [draggedClaim, setDraggedClaim] = useState(null);
  const [reviewClaim, setReviewClaim] = useState(null);
  const [disputePacketClaim, setDisputePacketClaim] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showClaimLog, setShowClaimLog] = useState(false);
  const claimActionPanelRef = useRef(null);
  const riskThresholds = {
    medium: Number(appSettings?.claimRiskThresholds?.medium ?? 200),
    high: Number(appSettings?.claimRiskThresholds?.high ?? 500),
  };

  const scrollToClaimActionPanel = () => {
    window.requestAnimationFrame(() => {
      claimActionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    localStorage.setItem("finalMileClaimReviewQueue", JSON.stringify(claimReviewQueue));
  }, [claimReviewQueue]);

  useEffect(() => {
    if (showImport || showForm) {
      scrollToClaimActionPanel();
    }
  }, [showImport, showForm]);

  const allClaimTypes = useMemo(
    () =>
      Array.from(new Set([...Object.values(claimTypeOptions).flat(), ...claims.map((claim) => claim.type).filter(Boolean)])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [claims]
  );
  const teamFilterOptions = useMemo(
    () => Array.from(new Set([...teams.map((team) => team.name), ...claims.map((claim) => claim.team).filter(Boolean)])).sort(),
    [claims, teams]
  );
  const driverFilterOptions = useMemo(
    () => Array.from(new Set([...driverOptions.map((driver) => driver.name), ...claims.map((claim) => getClaimDriver(claim)).filter(Boolean)])).sort(),
    [claims, driverOptions]
  );
  const updateClaimFilter = (field, value) => setClaimFilters((current) => ({ ...current, [field]: value }));
  const resetClaimFilters = () =>
    setClaimFilters({
      team: "All",
      driver: "All",
      claimType: "All",
      preventable: "All",
      status: "All",
      risk: "All",
    });
  const claimMatchesFilters = (claim) => {
    const driver = getClaimDriver(claim);
    const team = claim.team || getDriverTeam(driver) || "Unassigned";

    return (
      (claimFilters.team === "All" || team === claimFilters.team) &&
      (claimFilters.driver === "All" || driver === claimFilters.driver) &&
      (claimFilters.claimType === "All" || claim.type === claimFilters.claimType) &&
      (claimFilters.preventable === "All" || claim.preventable === claimFilters.preventable) &&
      (claimFilters.status === "All" || claim.status === claimFilters.status) &&
      (claimFilters.risk === "All" || claim.risk === claimFilters.risk)
    );
  };
  const filteredClaims = claims.filter(claimMatchesFilters);
  const filteredClaimReviewQueue = claimReviewQueue.filter((item) => claimMatchesFilters(item.claim));
  const totalExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const openClaims = filteredClaims.filter((claim) => claim.status !== "Closed").length;
  const penaltyTotal = filteredClaims
    .filter((claim) => claim.category === "Penalty")
    .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const propertyTotal = filteredClaims
    .filter((claim) => claim.category === "Property")
    .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const cargoTotal = filteredClaims
    .filter((claim) => claim.category === "Cargo")
    .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const filteredExposure = filteredClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const openClaimExposure = filteredClaims
    .filter((claim) => claim.status !== "Closed")
    .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const profitLostPerStop = filteredExposure / 1038;

  const pageClass = isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const tableBorder = isDark ? "border-white/10" : "border-slate-200";
  const rowBorder = isDark ? "border-white/5" : "border-slate-100";
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500";

  const updateClaimField = (field, value) => setClaimForm((current) => ({ ...current, [field]: value }));
  const updateImportDraft = (field, value) => setImportDraft((current) => ({ ...current, [field]: value }));

  const plainTextFromHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const readDroppedFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });

  const handleEmailDrop = async (event) => {
    event.preventDefault();
    setIsEmailDragging(false);

    const files = Array.from(event.dataTransfer.files || []);
    if (files.length > 0) {
      try {
        const fileTexts = await Promise.all(files.map(readDroppedFile));
        setClaimEmailText(fileTexts.join("\n\n"));
      } catch {
        alert("That file could not be read. Try saving it as .eml or .txt, then drop it again.");
      }
      return;
    }

    const plainText = event.dataTransfer.getData("text/plain");
    const htmlText = event.dataTransfer.getData("text/html");
    const uriText = event.dataTransfer.getData("text/uri-list");
    const droppedText = plainText || plainTextFromHtml(htmlText) || uriText;

    if (droppedText) {
      setClaimEmailText(droppedText.trim());
      return;
    }

    alert("I could not read that drop. Try opening the email, selecting the body text, and dragging it here.");
  };

  const getNextClaimId = () => {
    const queueClaims = claimReviewQueue.map((item) => item.claim);
    const highestId = [...claims, ...queueClaims].reduce((highest, claim) => {
      const numericId = Number(String(claim?.id || "").replace(/\D/g, ""));
      return Number.isFinite(numericId) ? Math.max(highest, numericId) : highest;
    }, 1000);

    return `CLM-${highestId + 1}`;
  };

  const findClaimTypeFromEmail = (emailText) => {
    const normalized = emailText.toLowerCase();

    for (const [category, options] of Object.entries(claimTypeOptions)) {
      const match = options.find((option) => normalized.includes(option.toLowerCase()));
      if (match) return { category, type: match };
    }

    if (normalized.includes("wall")) return { category: "Property", type: "Wall damage" };
    if (normalized.includes("floor")) return { category: "Property", type: "Floor scratch" };
    if (normalized.includes("door")) return { category: "Property", type: "Door frame damage" };
    if (normalized.includes("scratch") || normalized.includes("dent")) return { category: "Cargo", type: "Appliance dent / scratch" };
    if (normalized.includes("late") || normalized.includes("window")) return { category: "Penalty", type: "Missed delivery window" };
    if (normalized.includes("photo")) return { category: "Penalty", type: "Failed photo compliance" };
    if (normalized.includes("paperwork")) return { category: "Penalty", type: "Incomplete paperwork" };

    return { category: "Property", type: claimTypeOptions.Property[0] };
  };

  const extractClaimFromEmail = () => {
    const text = claimEmailText.trim();
    if (!text) {
      alert("Paste the claim email first.");
      return;
    }

    const normalized = text.toLowerCase();
    const typeMatch = findClaimTypeFromEmail(text);
    const dollarMatch = text.match(/\$\s*([0-9][0-9,]*(?:\.\d{2})?)/);
    const amountLabelMatch = text.match(/(?:amount|claim|chargeback|deduction|total|exposure)\D{0,20}([0-9][0-9,]*(?:\.\d{2})?)/i);
    const amount = Number((dollarMatch?.[1] || amountLabelMatch?.[1] || "0").replace(/,/g, ""));
    const matchedDriver = driverOptions.find((driver) => normalized.includes(driver.name.toLowerCase()));
    const matchedRoute = driverOptions.find((driver) => driver.route && normalized.includes(driver.route.toLowerCase()));
    const dateMatch = text.match(/\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b/);
    const preventable = normalized.includes("not preventable") || normalized.includes("non-preventable") ? "No" : "Maybe";
    const risk = amount >= riskThresholds.high ? "High" : amount >= riskThresholds.medium ? "Medium" : "Low";
    const driver = matchedDriver?.name || matchedRoute?.name || driverOptions[0]?.name || unassignedDriverLabel;
    const confidenceSignals = [
      Boolean(typeMatch.type),
      amount > 0,
      Boolean(matchedDriver),
      Boolean(matchedRoute),
      Boolean(dateMatch || normalized.includes("today") || normalized.includes("yesterday")),
    ].filter(Boolean).length;

    setImportDraft({
      id: getNextClaimId(),
      category: typeMatch.category,
      type: typeMatch.type,
      driver,
      team: getDriverTeam(driver),
      route: matchedRoute?.route || getDriverRoute(driver),
      amount,
      status: "Under Review",
      preventable,
      date: dateMatch?.[0] || (normalized.includes("yesterday") ? "Yesterday" : "Today"),
      risk,
    });
    setImportConfidence(Math.round((confidenceSignals / 5) * 100));
  };

  const approveImportedClaim = () => {
    if (!importDraft?.id || !importDraft?.type) {
      alert("Claim ID and Type are required before saving.");
      return;
    }

    const assignedDriver = importDraft.driver || unassignedDriverLabel;
    const cleanedClaim = {
      ...importDraft,
      driver: assignedDriver,
      team: getDriverTeam(assignedDriver),
      route: importDraft.route || getDriverRoute(assignedDriver),
      amount: Number(importDraft.amount || 0),
    };

    setClaims((current) => [cleanedClaim, ...current]);
    if (activeReviewId) {
      setClaimReviewQueue((current) => current.filter((item) => item.id !== activeReviewId));
    }
    setImportDraft(null);
    setClaimEmailText("");
    setImportConfidence(0);
    setActiveReviewId(null);
    setShowImport(false);
  };

  const queueImportedClaim = () => {
    if (!importDraft?.id || !importDraft?.type) {
      alert("Claim ID and Type are required before adding to review.");
      return;
    }

    const assignedDriver = importDraft.driver || unassignedDriverLabel;
    const reviewItem = {
      id: activeReviewId || `EMAIL-${importDraft.id}`,
      receivedAt: new Date().toLocaleString(),
      confidence: importConfidence,
      sourceText: claimEmailText,
      claim: {
        ...importDraft,
        driver: assignedDriver,
        team: getDriverTeam(assignedDriver),
        route: importDraft.route || getDriverRoute(assignedDriver),
        amount: Number(importDraft.amount || 0),
      },
    };

    setClaimReviewQueue((current) => {
      if (activeReviewId) {
        return current.map((item) => (item.id === activeReviewId ? reviewItem : item));
      }

      return [reviewItem, ...current];
    });
    setImportDraft(null);
    setClaimEmailText("");
    setImportConfidence(0);
    setActiveReviewId(null);
    setShowImport(false);
  };

  const reviewQueuedClaim = (item) => {
    setImportDraft(item.claim);
    setImportConfidence(item.confidence);
    setClaimEmailText(item.sourceText || "");
    setActiveReviewId(item.id);
    setShowImport(true);
    setShowForm(false);
  };

  const openClaimReview = (claim, source = "claim", extras = {}) => {
    setReviewClaim({ claim, source, ...extras });
    setShowForm(false);
    setShowImport(false);
  };

  const approveQueuedClaim = (item) => {
    const assignedDriver = item.claim.driver || unassignedDriverLabel;
    const cleanedClaim = {
      ...item.claim,
      driver: assignedDriver,
      team: getDriverTeam(assignedDriver),
      route: item.claim.route || getDriverRoute(assignedDriver),
      amount: Number(item.claim.amount || 0),
    };

    setClaims((current) => [cleanedClaim, ...current]);
    setClaimReviewQueue((current) => current.filter((queueItem) => queueItem.id !== item.id));
  };

  const approveQueuedClaimWithStatus = (item, status) => {
    const assignedDriver = item.claim.driver || unassignedDriverLabel;
    const cleanedClaim = {
      ...item.claim,
      status,
      driver: assignedDriver,
      team: getDriverTeam(assignedDriver),
      route: item.claim.route || getDriverRoute(assignedDriver),
      amount: Number(item.claim.amount || 0),
    };

    setClaims((current) => [cleanedClaim, ...current]);
    setClaimReviewQueue((current) => current.filter((queueItem) => queueItem.id !== item.id));
  };

  const ignoreQueuedClaim = (id) => {
    const item = claimReviewQueue.find((queueItem) => queueItem.id === id);
    setConfirmAction({
      title: "Ignore imported claim?",
      message: `${item?.claim?.id || "This imported claim"} will be removed from review.`,
      confirmLabel: "Ignore Claim",
      tone: "red",
      onConfirm: () => {
        setClaimReviewQueue((current) => current.filter((queueItem) => queueItem.id !== id));
      },
    });
  };

  const openAddForm = () => {
    setEditingId(null);
    setShowImport(false);
    setActiveReviewId(null);
    setReviewClaim(null);
    setClaimForm({
      ...blankClaim,
      id: getNextClaimId(),
      driver: driverOptions[0]?.name || unassignedDriverLabel,
      team: driverOptions[0]?.team || "Unassigned",
      route: driverOptions[0]?.route || "",
      type: claimTypeOptions.Property[0],
    });
    setShowForm(true);
    scrollToClaimActionPanel();
  };

  const openEditForm = (claim) => {
    setEditingId(claim.id);
    setReviewClaim(null);
    const driver = getClaimDriver(claim);
    setClaimForm({
      ...claim,
      driver,
      team: getDriverTeam(driver),
      route: claim.route || getDriverRoute(driver),
    });
    setShowForm(true);
  };

  const saveClaim = () => {
    if (!claimForm.id || !claimForm.type) {
      alert("Claim ID and Type are required.");
      return;
    }

    const assignedDriver = claimForm.driver || unassignedDriverLabel;
    const cleanedClaim = {
      ...claimForm,
      driver: assignedDriver,
      team: getDriverTeam(assignedDriver),
      route: claimForm.route || getDriverRoute(assignedDriver),
      amount: Number(claimForm.amount || 0),
    };

    if (editingId) {
      setClaims((current) => current.map((claim) => (claim.id === editingId ? cleanedClaim : claim)));
    } else {
      setClaims((current) => [cleanedClaim, ...current]);
    }

    setClaimForm(blankClaim);
    setEditingId(null);
    setShowForm(false);
  };

  const updateClaimStatus = (claimId, status) => {
    setClaims((current) => current.map((claim) => (claim.id === claimId ? { ...claim, status } : claim)));
    setReviewClaim((current) => {
      if (!current || current.source !== "claim" || current.claim.id !== claimId) return current;
      return { ...current, claim: { ...current.claim, status } };
    });
  };

  const statusForBucket = (bucketTitle) => {
    if (bucketTitle === "Needs Review") return "Under Review";
    if (bucketTitle === "Resolved") return "Closed";
    return "Open";
  };

  const handleClaimDrop = (event, bucketTitle) => {
    event.preventDefault();
    if (!draggedClaim) return;

    const nextStatus = statusForBucket(bucketTitle);
    if (draggedClaim.source === "queue") {
      if (nextStatus !== "Under Review") {
        approveQueuedClaimWithStatus(draggedClaim, nextStatus);
      }
    } else {
      updateClaimStatus(draggedClaim.claim.id, nextStatus);
    }

    setDraggedClaim(null);
  };

  const deleteClaim = (id) => {
    const claim = claims.find((item) => item.id === id);
    setConfirmAction({
      title: "Delete claim?",
      message: `${claim?.id || "This claim"} will be permanently removed from the claims log.`,
      confirmLabel: "Delete Claim",
      tone: "red",
      onConfirm: () => {
        setClaims((current) => current.filter((claim) => claim.id !== id));
      },
    });
  };

  const categoryMeta = {
    Property: {
      label: "Property",
      text: "text-red-700",
      bg: isDark ? "bg-red-500/10" : "bg-red-50",
      border: isDark ? "border-red-500/20" : "border-red-100",
      iconBg: isDark ? "bg-red-500/10" : "bg-red-50",
      value: "text-red-600",
      description: "Customer home damage",
    },
    Cargo: {
      label: "Cargo",
      text: isDark ? "text-blue-300" : "text-slate-700",
      bg: isDark ? "bg-blue-500/10" : "bg-slate-100",
      border: isDark ? "border-blue-500/20" : "border-slate-200",
      iconBg: isDark ? "bg-blue-500/10" : "bg-slate-100",
      value: isDark ? "text-blue-300" : "text-slate-700",
      description: "Product damage or missing items",
    },
    Penalty: {
      label: "Penalty",
      text: "text-amber-700",
      bg: isDark ? "bg-amber-500/10" : "bg-amber-50",
      border: isDark ? "border-amber-500/20" : "border-amber-100",
      iconBg: isDark ? "bg-amber-500/10" : "bg-amber-50",
      value: "text-amber-700",
      description: "Retailer deductions and chargebacks",
    },
  };

  const getCategoryClass = (category) => {
    const meta = categoryMeta[category] || categoryMeta.Property;
    return `${meta.bg} ${meta.text}`;
  };

  const getRiskClass = (risk) => {
    if (risk === "Low") return isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700";
    if (risk === "Medium") return isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700";
    return isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700";
  };

  const getStatusClass = (status) => {
    if (status === "Closed") return isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700";
    if (status === "Under Review") return isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700";
    return isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700";
  };

  const getClaimTeam = (claim) => claim.team || getDriverTeam(getClaimDriver(claim)) || "Unassigned";
  const getClaimTeamRecord = (claim) => teams.find((team) => team.name === getClaimTeam(claim));
  const getEvidenceChecklist = (claim) => {
    const assignedTeam = getClaimTeamRecord(claim);
    const hasRouteDetails = Boolean(claim.route && claim.date);
    const hasDailyPhoto = assignedTeam?.photoStatus === "Uploaded";
    const isResolved = claim.status === "Closed";
    const isHighRisk = claim.risk === "High" || Number(claim.amount || 0) >= riskThresholds.high;

    return [
      { label: "Retailer claim notice", present: true },
      { label: "Route and delivery date matched", present: hasRouteDetails },
      { label: "Driver statement collected", present: isResolved || claim.preventable === "No" },
      { label: "Daily route photo uploaded", present: hasDailyPhoto },
      { label: "Damage photos attached", present: isResolved || !isHighRisk },
      { label: "Proof of delivery / customer sign-off", present: claim.category !== "Penalty" ? isResolved : Boolean(claim.route) },
    ];
  };
  const getMissingEvidence = (claim) => getEvidenceChecklist(claim).filter((item) => !item.present).map((item) => item.label);
  const isLikelyWorthDisputing = (claim) =>
    claim.status !== "Closed" &&
    Number(claim.amount || 0) >= riskThresholds.high &&
    (claim.preventable !== "Yes" || claim.risk === "High" || getMissingEvidence(claim).length > 0);
  const getRecommendedDisputeAngle = (claim) => {
    const missingEvidence = getMissingEvidence(claim);
    if (claim.preventable === "No") return "Challenge contractor responsibility and request retailer proof tying the damage to this delivery.";
    if (claim.preventable === "Maybe") return "Dispute until responsibility is proven; focus on timing, photos, route notes, and customer sign-off.";
    if (missingEvidence.length > 0) return "Do not accept the chargeback yet. The packet is missing proof needed to validate responsibility.";
    if (claim.category === "Cargo") return "Review concealed-damage timing and whether damage existed before delivery.";
    if (claim.category === "Penalty") return "Compare retailer penalty reason against route timing, contact notes, and dispatch history.";
    return "Compare customer damage claim against route photos, driver statement, and delivery-room conditions.";
  };
  const getDisputeNextAction = (claim) => {
    const missingEvidence = getMissingEvidence(claim);
    if (missingEvidence.length) return `Collect ${missingEvidence.slice(0, 2).join(" and ")} before accepting the claim.`;
    if (isLikelyWorthDisputing(claim)) return "Send the packet to retailer claims review and request deduction reversal.";
    return "Keep this claim documented and monitor for repeat pattern by route, driver, or claim type.";
  };

  const preventablePercentage = filteredClaims.length
    ? Math.round((filteredClaims.filter((claim) => claim.preventable === "Yes").length / filteredClaims.length) * 100)
    : 0;
  const teamRiskRows = teamFilterOptions
    .map((teamName) => {
      const teamClaims = filteredClaims.filter((claim) => getClaimTeam(claim) === teamName);
      const exposure = teamClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
      const highRiskCount = teamClaims.filter((claim) => claim.risk === "High").length;
      const propertyExposure = teamClaims
        .filter((claim) => claim.category === "Property")
        .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

      return {
        name: teamName,
        exposure,
        highRiskCount,
        propertyExposure,
        score: exposure + highRiskCount * 500,
      };
    })
    .filter((team) => team.exposure > 0)
    .sort((a, b) => b.score - a.score);
  const highestRiskTeam = teamRiskRows[0] || { name: "None", exposure: 0, highRiskCount: 0, propertyExposure: 0 };
  const typeRiskRows = allClaimTypes
    .map((type) => {
      const typeClaims = filteredClaims.filter((claim) => claim.type === type);
      return {
        name: type,
        exposure: typeClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0),
        count: typeClaims.length,
      };
    })
    .filter((type) => type.exposure > 0)
    .sort((a, b) => b.exposure - a.exposure);
  const mostExpensiveClaimType = typeRiskRows[0] || { name: "None", exposure: 0, count: 0 };
  const missingEvidenceCount = filteredClaims.reduce((count, claim) => count + getMissingEvidence(claim).length, 0);
  const likelyDisputeClaims = filteredClaims.filter(isLikelyWorthDisputing);
  const claimTrend = filteredClaims.length ? 18.2 : 0;
  const highestPropertyTeam = teamRiskRows.slice().sort((a, b) => b.propertyExposure - a.propertyExposure)[0] || highestRiskTeam;
  const propertyExposureShare = propertyTotal ? Math.round((highestPropertyTeam.propertyExposure / propertyTotal) * 100) : 0;
  const missingPhotoTeams = teams.filter((team) => team.photoStatus === "Missing").map((team) => team.name);
  const intelligenceMetrics = [
    ["Open claim exposure", currency.format(openClaimExposure), `${openClaims} open claim${openClaims === 1 ? "" : "s"}`, "text-red-600"],
    ["Preventable %", `${preventablePercentage}%`, "Claims marked preventable", preventablePercentage >= 50 ? "text-amber-600" : "text-emerald-700"],
    ["Trend vs last period", `${claimTrend > 0 ? "+" : ""}${claimTrend}%`, "Mock trend until date history is connected", claimTrend > 0 ? "text-red-600" : "text-emerald-700"],
    ["Highest-risk team", highestRiskTeam.name, currency.format(highestRiskTeam.exposure), titleText],
    ["Costliest claim type", mostExpensiveClaimType.name, currency.format(mostExpensiveClaimType.exposure), titleText],
    ["Missing evidence", missingEvidenceCount, "Checklist gaps found", missingEvidenceCount ? "text-amber-600" : "text-emerald-700"],
    ["Worth disputing", likelyDisputeClaims.length, "High-value claims to review", likelyDisputeClaims.length ? "text-blue-600" : "text-emerald-700"],
  ];
  const intelligenceInsights = [
    {
      title: `${highestPropertyTeam.name} is responsible for ${propertyExposureShare}% of property damage exposure this month.`,
      detail: "Use this to decide where driver coaching, photo review, or route observation should start.",
      tone: "red",
    },
    {
      title: `${mostExpensiveClaimType.name} is the highest-cost claim type.`,
      detail: `${currency.format(mostExpensiveClaimType.exposure)} in exposure across ${mostExpensiveClaimType.count} claim${mostExpensiveClaimType.count === 1 ? "" : "s"}.`,
      tone: "amber",
    },
    {
      title: missingPhotoTeams.length ? "Missing photos are weakening dispute readiness." : "Photo readiness is currently clean.",
      detail: missingPhotoTeams.length ? `${missingPhotoTeams.join(", ")} need photo evidence before disputes are strong.` : "Uploaded route photos make claim review easier.",
      tone: "blue",
    },
    {
      title: `${likelyDisputeClaims.length} claim${likelyDisputeClaims.length === 1 ? "" : "s"} should be reviewed for dispute.`,
      detail: "High-value open claims should not become accepted losses without a packet review.",
      tone: "emerald",
    },
  ];

  const topStats = [
    {
      label: "Open Claims",
      value: openClaims,
      note: `${claims.length} total claims`,
      icon: FileText,
      accent: "blue",
      bar: "bg-blue-600",
      iconClass: isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700",
      valueClass: titleText,
    },
    {
      label: "Total Exposure",
      value: currency.format(filteredExposure),
      note: `${currency.format(totalExposure)} total unfiltered`,
      icon: AlertTriangle,
      accent: "red",
      bar: "bg-red-500",
      iconClass: isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700",
      valueClass: "text-red-600",
    },
    {
      label: "Penalty Claims",
      value: currency.format(penaltyTotal),
      note: "Chargebacks & deductions",
      icon: DollarSign,
      accent: "amber",
      bar: "bg-amber-600",
      iconClass: isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700",
      valueClass: "text-amber-700",
    },
    {
      label: "Profit Lost / Stop",
      value: currency.format(profitLostPerStop),
      note: "Based on 1,038 stops",
      icon: BarChart3,
      accent: "blue",
      bar: "bg-blue-600",
      iconClass: isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700",
      valueClass: titleText,
    },
  ];

  const categoryBreakdown = [
    { category: "Property", total: propertyTotal, count: filteredClaims.filter((claim) => claim.category === "Property").length },
    { category: "Cargo", total: cargoTotal, count: filteredClaims.filter((claim) => claim.category === "Cargo").length },
    { category: "Penalty", total: penaltyTotal, count: filteredClaims.filter((claim) => claim.category === "Penalty").length },
  ];

  const reviewBoard = [
    {
      title: "Needs Review",
      subtitle: "Imported, unclear, or waiting for a decision",
      count: filteredClaimReviewQueue.length + filteredClaims.filter((claim) => claim.status === "Under Review").length,
      tone: "amber",
      claims: [
        ...filteredClaimReviewQueue.map((item) => ({
          id: item.id,
          source: "queue",
          claim: item.claim,
          confidence: item.confidence,
          receivedAt: item.receivedAt,
          sourceText: item.sourceText,
        })),
        ...filteredClaims
          .filter((claim) => claim.status === "Under Review")
          .map((claim) => ({ id: claim.id, source: "claim", claim })),
      ],
    },
    {
      title: "In Progress",
      subtitle: "Open claims being worked",
      count: filteredClaims.filter((claim) => claim.status === "Open").length,
      tone: "blue",
      claims: filteredClaims.filter((claim) => claim.status === "Open").map((claim) => ({ id: claim.id, source: "claim", claim })),
    },
    {
      title: "Resolved",
      subtitle: "Closed claims and completed reviews",
      count: filteredClaims.filter((claim) => claim.status === "Closed").length,
      tone: "emerald",
      claims: filteredClaims.filter((claim) => claim.status === "Closed").map((claim) => ({ id: claim.id, source: "claim", claim })),
    },
  ];

  const getBoardTone = (tone) => {
    if (tone === "amber") {
      return {
        header: isDark ? "bg-amber-500/10 text-amber-200" : "bg-amber-50 text-amber-800",
        dot: "bg-amber-500",
      };
    }
    if (tone === "emerald") {
      return {
        header: isDark ? "bg-emerald-500/10 text-emerald-200" : "bg-emerald-50 text-emerald-800",
        dot: "bg-emerald-500",
      };
    }
    return {
      header: isDark ? "bg-blue-500/10 text-blue-200" : "bg-blue-50 text-blue-800",
      dot: "bg-blue-500",
    };
  };
  const getInsightToneClass = (tone) => {
    if (tone === "red") return isDark ? "border-white/10 border-l-red-500 bg-slate-950/40 text-red-200" : "border-slate-200 border-l-red-500 bg-white text-red-800";
    if (tone === "amber") return isDark ? "border-white/10 border-l-amber-500 bg-slate-950/40 text-amber-200" : "border-slate-200 border-l-amber-500 bg-white text-amber-800";
    if (tone === "emerald") return isDark ? "border-white/10 border-l-emerald-500 bg-slate-950/40 text-emerald-200" : "border-slate-200 border-l-emerald-500 bg-white text-emerald-800";
    return isDark ? "border-white/10 border-l-blue-500 bg-slate-950/40 text-blue-200" : "border-slate-200 border-l-blue-500 bg-white text-blue-800";
  };

  return (
    <div className={pageClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Last Mile Margin</p>
          <h1 className={`mt-1 text-3xl font-black tracking-tight sm:text-5xl ${titleText}`}>Claims Dashboard</h1>
          <p className={`mt-3 max-w-3xl text-sm sm:text-base ${mutedText}`}>
            Track penalty claims, cargo claims, property claims, preventability, and profit impact.
          </p>
          {backendStatus && (
            <p className={backendStatus.includes("Supabase") || backendStatus.includes("synced") ? "mt-2 text-xs font-black text-emerald-600" : "mt-2 text-xs font-black text-amber-600"}>
              {backendStatus}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setShowImport(true);
              setShowForm(false);
              setReviewClaim(null);
              setActiveReviewId(null);
              scrollToClaimActionPanel();
            }}
            className={isDark ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-200 hover:bg-emerald-500/15" : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-100"}
          >
            Import Claim Email
          </button>
          <button onClick={openAddForm} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-500">
            + Add Claim
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Claims Intelligence</p>
            <h2 className={`mt-1 text-xl font-bold leading-tight sm:text-2xl ${titleText}`}>Reduce claim loss before it becomes margin loss</h2>
            <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedText}`}>
              Filter claims by team, driver, type, preventability, status, and risk. The intelligence below updates to show where losses are coming from.
            </p>
          </div>
          <span className={isDark ? "w-fit rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-slate-200" : "w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600"}>
            {filteredClaims.length} of {claims.length} claims shown
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {intelligenceMetrics.map(([label, value, note, valueClass]) => {
            const isTextValue = /[A-Za-z]/.test(String(value));

            return (
              <div key={label} className={isDark ? "min-h-[116px] rounded-xl border border-white/10 bg-slate-950/40 p-3" : "min-h-[116px] rounded-xl border border-slate-200 bg-slate-50/80 p-3"}>
                <p className={`text-[10px] font-semibold uppercase leading-4 tracking-wide ${mutedText}`}>{label}</p>
                <p
                  className={`${isTextValue ? "mt-2 line-clamp-2 text-xl leading-6" : "safe-number mt-2 text-xl"} font-black ${valueClass}`}
                  title={String(value)}
                >
                  {value}
                </p>
                <p className={`mt-1 line-clamp-2 text-xs font-semibold leading-4 ${mutedText}`} title={String(note)}>{note}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {intelligenceInsights.map((insight) => (
            <div key={insight.title} className={`min-h-[132px] rounded-xl border border-l-4 p-4 ${getInsightToneClass(insight.tone)}`}>
              <p className="text-sm font-black leading-5">{insight.title}</p>
              <p className={isDark ? "mt-3 text-xs font-semibold leading-5 text-slate-300" : "mt-3 text-xs font-semibold leading-5 text-slate-600"}>{insight.detail}</p>
            </div>
          ))}
        </div>

        <div className={isDark ? "mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3" : "mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3"}>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm font-black ${titleText}`}>Claim filters</p>
              <p className={`text-xs ${mutedText}`}>Use these to find exactly what is driving exposure.</p>
            </div>
            <button
              type="button"
              onClick={resetClaimFilters}
              className={isDark ? "w-fit rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/10" : "w-fit rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"}
            >
              Reset Filters
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {[
              ["team", "Team", teamFilterOptions],
              ["driver", "Driver", driverFilterOptions],
              ["claimType", "Claim Type", allClaimTypes],
              ["preventable", "Preventable", ["Yes", "No", "Maybe"]],
              ["status", "Status", ["Open", "Under Review", "Closed"]],
              ["risk", "Risk", ["Low", "Medium", "High"]],
            ].map(([field, label, options]) => (
              <label key={field} className="block">
                <span className={`mb-1 block text-[10px] font-semibold uppercase tracking-wide ${mutedText}`}>{label}</span>
                <select value={claimFilters[field]} onChange={(event) => updateClaimFilter(field, event.target.value)} className={`${inputClass} h-10`}>
                  <option value="All">All</option>
                  {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>

      {claims.length === 0 && (
        <EmptyState
          isDark={isDark}
          eyebrow="Claims setup"
          title="No claims yet"
          description="Claim emails, damage claims, penalties, cargo issues, and property claims will appear here for review, evidence tracking, and dispute packets."
          Icon={FileText}
          primaryAction={{
            label: "Import Claim Email",
            onClick: () => {
              setShowImport(true);
              setShowForm(false);
              setReviewClaim(null);
              setActiveReviewId(null);
              scrollToClaimActionPanel();
            },
          }}
          secondaryActions={[
            { label: "Add Manual Claim", onClick: openAddForm },
            { label: "Open Intake", onClick: () => navigateToTab?.("Intake") },
          ]}
        />
      )}

      <div className={isDark ? "rounded-xl border border-white/10 bg-slate-900/80 px-5 py-4 text-center" : "rounded-xl border border-slate-300 bg-slate-200 px-5 py-4 text-center"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Claim Workflow Board</p>
        <h2 className={`mt-1 text-xl font-bold ${titleText}`}>Drag claims between columns to update status</h2>
        <p className={`mx-auto mt-2 max-w-3xl text-sm leading-6 ${mutedText}`}>
          Use Needs Review, In Progress, and Resolved to keep claim ownership, evidence collection, and dispute decisions moving.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {reviewBoard.map((bucket) => {
          const tone = getBoardTone(bucket.tone);
          const isDropTarget = Boolean(draggedClaim);
          return (
            <div
              key={bucket.title}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleClaimDrop(event, bucket.title)}
              className={`${cardClass} transition ${
                isDropTarget
                  ? isDark
                    ? "ring-2 ring-blue-500/30"
                    : "ring-2 ring-blue-200"
                  : ""
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                    <h2 className={`text-lg font-bold ${titleText}`}>{bucket.title}</h2>
                  </div>
                  <p className={`mt-1 text-sm ${mutedText}`}>{bucket.subtitle}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${tone.header}`}>
                  {bucket.count}
                </span>
              </div>

              <div className="space-y-3">
                {bucket.claims.slice(0, 4).map(({ id, source, claim, confidence, receivedAt, sourceText }) => (
                  <div
                    key={`${bucket.title}-${id}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      setDraggedClaim({ id, source, claim, confidence, receivedAt, sourceText });
                    }}
                    onDragEnd={() => setDraggedClaim(null)}
                    className={`${isDark ? "rounded-2xl border border-white/10 bg-slate-950/50 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"} cursor-grab transition active:cursor-grabbing ${
                      draggedClaim?.id === id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate font-black ${titleText}`}>{claim.type}</p>
                        <p className={`mt-1 text-xs font-semibold ${mutedText}`}>
                          {claim.id} · {claim.date || receivedAt || "No date"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${getRiskClass(claim.risk)}`}>
                        {claim.risk}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className={`text-[11px] font-semibold uppercase tracking-wide ${mutedText}`}>Amount</p>
                        <p className="font-black text-red-600">{currency.format(Number(claim.amount || 0))}</p>
                      </div>
                      <div>
                        <p className={`text-[11px] font-semibold uppercase tracking-wide ${mutedText}`}>Driver</p>
                        <p className={`truncate font-bold ${titleText}`}>{claim.driver || getClaimDriver(claim) || "Unassigned"}</p>
                      </div>
                    </div>

                    <p className={`mt-3 truncate text-xs font-semibold ${mutedText}`}>
                      {claim.route || claim.team || "No route assigned"}
                      {confidence ? ` · ${confidence}% confidence` : ""}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {source === "queue" ? (
                        <>
                          <button onClick={() => openClaimReview(claim, "queue", { id, confidence, receivedAt, sourceText })} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500">
                            Review Claim
                          </button>
                          <button onClick={() => setDisputePacketClaim(claim)} className={isDark ? "rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-black text-blue-200 hover:bg-blue-500/10" : "rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"}>
                            Generate Dispute Packet
                          </button>
                          <button onClick={() => approveQueuedClaim({ id, claim })} className={isDark ? "rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-500/10" : "rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"}>
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openClaimReview(claim)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500">
                            Review Claim
                          </button>
                          <button onClick={() => setDisputePacketClaim(claim)} className={isDark ? "rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-black text-blue-200 hover:bg-blue-500/10" : "rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"}>
                            Generate Dispute Packet
                          </button>
                          {claim.status !== "Closed" && (
                            <button onClick={() => updateClaimStatus(claim.id, "Closed")} className={isDark ? "rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-500/10" : "rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"}>
                              Resolve
                            </button>
                          )}
                          {claim.status === "Under Review" && (
                            <button onClick={() => updateClaimStatus(claim.id, "Open")} className={isDark ? "rounded-lg bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15" : "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"}>
                              Start
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {bucket.claims.length === 0 && (
                  <div className={isDark ? "rounded-2xl border border-dashed border-white/10 p-5 text-sm font-semibold text-slate-400" : "rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500"}>
                    {draggedClaim ? `Drop here to mark ${statusForBucket(bucket.title)}.` : "Nothing here right now."}
                  </div>
                )}

                {bucket.claims.length > 4 && (
                  <p className={`text-xs font-bold ${mutedText}`}>
                    + {bucket.claims.length - 4} more in the log below
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {reviewClaim && (
        <div className={cardClass}>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getCategoryClass(reviewClaim.claim.category)}`}>{reviewClaim.claim.category}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getRiskClass(reviewClaim.claim.risk)}`}>{reviewClaim.claim.risk} Risk</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getStatusClass(reviewClaim.claim.status)}`}>{reviewClaim.claim.status}</span>
                {reviewClaim.confidence && (
                  <span className={reviewClaim.confidence >= 80 ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-700" : reviewClaim.confidence >= 50 ? "rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-700" : "rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-black text-red-600"}>
                    {reviewClaim.confidence}% confidence
                  </span>
                )}
              </div>
              <h2 className={`mt-3 text-2xl font-black ${titleText}`}>{reviewClaim.claim.type}</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>
                {reviewClaim.claim.id} · {reviewClaim.claim.date || reviewClaim.receivedAt || "No date"}
              </p>
            </div>
            <button
              onClick={() => setReviewClaim(null)}
              className={isDark ? "rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"}
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/50 p-5" : "rounded-2xl border border-slate-200 bg-slate-50 p-5"}>
              <h3 className={`text-sm font-semibold uppercase tracking-wide ${mutedText}`}>Claim Snapshot</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  ["Amount", currency.format(Number(reviewClaim.claim.amount || 0)), "text-red-600"],
                  ["Driver", reviewClaim.claim.driver || getClaimDriver(reviewClaim.claim) || "Unassigned", titleText],
                  ["Route", reviewClaim.claim.route || "No route assigned", titleText],
                  ["Preventable", reviewClaim.claim.preventable || "Unknown", titleText],
                ].map(([label, value, valueClass]) => (
                  <div key={label}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>{label}</p>
                    <p className={`mt-1 text-lg font-bold ${valueClass}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className={isDark ? "mt-5 rounded-xl border border-white/10 bg-slate-900/70 p-4" : "mt-5 rounded-xl border border-slate-200 bg-white p-4"}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Next Best Action</p>
                <p className={`mt-2 text-sm font-semibold ${titleText}`}>
                  {reviewClaim.source === "queue"
                    ? "Review the imported draft. Save it to the log when the driver, amount, and type look right."
                    : reviewClaim.claim.status === "Under Review"
                      ? "Confirm the details, then move it to In Progress or resolve it."
                      : reviewClaim.claim.status === "Open"
                        ? "Collect missing proof, confirm responsibility, then resolve it when finished."
                        : "This claim is resolved. Reopen it only if something changes."}
                </p>
              </div>

              {reviewClaim.sourceText && (
                <div className={isDark ? "mt-4 rounded-xl border border-white/10 bg-slate-900/70 p-4" : "mt-4 rounded-xl border border-slate-200 bg-white p-4"}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Imported Text</p>
                  <p className={`mt-2 max-h-28 overflow-y-auto text-sm leading-6 ${mutedText}`}>{reviewClaim.sourceText}</p>
                </div>
              )}
            </div>

            <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/50 p-5" : "rounded-2xl border border-slate-200 bg-slate-50 p-5"}>
              <h3 className={`text-sm font-semibold uppercase tracking-wide ${mutedText}`}>Quick Actions</h3>
              <div className="mt-4 grid gap-2">
                <button
                  onClick={() => setDisputePacketClaim(reviewClaim.claim)}
                  className={isDark ? "rounded-xl border border-blue-500/40 px-4 py-3 text-sm font-black text-blue-200 hover:bg-blue-500/10" : "rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-50"}
                >
                  Generate Dispute Packet
                </button>
                {reviewClaim.source === "queue" ? (
                  <>
                    <button
                      onClick={() => {
                        approveQueuedClaimWithStatus(reviewClaim, "Under Review");
                        setReviewClaim(null);
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500"
                    >
                      Save to Needs Review
                    </button>
                    <button
                      onClick={() => {
                        approveQueuedClaimWithStatus(reviewClaim, "Open");
                        setReviewClaim(null);
                      }}
                      className={isDark ? "rounded-xl border border-blue-500/40 px-4 py-3 text-sm font-black text-blue-200 hover:bg-blue-500/10" : "rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-50"}
                    >
                      Save to In Progress
                    </button>
                    <button
                      onClick={() => {
                        reviewQueuedClaim(reviewClaim);
                        setReviewClaim(null);
                      }}
                      className={isDark ? "rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"}
                    >
                      Edit Full Draft
                    </button>
                  </>
                ) : (
                  <>
                    {reviewClaim.claim.status !== "Open" && (
                      <button onClick={() => updateClaimStatus(reviewClaim.claim.id, "Open")} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500">
                        Move to In Progress
                      </button>
                    )}
                    {reviewClaim.claim.status !== "Closed" && (
                      <button onClick={() => updateClaimStatus(reviewClaim.claim.id, "Closed")} className={isDark ? "rounded-xl border border-emerald-500/40 px-4 py-3 text-sm font-black text-emerald-200 hover:bg-emerald-500/10" : "rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-50"}>
                        Mark Resolved
                      </button>
                    )}
                    {reviewClaim.claim.status !== "Under Review" && (
                      <button onClick={() => updateClaimStatus(reviewClaim.claim.id, "Under Review")} className={isDark ? "rounded-xl border border-amber-500/40 px-4 py-3 text-sm font-black text-amber-200 hover:bg-amber-500/10" : "rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-50"}>
                        Move to Needs Review
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(reviewClaim.claim)}
                      className={isDark ? "rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"}
                    >
                      Edit Details
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={claimActionPanelRef} className="scroll-mt-24" />

      {showImport && (
        <div className={cardClass}>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className={`text-lg font-bold ${titleText}`}>Import Claim Email</h2>
              <p className={`text-sm ${mutedText}`}>Paste or drop the email, review what was found, then send it to the review queue.</p>
            </div>
            <button
              onClick={() => {
                setShowImport(false);
                setImportDraft(null);
                setActiveReviewId(null);
              }}
              className={isDark ? "rounded-lg bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/15" : "rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"}
            >
              Close
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setIsEmailDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsEmailDragging(true);
              }}
              onDragLeave={() => setIsEmailDragging(false)}
              onDrop={handleEmailDrop}
              className={
                isEmailDragging
                  ? isDark
                    ? "rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-500/10 p-3"
                    : "rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-50 p-3"
                  : "rounded-2xl border-2 border-dashed border-transparent p-3"
              }
            >
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Claim Email</label>
              <div className={isDark ? "mb-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-slate-300" : "mb-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"}>
                Drop an email, .eml, .txt, or selected email text here.
              </div>
              <textarea
                value={claimEmailText}
                onChange={(event) => setClaimEmailText(event.target.value)}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsEmailDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsEmailDragging(true);
                }}
                onDrop={handleEmailDrop}
                className={`${inputClass} min-h-64 resize-y leading-6 ${isEmailDragging ? "border-emerald-500" : ""}`}
                placeholder={"Example: Customer reported wall damage on Lowe's Appliance route. Driver Mike S. Claim amount $950. Please review."}
              />
              <button onClick={extractClaimFromEmail} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">
                Extract Claim Draft
              </button>
            </div>

            <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/50 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className={`font-black ${titleText}`}>Review Draft</h3>
                  <p className={`text-xs ${mutedText}`}>Everything here can be corrected before saving or review.</p>
                </div>
                {importDraft && (
                  <span className={importConfidence >= 80 ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700" : importConfidence >= 50 ? "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700" : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-600"}>
                    {importConfidence}% confidence
                  </span>
                )}
              </div>

              {!importDraft ? (
                <div className={isDark ? "rounded-xl border border-dashed border-white/10 p-6 text-sm font-semibold text-slate-400" : "rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-slate-500"}>
                  Your extracted claim draft will show up here.
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Claim ID</label>
                      <input value={importDraft.id} onChange={(e) => updateImportDraft("id", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Category</label>
                      <select
                        value={importDraft.category}
                        onChange={(e) =>
                          setImportDraft((current) => ({
                            ...current,
                            category: e.target.value,
                            type: claimTypeOptions[e.target.value]?.[0] || "",
                          }))
                        }
                        className={inputClass}
                      >
                        {["Penalty", "Cargo", "Property"].map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Claim Type</label>
                      <select value={importDraft.type} onChange={(e) => updateImportDraft("type", e.target.value)} className={inputClass}>
                        {(claimTypeOptions[importDraft.category] || []).map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Assigned Driver</label>
                      <select
                        value={importDraft.driver}
                        onChange={(e) =>
                          setImportDraft((current) => ({
                            ...current,
                            driver: e.target.value,
                            team: getDriverTeam(e.target.value),
                            route: current.route || getDriverRoute(e.target.value),
                          }))
                        }
                        className={inputClass}
                      >
                        {driverOptions.length === 0 && (
                          <option value={unassignedDriverLabel}>{unassignedDriverLabel}</option>
                        )}
                        {driverOptions.map((driver) => (
                          <option key={`${driver.team}-${driver.name}`} value={driver.name}>{driver.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Route</label>
                      <input value={importDraft.route} onChange={(e) => updateImportDraft("route", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Amount</label>
                      <input type="number" value={importDraft.amount} onChange={(e) => updateImportDraft("amount", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Status</label>
                      <select value={importDraft.status} onChange={(e) => updateImportDraft("status", e.target.value)} className={inputClass}>
                        {["Open", "Under Review", "Closed"].map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Risk</label>
                      <select value={importDraft.risk} onChange={(e) => updateImportDraft("risk", e.target.value)} className={inputClass}>
                        {["Low", "Medium", "High"].map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Preventable</label>
                      <select value={importDraft.preventable} onChange={(e) => updateImportDraft("preventable", e.target.value)} className={inputClass}>
                        {["Yes", "No", "Maybe"].map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Date</label>
                      <input value={importDraft.date} onChange={(e) => updateImportDraft("date", e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={queueImportedClaim} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">
                      {activeReviewId ? "Update Review Item" : "Add to Needs Review"}
                    </button>
                    <button onClick={approveImportedClaim} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">
                      Save Claim
                    </button>
                    <button
                      onClick={() => {
                        setImportDraft(null);
                        setActiveReviewId(null);
                      }}
                      className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"}
                    >
                      Clear Draft
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-xl font-bold ${titleText}`}>Email Claims Needing Review</h2>
            <p className={`text-sm ${mutedText}`}>Imported email claims wait here until you save, edit, or ignore them.</p>
          </div>
          <span className={isDark ? "w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200" : "w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
            {claimReviewQueue.length} pending
          </span>
        </div>

        {claimReviewQueue.length === 0 ? (
          <div className={isDark ? "rounded-xl border border-dashed border-white/10 p-5 text-sm font-semibold text-slate-400" : "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500"}>
            No imported claim emails are waiting for review.
          </div>
        ) : (
          <div className="space-y-3">
            {claimReviewQueue.map((item) => (
              <div key={item.id} className={isDark ? "rounded-2xl border border-white/10 bg-slate-950/50 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
                <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_auto] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-black ${titleText}`}>{item.claim.type}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getCategoryClass(item.claim.category)}`}>{item.claim.category}</span>
                      <span className={item.confidence >= 80 ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-700" : item.confidence >= 50 ? "rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-700" : "rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-black text-red-600"}>
                        {item.confidence}% confidence
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      {item.claim.id} · {item.claim.date} · imported {item.receivedAt}
                    </p>
                    <p className={`mt-2 line-clamp-2 text-xs ${mutedText}`}>
                      {(item.sourceText || "No email preview available.").slice(0, 220)}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-3 xl:grid-cols-1">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Amount</p>
                      <p className="font-black text-red-600">{currency.format(Number(item.claim.amount || 0))}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Driver</p>
                      <p className={`font-bold ${titleText}`}>{item.claim.driver || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Route</p>
                      <p className={`font-bold ${titleText}`}>{item.claim.route || "No route"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button onClick={() => setDisputePacketClaim(item.claim)} className={isDark ? "rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-black text-blue-200 hover:bg-blue-500/10" : "rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"}>
                      Generate Dispute Packet
                    </button>
                    <button onClick={() => approveQueuedClaim(item)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500">
                      Save to Log
                    </button>
                    <button onClick={() => reviewQueuedClaim(item)} className={isDark ? "rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-500/10" : "rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"}>
                      Edit
                    </button>
                    <button onClick={() => ignoreQueuedClaim(item.id)} className={isDark ? "rounded-lg border border-red-500/40 px-3 py-2 text-xs font-black text-red-300 hover:bg-red-500/10" : "rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"}>
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${titleText}`}>{editingId ? "Edit Claim" : "Add Claim"}</h2>
              <p className={`text-sm ${mutedText}`}>Assign claims to drivers so exposure follows the person responsible.</p>
            </div>
            <button onClick={() => setShowForm(false)} className={isDark ? "rounded-lg bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/15" : "rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"}>
              Cancel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Claim ID</label>
              <input value={claimForm.id} onChange={(e) => updateClaimField("id", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Category</label>
              <select
                value={claimForm.category}
                onChange={(e) =>
                  setClaimForm((current) => ({
                    ...current,
                    category: e.target.value,
                    type: claimTypeOptions[e.target.value]?.[0] || "",
                  }))
                }
                className={inputClass}
              >
                {["Penalty", "Cargo", "Property"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Claim Type</label>
              <select value={claimForm.type} onChange={(e) => updateClaimField("type", e.target.value)} className={inputClass}>
                {(claimTypeOptions[claimForm.category] || []).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Assigned Driver</label>
              <select
                value={claimForm.driver}
                onChange={(e) =>
                  setClaimForm((current) => ({
                    ...current,
                    driver: e.target.value,
                    team: getDriverTeam(e.target.value),
                    route: current.route || getDriverRoute(e.target.value),
                  }))
                }
                className={inputClass}
              >
                {driverOptions.length === 0 && (
                  <option value={unassignedDriverLabel}>{unassignedDriverLabel}</option>
                )}
                {driverOptions.map((driver) => (
                  <option key={`${driver.team}-${driver.name}`} value={driver.name}>{driver.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Route</label>
              <input value={claimForm.route} onChange={(e) => updateClaimField("route", e.target.value)} className={inputClass} placeholder="Syracuse Appliance" />
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Amount</label>
              <input type="number" value={claimForm.amount} onChange={(e) => updateClaimField("amount", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Status</label>
              <select value={claimForm.status} onChange={(e) => updateClaimField("status", e.target.value)} className={inputClass}>
                {["Open", "Under Review", "Closed"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Risk</label>
              <select value={claimForm.risk} onChange={(e) => updateClaimField("risk", e.target.value)} className={inputClass}>
                {["Low", "Medium", "High"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Preventable</label>
              <select value={claimForm.preventable} onChange={(e) => updateClaimField("preventable", e.target.value)} className={inputClass}>
                {["Yes", "No", "Maybe"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <p className={`mt-1 text-[11px] leading-4 ${mutedText}`}>Could the crew have avoided it? <span className="font-bold">Yes</span> = driver-caused (coach the team). <span className="font-bold">No</span> = not your fault (dispute it). <span className="font-bold">Maybe</span> = unclear, gather evidence.</p>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${mutedText}`}>Date</label>
              <input value={claimForm.date} onChange={(e) => updateClaimField("date", e.target.value)} className={inputClass} placeholder="Today" />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={saveClaim} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">
              {editingId ? "Update Claim" : "Save Claim"}
            </button>
            <button
              onClick={() => {
                setClaimForm(blankClaim);
                setEditingId(null);
                setShowForm(false);
              }}
              className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={cardClass}>
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-4 ${stat.iconClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${mutedText}`}>{stat.label}</p>
                  <p className={`mt-2 text-3xl font-black ${stat.valueClass}`}>{stat.value}</p>
                  <p className={`mt-1 text-xs ${mutedText}`}>{stat.note}</p>
                </div>
              </div>
              <div className={isDark ? "mt-5 h-1.5 rounded-full bg-white/10" : "mt-5 h-1.5 rounded-full bg-slate-100"}>
                <div className={`h-1.5 w-2/3 rounded-full ${stat.bar}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {categoryBreakdown.map((item) => {
          const meta = categoryMeta[item.category];
          const Icon = item.category === "Property" ? AlertTriangle : item.category === "Cargo" ? Truck : FileText;
          return (
            <div key={item.category} className={cardClass}>
              <div className="flex items-center gap-4">
                <div className={`rounded-full border p-4 ${meta.iconBg} ${meta.border} ${meta.text}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${mutedText}`}>{item.category} Claims</p>
                  <p className={`mt-2 text-4xl font-black ${meta.value}`}>{currency.format(item.total)}</p>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    {item.count} claim{item.count === 1 ? "" : "s"} · {meta.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cardClass}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-xl font-bold ${titleText}`}>Claims Log</h2>
            <p className={`text-sm ${mutedText}`}>
              Historical record for search, audit, exports, and deeper edits. {claims.length} total claim{claims.length === 1 ? "" : "s"}.
            </p>
          </div>

          <button
            onClick={() => setShowClaimLog((current) => !current)}
            className={showClaimLog ? "rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500" : isDark ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"}
          >
            {showClaimLog ? "Hide Claim Log" : "View Full Claim Log"}
          </button>
        </div>

        {!showClaimLog ? (
          <div className={isDark ? "rounded-xl border border-dashed border-white/10 p-5 text-sm font-semibold text-slate-400" : "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500"}>
            The working board above is the main view. Open the full log only when you need history, filtering, or deeper edits.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`border-b ${tableBorder}`}>
                  <tr className={`text-xs uppercase tracking-wide ${mutedText}`}>
                    <th className="py-3">Claim</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Driver</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Preventable</th>
                    <th className="py-3">Risk</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className={`border-b ${rowBorder}`}>
                      <td className="py-4">
                        <p className={`font-black ${titleText}`}>{claim.id}</p>
                        <p className={`text-xs ${mutedText}`}>{claim.date}</p>
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getCategoryClass(claim.category)}`}>{claim.category}</span>
                      </td>
                      <td className="py-4">
                        <p className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{claim.type}</p>
                        <p className={`text-xs ${mutedText}`}>{claim.route}</p>
                      </td>
                      <td className={`py-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        <p className="font-bold">{getClaimDriver(claim) || "Unassigned"}</p>
                        <p className={`text-xs ${mutedText}`}>{claim.team || getDriverTeam(getClaimDriver(claim))}</p>
                      </td>
                      <td className="py-4 font-black text-red-600">{currency.format(Number(claim.amount || 0))}</td>
                      <td className={`py-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{claim.preventable}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getRiskClass(claim.risk)}`}>{claim.risk}</span>
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(claim.status)}`}>{claim.status}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDisputePacketClaim(claim)}
                            className={isDark ? "rounded-lg border border-blue-500/40 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/10" : "rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"}
                          >
                            Generate Dispute Packet
                          </button>
                          <button
                            onClick={() => openEditForm(claim)}
                            className={isDark ? "rounded-lg border border-blue-500/40 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/10" : "rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteClaim(claim.id)}
                            className={isDark ? "rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/10" : "rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredClaims.length === 0 && (
                    <tr>
                      <td colSpan="9" className={`py-8 text-center ${mutedText}`}>
                        <div className="flex flex-col items-center gap-3">
                          <p className={`font-black ${titleText}`}>No claims match these filters.</p>
                          <p className="max-w-xl text-sm">Reset filters or add/import a claim if this workspace is still new.</p>
                          <button
                            type="button"
                            onClick={resetClaimFilters}
                            className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                          >
                            Reset Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={`mt-5 border-t pt-4 text-sm ${tableBorder} ${mutedText}`}>
              Showing {filteredClaims.length} of {claims.length} claim{claims.length === 1 ? "" : "s"}.
            </div>
          </>
        )}
      </div>

      {disputePacketClaim && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className={isDark ? "max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50" : "max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"}>
            <div className={isDark ? "flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-start lg:justify-between" : "flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-start lg:justify-between"}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Generated Dispute Packet</p>
                <h2 className={`mt-1 text-2xl font-black ${titleText}`}>{disputePacketClaim.id} · {disputePacketClaim.type}</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>Mock packet summary for claims review. This does not create a real PDF yet.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* TODO: connect PDF export here once server-side document generation is available. */}
                <button
                  type="button"
                  disabled
                  title="PDF export needs backend document generation before it can be enabled."
                  className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-500" : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-400"}
                >
                  Export PDF Soon
                </button>
                <button
                  type="button"
                  onClick={() => setDisputePacketClaim(null)}
                  className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                <div className="space-y-5">
                  <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5" : "rounded-2xl border border-slate-200 bg-slate-50 p-5"}>
                    <h3 className={`text-lg font-bold ${titleText}`}>Claim Summary</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Claim ID", disputePacketClaim.id],
                        ["Claim amount", currency.format(Number(disputePacketClaim.amount || 0))],
                        ["Route / date", `${disputePacketClaim.route || "No route"} · ${disputePacketClaim.date || "No date"}`],
                        ["Team / driver", `${getClaimTeam(disputePacketClaim)} · ${getClaimDriver(disputePacketClaim) || "Unassigned"}`],
                        ["Claim type", disputePacketClaim.type],
                        ["Preventability", disputePacketClaim.preventable || "Unknown"],
                      ].map(([label, value]) => (
                        <div key={label} className={isDark ? "rounded-xl border border-white/10 bg-slate-950/60 p-4" : "rounded-xl border border-slate-200 bg-white p-4"}>
                          <p className={`text-[11px] font-semibold uppercase tracking-wide ${mutedText}`}>{label}</p>
                          <p className={`mt-1 text-sm font-black ${label === "Claim amount" ? "text-red-600" : titleText}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5" : "rounded-2xl border border-slate-200 bg-slate-50 p-5"}>
                    <h3 className={`text-lg font-bold ${titleText}`}>Evidence Checklist</h3>
                    {/* TODO: connect uploaded evidence files to these checklist items when backend file storage is connected. */}
                    <div className="mt-4 space-y-2">
                      {getEvidenceChecklist(disputePacketClaim).map((item) => (
                        <div key={item.label} className={isDark ? "flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3" : "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"}>
                          <span className={`text-sm font-bold ${titleText}`}>{item.label}</span>
                          <span className={item.present ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-700" : "rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-black text-red-600"}>
                            {item.present ? "Ready" : "Missing"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className={isDark ? "rounded-2xl border border-red-500/20 bg-red-500/10 p-5" : "rounded-2xl border border-red-100 bg-red-50 p-5"}>
                    <h3 className={`text-lg font-bold ${titleText}`}>Missing Evidence</h3>
                    {getMissingEvidence(disputePacketClaim).length ? (
                      <ul className="mt-3 space-y-2">
                        {getMissingEvidence(disputePacketClaim).map((item) => (
                          <li key={item} className={isDark ? "text-sm font-semibold text-red-200" : "text-sm font-semibold text-red-700"}>- {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className={isDark ? "mt-3 text-sm font-semibold text-emerald-200" : "mt-3 text-sm font-semibold text-emerald-700"}>No major evidence gaps found.</p>
                    )}
                  </div>

                  <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5" : "rounded-2xl border border-slate-200 bg-slate-50 p-5"}>
                    <h3 className={`text-lg font-bold ${titleText}`}>Recommended Dispute Angle</h3>
                    <p className={`mt-3 text-sm font-semibold leading-6 ${mutedText}`}>{getRecommendedDisputeAngle(disputePacketClaim)}</p>
                  </div>

                  <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5" : "rounded-2xl border border-slate-200 bg-slate-50 p-5"}>
                    <h3 className={`text-lg font-bold ${titleText}`}>Notes</h3>
                    <p className={`mt-3 text-sm font-semibold leading-6 ${mutedText}`}>
                      Review claim amount, driver assignment, route timing, and retailer claim language before accepting this as a loss.
                    </p>
                  </div>

                  <div className={isDark ? "rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5" : "rounded-2xl border border-blue-100 bg-blue-50 p-5"}>
                    <h3 className={`text-lg font-bold ${titleText}`}>Next Action</h3>
                    <p className={isDark ? "mt-3 text-sm font-black leading-6 text-blue-100" : "mt-3 text-sm font-black leading-6 text-blue-800"}>{getDisputeNextAction(disputePacketClaim)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className={isDark ? "w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50" : "w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"}>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Confirm Action</p>
            <h2 className={`mt-2 text-2xl font-black ${titleText}`}>{confirmAction.title}</h2>
            <p className={`mt-3 text-sm leading-6 ${mutedText}`}>{confirmAction.message}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-500"
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimsDashboard;
