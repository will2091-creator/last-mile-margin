import { useEffect, useRef, useState } from "react";
import { FileText, Upload } from "../shared";
import { InlineEmpty } from "./EmptyState";
import { loadVaultDocumentsFromSupabase, uploadVaultDocument } from "../lib/documentRepository";

const toneClasses = (isDark) => ({
  baseCard: isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
  softCard: isDark
    ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4"
    : "rounded-2xl border border-slate-200 bg-slate-50/80 p-4",
  title: isDark ? "text-white" : "text-slate-950",
  muted: isDark ? "text-slate-400" : "text-slate-500",
  row: isDark ? "border-white/10" : "border-slate-200",
});

const severityClass = (severity, isDark) => {
  if (severity === "Critical") return isDark ? "bg-red-500/15 text-red-200" : "bg-red-50 text-red-700";
  if (severity === "High") return isDark ? "bg-orange-500/15 text-orange-200" : "bg-orange-50 text-orange-700";
  if (severity === "Medium") return isDark ? "bg-amber-500/15 text-amber-200" : "bg-amber-50 text-amber-700";
  return isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-50 text-emerald-700";
};

const statusClass = (status, isDark) => {
  if (status === "Resolved" || status === "Uploaded" || status === "Healthy") return isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-50 text-emerald-700";
  if (status === "In Progress" || status === "Expiring Soon" || status === "Watch") return isDark ? "bg-amber-500/15 text-amber-200" : "bg-amber-50 text-amber-700";
  if (status === "Missing" || status === "Expired" || status === "Critical" || status === "At Risk") return isDark ? "bg-red-500/15 text-red-200" : "bg-red-50 text-red-700";
  return isDark ? "bg-blue-500/15 text-blue-200" : "bg-blue-50 text-blue-700";
};

const documentCategoryOptions = [
  "Business Documents",
  "Insurance",
  "DOT Documents",
  "Driver Files",
  "Rate Cards",
  "Retailer Compliance Documents",
  "Vehicle Documents",
  "Claims Documents",
  "Other Documents",
];

const loadVaultDocuments = (documents) => {
  try {
    const saved = localStorage.getItem("finalMileDocumentVault");
    if (!saved) return documents;
    const savedDocuments = JSON.parse(saved);
    const mergedMockDocuments = documents.map((doc) => ({
      ...doc,
      ...(savedDocuments.find((savedDoc) => savedDoc.id === doc.id) || {}),
    }));
    const uploadedDocuments = savedDocuments.filter((savedDoc) => !documents.some((doc) => doc.id === savedDoc.id));
    return [...uploadedDocuments, ...mergedMockDocuments];
  } catch {
    return documents;
  }
};

const saveVaultDocuments = (documents) => {
  try {
    localStorage.setItem("finalMileDocumentVault", JSON.stringify(documents));
    window.dispatchEvent(new CustomEvent("finalMileDocumentVaultUpdated", { detail: documents }));
  } catch {
    // Local storage is best-effort in this frontend-only mock.
  }
};

const fromSupabaseDocument = (doc) => ({
  id: doc.id,
  name: doc.name,
  category: doc.category || "Other Documents",
  required: Boolean(doc.required),
  status: doc.status || "Uploaded",
  expiration: doc.expiration || "N/A",
  owner: doc.owner || "Will's Fleet",
  notes: doc.notes || "",
  uploadedFileName: doc.file_name || doc.name,
  uploadedAt: doc.uploaded_at,
  filePath: doc.file_path,
});

