import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  claimTypeOptions,
  currency,
  DollarSign,
  FileText,
  Truck,
} from "../shared";

function ClaimsDashboard({ claims, setClaims, teams, isDark, appSettings }) {
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
    return matchingTeam?.lead || "";
  };
  const getDriverTeam = (driverName) => driverOptions.find((driver) => driver.name === driverName)?.team || "";
  const getDriverRoute = (driverName) => driverOptions.find((driver) => driver.name === driverName)?.route || "";

  const blankClaim = {
    id: "",
    category: "Property",
    type: claimTypeOptions.Property[0],
    driver: driverOptions[0]?.name || "",
    team: driverOptions[0]?.team || "",
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
  const [claimFilter, setClaimFilter] = useState("All");
  const riskThresholds = {
    medium: Number(appSettings?.claimRiskThresholds?.medium ?? 200),
    high: Number(appSettings?.claimRiskThresholds?.high ?? 500),
  };

  useEffect(() => {
    localStorage.setItem("finalMileClaimReviewQueue", JSON.stringify(claimReviewQueue));
  }, [claimReviewQueue]);

  const filteredClaims = claimFilter === "All" ? claims : claims.filter((claim) => claim.category === claimFilter);
  const totalExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const openClaims = claims.filter((claim) => claim.status !== "Closed").length;
  const penaltyTotal = claims
    .filter((claim) => claim.category === "Penalty")
    .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const propertyTotal = claims
    .filter((claim) => claim.category === "Property")
    .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const cargoTotal = claims
    .filter((claim) => claim.category === "Cargo")
    .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const profitLostPerStop = totalExposure / 1038;

  const pageClass = isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
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
    const driver = matchedDriver?.name || matchedRoute?.name || driverOptions[0]?.name || "";
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
    if (!importDraft?.id || !importDraft?.type || !importDraft?.driver) {
      alert("Claim ID, Type, and Driver are required before saving.");
      return;
    }

    const cleanedClaim = {
      ...importDraft,
      team: getDriverTeam(importDraft.driver),
      route: importDraft.route || getDriverRoute(importDraft.driver),
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
    if (!importDraft?.id || !importDraft?.type || !importDraft?.driver) {
      alert("Claim ID, Type, and Driver are required before adding to review.");
      return;
    }

    const reviewItem = {
      id: activeReviewId || `EMAIL-${importDraft.id}`,
      receivedAt: new Date().toLocaleString(),
      confidence: importConfidence,
      sourceText: claimEmailText,
      claim: {
        ...importDraft,
        team: getDriverTeam(importDraft.driver),
        route: importDraft.route || getDriverRoute(importDraft.driver),
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

  const approveQueuedClaim = (item) => {
    const cleanedClaim = {
      ...item.claim,
      team: getDriverTeam(item.claim.driver),
      route: item.claim.route || getDriverRoute(item.claim.driver),
      amount: Number(item.claim.amount || 0),
    };

    setClaims((current) => [cleanedClaim, ...current]);
    setClaimReviewQueue((current) => current.filter((queueItem) => queueItem.id !== item.id));
  };

  const ignoreQueuedClaim = (id) => {
    const confirmed = window.confirm("Ignore this imported email claim? It will be removed from review.");
    if (!confirmed) return;

    setClaimReviewQueue((current) => current.filter((item) => item.id !== id));
  };

  const openAddForm = () => {
    setEditingId(null);
    setShowImport(false);
    setActiveReviewId(null);
    setClaimForm({
      ...blankClaim,
      id: getNextClaimId(),
      driver: driverOptions[0]?.name || "",
      team: driverOptions[0]?.team || "",
      route: driverOptions[0]?.route || "",
      type: claimTypeOptions.Property[0],
    });
    setShowForm(true);
  };

  const openEditForm = (claim) => {
    setEditingId(claim.id);
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
    if (!claimForm.id || !claimForm.type || !claimForm.driver) {
      alert("Claim ID, Type, and Driver are required.");
      return;
    }

    const cleanedClaim = {
      ...claimForm,
      team: getDriverTeam(claimForm.driver),
      route: claimForm.route || getDriverRoute(claimForm.driver),
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

  const deleteClaim = (id) => {
    const claim = claims.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete ${claim?.id || "this claim"}? This cannot be undone.`
    );

    if (!confirmed) return;

    setClaims((current) => current.filter((claim) => claim.id !== id));
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
      value: currency.format(totalExposure),
      note: "Current claim exposure",
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
    { category: "Property", total: propertyTotal, count: claims.filter((claim) => claim.category === "Property").length },
    { category: "Cargo", total: cargoTotal, count: claims.filter((claim) => claim.category === "Cargo").length },
    { category: "Penalty", total: penaltyTotal, count: claims.filter((claim) => claim.category === "Penalty").length },
  ];

  return (
    <div className={pageClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Final Mile Margin</p>
          <h1 className={`mt-1 text-3xl font-black tracking-tight sm:text-5xl ${titleText}`}>Claims Dashboard</h1>
          <p className={`mt-3 max-w-3xl text-sm sm:text-base ${mutedText}`}>
            Track penalty claims, cargo claims, property claims, preventability, and profit impact.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setShowImport((current) => !current);
              setShowForm(false);
              setActiveReviewId(null);
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

      {showImport && (
        <div className={cardClass}>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className={`text-lg font-black ${titleText}`}>Import Claim Email</h2>
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
            <h2 className={`text-xl font-black ${titleText}`}>Email Claims Needing Review</h2>
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
                      <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Amount</p>
                      <p className="font-black text-red-600">{currency.format(Number(item.claim.amount || 0))}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Driver</p>
                      <p className={`font-bold ${titleText}`}>{item.claim.driver || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Route</p>
                      <p className={`font-bold ${titleText}`}>{item.claim.route || "No route"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
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
              <h2 className={`text-lg font-black ${titleText}`}>{editingId ? "Edit Claim" : "Add Claim"}</h2>
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
            <h2 className={`text-xl font-black ${titleText}`}>Claims Log</h2>
            <p className={`text-sm ${mutedText}`}>Add, edit, delete, and filter claim records.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["All", "Penalty", "Cargo", "Property"].map((filter) => (
              <button
                key={filter}
                onClick={() => setClaimFilter(filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  claimFilter === filter
                    ? "bg-blue-600 text-white"
                    : isDark
                    ? "bg-white/5 text-slate-300 hover:bg-white/10"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

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
                    No claims found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={`mt-5 flex items-center justify-between border-t pt-4 text-sm ${tableBorder} ${mutedText}`}>
          <p>
            Showing 1 to {filteredClaims.length} of {filteredClaims.length} claims
          </p>
          <div className="flex items-center gap-2">
            <button disabled className={isDark ? "cursor-not-allowed rounded-lg bg-white/5 px-3 py-1 opacity-50" : "cursor-not-allowed rounded-lg bg-slate-100 px-3 py-1 opacity-50"}>‹</button>
            <button disabled className="cursor-default rounded-lg bg-blue-600 px-3 py-1 font-bold text-white">1</button>
            <button disabled className={isDark ? "cursor-not-allowed rounded-lg bg-white/5 px-3 py-1 opacity-50" : "cursor-not-allowed rounded-lg bg-slate-100 px-3 py-1 opacity-50"}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClaimsDashboard;
