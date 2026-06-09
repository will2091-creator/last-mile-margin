import { useEffect, useMemo, useRef, useState } from "react";
import { aiFetch } from "../lib/aiFetch";
import { BarChart3, Camera, currency, DollarSign, FileText, RotateCcw, Sparkles, Trash2, Upload } from "../shared";
import { loadVaultDocumentsFromSupabase } from "../lib/documentRepository";
import { fileToCompressedImage } from "../lib/imagePrep";
import { RECEIPT_CATEGORIES, RECEIPTS_EVENT, loadReceipts, addReceipt, updateReceipt, removeReceipt } from "../lib/receipts";
import EmptyState from "../components/EmptyState";

const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(`${d}T00:00:00`);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Normalize a Supabase mobile vault receipt into the same shape as a local receipt (read-only).
function fromVaultDoc(doc) {
  const notes = doc.notes || "";
  const amount = Number(notes.match(/Amount:\s*([0-9.]+)/i)?.[1] || 0);
  const vendor = notes.match(/Vendor:\s*([^|]+)/i)?.[1]?.trim() || doc.name?.replace(/.*receipt\s*-\s*/i, "") || "Mobile receipt";
  const rawType = notes.match(/^([^|]+?) expense/i)?.[1]?.trim() || "";
  const category = RECEIPT_CATEGORIES.find((c) => c.toLowerCase() === rawType.toLowerCase()) || "Other";
  return {
    id: doc.id,
    vendor,
    amount,
    category,
    date: doc.uploaded_at ? new Date(doc.uploaded_at).toISOString().slice(0, 10) : "",
    notes,
    source: "mobile",
  };
}

const emptyDraft = { vendor: "", amount: "", category: "Fuel", date: todayKey(), notes: "" };