const getMockDocument = (doc) => {
  const issueDate = doc.expiration === "N/A" || doc.expiration === "Missing" ? "Jan 1, 2026" : "Jan 1, 2026";
  const documentNumber = `${doc.category.slice(0, 3).toUpperCase()}-${doc.id.replace("doc-", "").toUpperCase()}-2026`;
  const commonDetails = [
    ["Document ID", documentNumber],
    ["Owner", doc.owner],
    ["Category", doc.category],
    ["Status", doc.status],
    ["Expiration", doc.expiration],
    ["Required", doc.required ? "Yes" : "No"],
  ];

  const bodyByCategory = {
    "Business Documents": [
      "This mock file represents company verification paperwork stored for contractor onboarding and retailer compliance review.",
      "Business name, operating entity, tax identification, and authorized owner information would be stored here once backend document storage is connected.",
      "Use this preview to confirm the vault flow before uploading real files.",
    ],
    Insurance: [
      "This mock insurance certificate confirms policy coverage, insured entity, coverage type, and certificate holder details.",
      "Retailers normally review this file before dispatch approval, contract renewal, and route activation.",
      "Expiration reminders should be triggered before the date shown in the document vault.",
    ],
    "DOT Documents": [
      "This mock DOT inspection record shows vehicle inspection status, truck identifier, inspection date, and renewal requirements.",
      "Expired DOT records should be treated as dispatch blockers until a new document is uploaded.",
      "Attach inspection evidence here to keep compliance review simple.",
    ],
    "Driver Files": [
      "This mock driver file tracks required driver paperwork, including medical card, MVR, and eligibility documents.",
      "Missing driver paperwork should be reviewed before the driver is assigned to active routes.",
      "Use the owner field to connect the document to the right driver.",
    ],
    "Rate Cards": [
      "This mock rate card stores contract pricing terms, route pay, accessorial charges, and renewal assumptions.",
      "Rate cards should connect back to profitability so margin calculations use the correct contract terms.",
      "Renewal notes and pricing changes can be attached here later.",
    ],
    "Retailer Compliance Documents": [
      "This mock retailer packet stores service requirements, delivery rules, photo requirements, and claim handling procedures.",
      "Retailer compliance packets help teams understand what must happen before, during, and after delivery.",
      "Use this as the source of truth for retailer-specific operating requirements.",
    ],
  };

  return {
    issueDate,
    documentNumber,
    details: commonDetails,
    body: bodyByCategory[doc.category] || bodyByCategory["Business Documents"],
  };
};

