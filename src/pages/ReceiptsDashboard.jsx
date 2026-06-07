import React, { useEffect, useMemo, useState } from "react";
import { Camera, currency, DollarSign, FileText, Skeleton, Upload } from "../shared";
import { loadVaultDocumentsFromSupabase } from "../lib/documentRepository";
import EmptyState, { InlineEmpty } from "../components/EmptyState";

const receiptCategories = ["All", "Gas", "Tools", "Maintenance", "Parking/Tolls", "Other"];

function parseReceipt(doc) {
  const notes = doc.notes || "";
  const amount = Number(notes.match(/Amount:\s*([0-9.]+)/i)?.[1] || 0);
  const vendor = notes.match(/Vendor:\s*([^|]+)/i)?.[1]?.trim() || doc.name?.replace(/.*receipt\s*-\s*/i, "") || "Unknown";
  const type = notes.match(/^([^|]+?) expense/i)?.[1]?.trim() || "Other";

  return {
    ...doc,
    amount,
    vendor,
    type,
    uploadedAt: doc.uploaded_at ? new Date(doc.uploaded_at) : null,
  };
}

export default function ReceiptsDashboard({ isDark, isBlankDemo = false, isDemoMode = false, navigateToTab }) {
  const [receipts, setReceipts] = useState([]);
  const [status, setStatus] = useState("No receipts yet — they appear here once uploaded from the mobile app or entered in Intake.");
  const [filter, setFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadReceipts() {
      const result = await loadVaultDocumentsFromSupabase();
      if (!isMounted) return;

      if (result.ok) {
        const remoteReceipts = result.documents
          .filter((doc) => doc.category === "Expense Receipts")
          .map(parseReceipt);
        if (remoteReceipts.length) {
          setReceipts(remoteReceipts);
          setStatus("Live mobile receipts synced from Supabase.");
        } else {
          setStatus("No receipts yet — they appear here once uploaded from the mobile app or entered in Intake.");
        }
      } else {
        setReceipts([]);
        setStatus(`No live receipts loaded yet. ${result.error}`);
      }
      setIsLoading(false);
    }

    loadReceipts();
    return () => {
      isMounted = false;
    };
  }, [isBlankDemo, isDemoMode]);

  const filteredReceipts = receipts.filter((receipt) => filter === "All" || receipt.type === filter);
  const totalExpenses = filteredReceipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
  const gasTotal = receipts.filter((receipt) => receipt.type === "Gas").reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
  const toolsTotal = receipts.filter((receipt) => receipt.type === "Tools").reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);

  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const softPanel = isDark ? "rounded-2xl border border-white/10 bg-white/5" : "rounded-2xl border border-slate-200 bg-slate-50";

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Expense Receipts</p>
            <h1 className={`mt-2 text-4xl font-black tracking-tight ${titleText}`}>Receipts</h1>
            <p className={`mt-2 max-w-3xl text-sm font-semibold ${mutedText}`}>
              Gas, tools, maintenance, parking, and toll receipts uploaded from the mobile app show here.
            </p>
            <p className={`mt-2 text-xs font-bold ${mutedText}`}>{status}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm">
            <Camera className="h-4 w-4" />
            Mobile uploads feed this page
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard isDark={isDark} icon={DollarSign} label="Receipt Expenses" value={currency.format(totalExpenses)} note={`${filteredReceipts.length} receipt${filteredReceipts.length === 1 ? "" : "s"} shown`} />
        <MetricCard isDark={isDark} icon={Upload} label="Gas Spend" value={currency.format(gasTotal)} note="Fuel receipts from mobile" />
        <MetricCard isDark={isDark} icon={FileText} label="Tools Spend" value={currency.format(toolsTotal)} note="Tools and supplies" />
      </section>

      {!isLoading && receipts.length === 0 && (
        <EmptyState
          isDark={isDark}
          eyebrow="Expense proof"
          title="No receipts uploaded yet"
          description="Receipts for gas, tools, maintenance, parking, tolls, and other owner expenses will appear here after they are uploaded from the mobile app or entered through Intake."
          Icon={Camera}
          primaryAction={{ label: "Open Intake", onClick: () => navigateToTab?.("Intake") }}
          secondaryActions={[
            { label: "Review Mobile Setup", onClick: () => navigateToTab?.("Settings") },
            { label: "View Profitability", onClick: () => navigateToTab?.("Profitability") },
          ]}
        />
      )}

      <section className={cardClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={`text-xl font-bold ${titleText}`}>Receipt Inbox</h2>
            <p className={`mt-1 text-sm font-semibold ${mutedText}`}>Review what came from the phone before it affects route profit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {receiptCategories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={
                  filter === category
                    ? "rounded-full bg-blue-600 px-3 py-2 text-xs font-black text-white"
                    : isDark
                      ? "rounded-full border border-white/10 px-3 py-2 text-xs font-black text-slate-300"
                      : "rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600"
                }
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${softPanel} p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-40 rounded" />
                      <Skeleton className="h-4 w-56 rounded" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </>
          )}
          {!isLoading && filteredReceipts.map((receipt) => (
            <div key={receipt.id} className={`${softPanel} p-4`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-lg font-bold ${titleText}`}>{receipt.vendor}</p>
                  <p className={`mt-1 text-sm font-bold ${mutedText}`}>
                    {receipt.type} · {receipt.uploadedAt ? receipt.uploadedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Uploaded"}
                  </p>
                  <p className={`mt-2 text-xs font-semibold ${mutedText}`}>{receipt.notes}</p>
                </div>
                <p className="text-2xl font-black text-emerald-600">{currency.format(receipt.amount || 0)}</p>
              </div>
            </div>
          ))}
          {!isLoading && !filteredReceipts.length && (
            <div className={`${softPanel} p-2 text-center`}>
              <InlineEmpty
                isDark={isDark}
                Icon={Camera}
                title="No receipts in this filter yet"
                hint="Choose All, or use the mobile Receipts tab to upload one."
              />
              {filter !== "All" && (
                <button type="button" onClick={() => setFilter("All")} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
                  Show All Receipts
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ isDark, icon: Icon, label, value, note }) {
  return (
    <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
      <div className="flex items-center gap-3">
        <div className={isDark ? "rounded-2xl bg-blue-500/10 p-3 text-blue-300" : "rounded-2xl bg-blue-50 p-3 text-blue-600"}>
          <Icon className="h-5 w-5" />
        </div>
        <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-slate-400" : "text-xs font-semibold uppercase tracking-wide text-slate-500"}>{label}</p>
      </div>
      <p className={isDark ? "mt-4 text-3xl font-black text-white" : "mt-4 text-3xl font-black text-slate-950"}>{value}</p>
      <p className={isDark ? "mt-1 text-sm font-bold text-slate-400" : "mt-1 text-sm font-bold text-slate-500"}>{note}</p>
    </div>
  );
}
