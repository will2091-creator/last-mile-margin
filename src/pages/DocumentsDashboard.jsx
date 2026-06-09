import { DocumentVaultTable } from "../components/ProfitPlatformWidgets";

// Business-wide "filing cabinet": COI, formation docs, W-9, permits, and any
// other paperwork. Files upload to Supabase Storage (documents bucket) and are
// listed/organized via the documents table — all owner-scoped by RLS.
export default function DocumentsDashboard({ isDark }) {
  return (
    <div className={isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950"}>
      <div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Documents</h1>
        <p className={`mt-2 max-w-3xl text-sm sm:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Your business filing cabinet. Upload your Certificate of Insurance (COI), formation
          documents, W-9, permits, and any other paperwork — stored securely in the cloud and
          organized by category so it's ready when a retailer asks for it.
        </p>
      </div>
      <DocumentVaultTable documents={[]} isDark={isDark} />
    </div>
  );
}