export function DocumentVaultTable({ documents, isDark }) {
  const styles = toneClasses(isDark);
  const fileInputRef = useRef(null);
  const [vaultDocuments, setVaultDocuments] = useState(() => loadVaultDocuments(documents));
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const selectedMockDocument = selectedDocument ? getMockDocument(selectedDocument) : null;
  const categoryCounts = vaultDocuments.reduce(
    (counts, doc) => ({
      ...counts,
      [doc.category]: (counts[doc.category] || 0) + 1,
    }),
    {}
  );
  const filteredVaultDocuments =
    selectedCategory === "All"
      ? vaultDocuments
      : vaultDocuments.filter((doc) => doc.category === selectedCategory);

  const openDocument = (doc) => setSelectedDocument(doc);
  const closeDocument = () => setSelectedDocument(null);
  useEffect(() => {
    let isMounted = true;

    const loadRemoteDocuments = async () => {
      const result = await loadVaultDocumentsFromSupabase();
      if (!isMounted || !result.ok || !result.documents.length) return;

      setVaultDocuments((current) => {
        const remoteDocuments = result.documents.map(fromSupabaseDocument);
        const mockDocuments = current.filter((doc) => !doc.filePath && !String(doc.id).startsWith("doc-upload"));
        const next = [...remoteDocuments, ...mockDocuments.filter((doc) => !remoteDocuments.some((remoteDoc) => remoteDoc.id === doc.id))];
        saveVaultDocuments(next);
        return next;
      });
    };

    loadRemoteDocuments();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUploadDocuments = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    const uploadedDocuments = [];
    const failedUploads = [];

    for (const file of files) {
      const result = await uploadVaultDocument({
        file,
        category: "Other Documents",
        owner: "Will's Fleet",
      });

      if (result.ok) {
        uploadedDocuments.push(fromSupabaseDocument(result.document));
      } else {
        failedUploads.push(`${file.name}: ${result.error}`);
      }
    }

    if (uploadedDocuments.length) {
      setVaultDocuments((current) => {
        const next = [...uploadedDocuments, ...current.filter((doc) => !uploadedDocuments.some((uploadedDoc) => uploadedDoc.id === doc.id))];
        saveVaultDocuments(next);
        return next;
      });
      setSelectedCategory("All");
    }

    if (failedUploads.length) {
      setUploadMessage(`Uploaded ${uploadedDocuments.length} document${uploadedDocuments.length === 1 ? "" : "s"}. ${failedUploads.join(" ")}`);
    } else {
      setUploadMessage(`${uploadedDocuments.length} document${uploadedDocuments.length === 1 ? "" : "s"} uploaded to Supabase Storage. Use the Category dropdown to organize them.`);
    }

    setIsUploading(false);
    event.target.value = "";
  };
  const updateDocumentCategory = (docId, category) => {
    setVaultDocuments((current) => {
      const next = current.map((doc) => (doc.id === docId ? { ...doc, category } : doc));
      saveVaultDocuments(next);
      if (selectedDocument?.id === docId) {
        setSelectedDocument(next.find((doc) => doc.id === docId));
      }
      return next;
    });
  };

  return (
    <div className={styles.baseCard}>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Document Vault</p>
          <h2 className={`mt-1 text-xl font-bold ${styles.title}`}>Business and compliance documents</h2>
          <p className={`mt-2 text-sm ${styles.muted}`}>Upload files here, then use the Category dropdown to organize each document.</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUploadDocuments}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Documents"}
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className={isDark ? "mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100" : "mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"}>
          {uploadMessage}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("All")}
          className={
            selectedCategory === "All"
              ? "rounded-full bg-blue-600 px-3 py-2 text-xs font-black text-white"
              : isDark
                ? "rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-300 hover:bg-white/10"
                : "rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
          }
        >
          All Documents <span className="ml-1 opacity-75">{vaultDocuments.length}</span>
        </button>

        {documentCategoryOptions.map((category) => {
          const count = categoryCounts[category] || 0;
          const isActive = selectedCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={
                isActive
                  ? "rounded-full bg-blue-600 px-3 py-2 text-xs font-black text-white"
                  : isDark
                    ? "rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-300 hover:bg-white/10"
                    : "rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
              }
            >
              {category} <span className="ml-1 opacity-75">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className={`border-b text-xs uppercase tracking-wide ${styles.muted} ${styles.row}`}>
            <tr>
              <th className="py-3 pr-4">Document</th>
              <th className="py-3 pr-4">Category</th>
              <th className="py-3 pr-4">Required</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Expiration</th>
              <th className="py-3 pr-4">Owner</th>
              <th className="py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVaultDocuments.map((doc) => (
              <tr
                key={doc.id}
                role="button"
                tabIndex={0}
                onClick={() => openDocument(doc)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDocument(doc);
                  }
                }}
                className={`cursor-pointer border-b transition ${styles.row} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/50"}`}
              >
                <td className="py-4 pr-4">
                  <div className="flex items-start gap-3">
                    <span className={isDark ? "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-200" : "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <span>
                      <p className={`font-black ${styles.title}`}>{doc.name}</p>
                      <p className={`mt-1 text-xs ${styles.muted}`}>{doc.notes}</p>
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <select
                    value={doc.category}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => updateDocumentCategory(doc.id, event.target.value)}
                    className={isDark ? "w-full min-w-52 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-black text-slate-200 outline-none focus:border-blue-500" : "w-full min-w-52 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 outline-none focus:border-blue-500"}
                  >
                    {documentCategoryOptions.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </td>
                <td className={`py-4 pr-4 font-bold ${styles.title}`}>{doc.required ? "Required" : "Optional"}</td>
                <td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(doc.status, isDark)}`}>{doc.status}</span></td>
                <td className={`py-4 pr-4 ${styles.muted}`}>{doc.expiration}</td>
                <td className={`py-4 pr-4 font-semibold ${styles.title}`}>{doc.owner}</td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openDocument(doc);
                    }}
                    className={isDark ? "rounded-lg border border-blue-500/30 px-3 py-1.5 text-xs font-black text-blue-200 hover:bg-blue-500/10" : "rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-50"}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filteredVaultDocuments.length === 0 && (
              <tr>
                <td colSpan="7" className="px-2">
                  <InlineEmpty
                    isDark={isDark}
                    Icon={FileText}
                    title="No documents in this category yet"
                    hint="Switch categories above, or upload a document to start building this vault."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDocument && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={closeDocument}
        >
          <div
            className={isDark ? "max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50" : "max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={isDark ? "flex items-start justify-between gap-4 border-b border-white/10 p-5" : "flex items-start justify-between gap-4 border-b border-slate-200 p-5"}>
              <div className="flex min-w-0 items-start gap-4">
                <div className={isDark ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-200" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"}>
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Document Preview</p>
                  <h3 className={`mt-1 truncate text-2xl font-black ${styles.title}`}>{selectedDocument.name}</h3>
                  <p className={`mt-1 text-sm ${styles.muted}`}>{selectedDocument.owner} · {selectedDocument.category}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDocument}
                className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/10" : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Close
              </button>
            </div>

            <div className="grid max-h-[calc(90vh-96px)] overflow-y-auto lg:grid-cols-[320px_1fr]">
              <aside className={isDark ? "border-b border-white/10 p-5 lg:border-b-0 lg:border-r" : "border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r"}>
                <div className="space-y-3">
                  {selectedMockDocument.details.map(([label, value]) => (
                    <div key={label} className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-slate-200 bg-white p-4"}>
                      <p className={`text-[11px] font-semibold uppercase tracking-wide ${styles.muted}`}>{label}</p>
                      <p className={`mt-1 text-sm font-black ${styles.title}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </aside>

              <section className={isDark ? "bg-slate-900 p-5" : "bg-slate-100 p-5"}>
                <div className="mx-auto min-h-[680px] max-w-2xl rounded-2xl bg-white p-8 text-slate-950 shadow-xl">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Final Mile Margin</p>
                      <h4 className="mt-3 text-3xl font-black leading-tight">{selectedDocument.name}</h4>
                      <p className="mt-2 text-sm font-semibold text-slate-500">Mock stored document preview</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(selectedDocument.status, false)}`}>
                      {selectedDocument.status}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Document Number", selectedMockDocument.documentNumber],
                      ["Issued", selectedMockDocument.issueDate],
                      ["Owner", selectedDocument.owner],
                      ["Expiration", selectedDocument.expiration],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                        <p className="mt-1 text-sm font-black">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-5">
                    {selectedMockDocument.body.map((paragraph) => (
                      <p key={paragraph} className="text-sm font-semibold leading-7 text-slate-700">{paragraph}</p>
                    ))}
                  </div>

                  <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-5">
                    <p className="text-sm font-black">Compliance Review</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      This is a mock document so you can test the vault experience. When backend storage is connected, this preview area can render the uploaded PDF, image, or document file.
                    </p>
                  </div>

                  <div className="mt-10 flex items-end justify-between border-t border-slate-200 pt-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verified By</p>
                      <p className="mt-2 font-black">Will's Fleet Admin</p>
                    </div>
                    <div className="rounded-xl border-2 border-emerald-600 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                      Mock File
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ComplianceRiskPanel({ documents, risks, isDark }) {
  const styles = toneClasses(isDark);
  const [vaultDocuments, setVaultDocuments] = useState(() => loadVaultDocuments(documents));

  useEffect(() => {
    const handleVaultUpdate = (event) => {
      setVaultDocuments(Array.isArray(event.detail) ? event.detail : loadVaultDocuments(documents));
    };

    window.addEventListener("finalMileDocumentVaultUpdated", handleVaultUpdate);
    return () => window.removeEventListener("finalMileDocumentVaultUpdated", handleVaultUpdate);
  }, [documents]);

  const missingRequired = vaultDocuments.filter((doc) => doc.required && ["Missing", "Expired"].includes(doc.status));
  const expiringSoon = vaultDocuments.filter((doc) => doc.status === "Expiring Soon");
  const complianceScore = Math.max(0, 100 - missingRequired.length * 14 - expiringSoon.length * 6);

  return (
    <div className={styles.baseCard}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Compliance Risk Panel</p>
          <h2 className={`mt-1 text-xl font-bold ${styles.title}`}>Document-driven compliance</h2>
          <p className={`mt-2 text-sm ${styles.muted}`}>Score is mocked from document status and team readiness.</p>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-black ${complianceScore >= 85 ? "text-emerald-700" : complianceScore >= 70 ? "text-amber-600" : "text-red-600"}`}>{complianceScore}%</p>
          <p className={`text-xs font-black ${styles.muted}`}>Compliance score</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Missing required", missingRequired.length],
          ["Expiring soon", expiringSoon.length],
          ["Critical risks", risks.filter((risk) => risk.severity === "Critical").length],
        ].map(([label, value]) => (
          <div key={label} className={styles.softCard}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${styles.muted}`}>{label}</p>
            <p className={`mt-1 text-2xl font-black ${styles.title}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {risks.map((risk) => (
          <div key={risk.id} className={styles.softCard}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`font-black ${styles.title}`}>{risk.title}</p>
                <p className={`mt-1 text-sm ${styles.muted}`}>{risk.detail}</p>
                <p className={`mt-2 text-xs font-black ${styles.title}`}>Next: {risk.action}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${severityClass(risk.severity, isDark)}`}>{risk.severity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