export default function ReceiptsDashboard({ isDark, navigateToTab }) {
  const [local, setLocal] = useState(() => loadReceipts());
  const [mobile, setMobile] = useState([]);
  const [mobileStatus, setMobileStatus] = useState("");
  const [filter, setFilter] = useState("All");

  // Draft form (scan-prefilled or manual) + scan state
  const [draft, setDraft] = useState(null); // null = closed
  const [scanStatus, setScanStatus] = useState("idle"); // idle | scanning
  const [scanNote, setScanNote] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const refresh = () => setLocal(loadReceipts());
    window.addEventListener(RECEIPTS_EVENT, refresh);
    return () => window.removeEventListener(RECEIPTS_EVENT, refresh);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await loadVaultDocumentsFromSupabase();
      if (!mounted) return;
      if (result.ok) {
        setMobile(result.documents.filter((d) => d.category === "Expense Receipts").map(fromVaultDoc));
      } else {
        setMobileStatus(result.error || "");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const all = useMemo(() => [...local, ...mobile], [local, mobile]);
  const filtered = filter === "All" ? all : all.filter((r) => r.category === filter);

  const insights = useMemo(() => {
    const total = all.reduce((s, r) => s + Number(r.amount || 0), 0);
    const month = todayKey().slice(0, 7);
    const thisMonth = all.filter((r) => (r.date || "").startsWith(month)).reduce((s, r) => s + Number(r.amount || 0), 0);
    const byCat = {};
    all.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + Number(r.amount || 0); });
    const ranked = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    return { total, thisMonth, ranked, topCategory: ranked[0] || null, count: all.length };
  }, [all]);

  const handleFile = async (file) => {
    if (!file) return;
    setScanStatus("scanning");
    setScanNote("");
    try {
      const { base64, contentType } = await fileToCompressedImage(file);
      const response = await aiFetch("/api/vision-receipt", { imageBase64: base64, contentType });
      if (!response.ok) throw new Error("AI unavailable");
      const data = await response.json().catch(() => ({}));
      if (!data || (!data.vendor && !data.amount)) throw new Error("Nothing read");
      setDraft({
        vendor: data.vendor || "",
        amount: data.amount ? String(data.amount) : "",
        category: RECEIPT_CATEGORIES.includes(data.category) ? data.category : "Other",
        date: /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : todayKey(),
        notes: data.notes || "",
      });
      setScanNote(data.confidence ? `AI read this receipt (${data.confidence}% confident). Check the fields below.` : "AI read this receipt. Check the fields below.");
    } catch {
      setDraft({ ...emptyDraft });
      setScanNote("Couldn't read that automatically — fill it in manually below.");
    }
    setScanStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  };

  const saveDraft = () => {
    if (!draft) return;
    addReceipt({ ...draft, source: scanNote ? "scan" : "manual" }); // fires RECEIPTS_EVENT → refresh
    setDraft(null);
    setScanNote("");
  };

  const card = isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const soft = isDark ? "rounded-2xl border border-white/10 bg-white/5" : "rounded-2xl border border-slate-200 bg-slate-50";
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500";

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className={card}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Expense Receipts</p>
            <h1 className={`mt-2 text-4xl font-black tracking-tight ${titleText}`}>Receipts</h1>
            <p className={`mt-2 max-w-2xl text-sm font-semibold ${mutedText}`}>Snap a receipt and AI pulls the vendor, amount, and category. Mobile uploads sync in too.</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={scanStatus === "scanning"}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {scanStatus === "scanning" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {scanStatus === "scanning" ? "Reading…" : "Scan receipt"}
            </button>
            <button
              onClick={() => { setDraft({ ...emptyDraft }); setScanNote(""); }}
              className={isDark ? "flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5" : "flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"}
            >
              <Upload className="h-4 w-4" /> Add manually
            </button>
          </div>
        </div>
      </section>

      {/* Draft form (scan-prefilled or manual) */}
      {draft && (
        <section className={isDark ? "rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-5 shadow-card" : "rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40 p-5 shadow-sm"}>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600"><Sparkles className="h-5 w-5" /></span>
            <div>
              <h2 className={`text-base font-black ${titleText}`}>New receipt</h2>
              {scanNote && <p className={`text-xs font-semibold ${mutedText}`}>{scanNote}</p>}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={`mb-1 block text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Vendor</label>
              <input value={draft.vendor} onChange={(e) => setDraft({ ...draft, vendor: e.target.value })} placeholder="e.g. Shell" className={inputClass} />
            </div>
            <div>
              <label className={`mb-1 block text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Amount</label>
              <input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value.replace(/[^0-9.]/g, "") })} inputMode="decimal" placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className={`mb-1 block text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Category</label>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputClass}>
                {RECEIPT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={`mb-1 block text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Date</label>
              <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => { setDraft(null); setScanNote(""); }} className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5" : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"}>Cancel</button>
            <button onClick={saveDraft} disabled={!draft.vendor.trim() && !draft.amount} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50">Save receipt</button>
          </div>
        </section>
      )}

      {/* Insights */}
      <section className="grid gap-4 md:grid-cols-3">
        <Metric isDark={isDark} icon={DollarSign} label="Total tracked" value={currency.format(insights.total)} note={`${insights.count} receipt${insights.count === 1 ? "" : "s"}`} />
        <Metric isDark={isDark} icon={BarChart3} label="This month" value={currency.format(insights.thisMonth)} note={new Date().toLocaleDateString("en-US", { month: "long" })} />
        <Metric isDark={isDark} icon={FileText} label="Top category" value={insights.topCategory ? insights.topCategory[0] : "—"} note={insights.topCategory ? currency.format(insights.topCategory[1]) : "No spend yet"} />
      </section>

      {/* Category breakdown */}
      {insights.ranked.length > 0 && (
        <section className={card}>
          <h2 className={`text-sm font-black uppercase tracking-wide ${mutedText}`}>Spend by category</h2>
          <div className="mt-3 space-y-2">
            {insights.ranked.map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className={`w-32 shrink-0 text-sm font-bold ${titleText}`}>{cat}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-500/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${insights.total ? Math.round((amt / insights.total) * 100) : 0}%` }} />
                </div>
                <span className={`w-20 shrink-0 text-right text-sm font-black ${titleText}`}>{currency.format(amt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {all.length === 0 && (
        <EmptyState
          isDark={isDark}
          eyebrow="Expense proof"
          title="No receipts yet"
          description="Scan a receipt with AI, add one manually, or upload from the mobile app. Tracked expenses roll into your spend insights."
          Icon={Camera}
          primaryAction={{ label: "Scan a receipt", onClick: () => fileRef.current?.click() }}
          secondaryActions={[{ label: "Open Intake", onClick: () => navigateToTab?.("Intake") }]}
        />
      )}

      {/* List */}
      {all.length > 0 && (
        <section className={card}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className={`text-xl font-bold ${titleText}`}>All receipts</h2>
            <div className="flex flex-wrap gap-2">
              {["All", ...RECEIPT_CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={filter === c ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black text-white" : isDark ? "rounded-full border border-white/10 px-3 py-1.5 text-xs font-black text-slate-300 hover:bg-white/5" : "rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className={`${soft} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-base font-black ${titleText}`}>{r.vendor}</p>
                    {r.source === "mobile" && <span className={isDark ? "rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-300" : "rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600"}>Mobile</span>}
                    {r.source === "scan" && <span className="rounded-full bg-blue-600/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-600">AI</span>}
                  </div>
                  <p className={`mt-0.5 text-xs font-bold ${mutedText}`}>{fmtDate(r.date)}{r.notes ? ` · ${r.notes}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  {r.source === "mobile" ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{r.category}</span>
                  ) : (
                    <select
                      value={r.category}
                      onChange={(e) => updateReceipt(r.id, { category: e.target.value })}
                      className={isDark ? "rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-xs font-bold text-slate-200" : "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700"}
                    >
                      {RECEIPT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  <span className="text-xl font-black text-emerald-600">{currency.format(r.amount || 0)}</span>
                  {r.source !== "mobile" && (
                    <button onClick={() => removeReceipt(r.id)} aria-label="Delete receipt" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className={`py-6 text-center text-sm font-semibold ${mutedText}`}>No receipts in “{filter}”. <button onClick={() => setFilter("All")} className="font-black text-blue-600">Show all</button></p>
            )}
          </div>
          {mobileStatus && mobile.length === 0 && <p className={`mt-3 text-[11px] font-semibold ${mutedText}`}>Mobile sync: {mobileStatus}</p>}
        </section>
      )}
    </div>
  );
}

function Metric({ isDark, icon: Icon, label, value, note }) {
  return (
    <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
      <div className="flex items-center gap-3">
        <div className={isDark ? "rounded-2xl bg-blue-500/10 p-3 text-blue-300" : "rounded-2xl bg-blue-50 p-3 text-blue-600"}><Icon className="h-5 w-5" /></div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      </div>
      <p className={`safe-number mt-4 text-3xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>{value}</p>
      <p className={`mt-1 text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{note}</p>
    </div>
  );
}
