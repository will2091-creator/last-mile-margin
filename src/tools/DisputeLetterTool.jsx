import { editingDraft } from "../journey/draft";
import { cleanNum, money2 } from "./format";
import { useRef, useState } from "react";
import { claimTypeOptions } from "../lib/claimTypes";
import { CATEGORIES, EVIDENCE, FAULT_OPTIONS, REQUESTS, buildDisputeLetter, forCategory } from "./lib/disputeLetter";
import { useInView } from "./useInView";
import { useToolState } from "./useToolState";
import { CheckRow, FieldGrid, Notes, MobileSummary, ResultNav, NumberField, Panel, Segmented, SelectField, TextField } from "./ui";
import ToolUpgrade from "./ToolUpgrade";

// Sender details are remembered on this device; claim details are not.
const SENDER_DEFAULTS = { company: "", name: "", title: "", phone: "", email: "" };

const CLAIM_DEFAULTS = {
  category: "Cargo",
  claimType: "Product damage",
  claimId: "",
  amount: "",
  deliveryDate: "",
  reportedDate: "",
  orderRef: "",
  recipient: "Claims Department",
  recipientEmail: "",
  fault: "unsure",
  evidence: [],
  requests: [],
  responseDays: "10",
};

const fileSafe = (text) => String(text || "claim").replace(/[^a-z0-9-]+/gi, "-").slice(0, 40);

export default function DisputeLetterTool() {
  const sender = useToolState("lmm-tool-dispute-sender", SENDER_DEFAULTS, { useSharedInputs: false });
  const [claim, setClaim] = useState(() => editingDraft()?.payload.inputs || CLAIM_DEFAULTS);
  const [override, setOverride] = useState(() => editingDraft()?.payload.editedLetter ?? null);
  const [status, setStatus] = useState("");
  const resultsRef = useRef(null);
  const resultsInView = useInView(resultsRef);

  const setField = (key, value) => setClaim((current) => ({ ...current, [key]: value }));
  const toggle = (key, id, on) =>
    setClaim((current) => ({ ...current, [key]: on ? [...new Set([...current[key], id])] : current[key].filter((x) => x !== id) }));

  const letter = buildDisputeLetter({ ...claim, ...sender.values });
  const text = override ?? letter.body;
  const edited = override != null && override !== letter.body;

  const flash = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${letter.subject}\n\n${text}`);
      flash("Letter copied.");
    } catch {
      flash("Couldn't copy. Select the text and copy it instead.");
    }
  };

  const download = () => {
    const blob = new Blob([`Subject: ${letter.subject}\n\n${text}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dispute-letter-${fileSafe(claim.claimId)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    document.body.classList.add("print-letter");
    window.addEventListener("afterprint", () => document.body.classList.remove("print-letter"), { once: true });
    window.print();
  };

  const to = claim.recipientEmail.replace(/[^\w.@+-]/g, "");
  const mailto = `mailto:${to}?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(text)}`;

  const types = claimTypeOptions[claim.category] || [];

  return (
    <div className="calculator-layout calculator-layout-letter">
      <MobileSummary show={!resultsInView} label="Dispute letter" action="View draft" />
      <div id="inputs" tabIndex={-1} className="calculator-inputs">
        <Panel title="The claim">
          <div className="space-y-4">
            <Segmented
              label="What kind of claim"
              value={claim.category}
              onChange={(value) =>
                setClaim((current) => ({ ...current, category: value, claimType: (claimTypeOptions[value] || [])[0] || "", evidence: [], requests: [] }))
              }
              options={CATEGORIES}
            />
            <FieldGrid>
              <SelectField label="Claim type" value={claim.claimType} onChange={(value) => setField("claimType", value)} options={types} wide />
              <TextField label="Claim number" value={claim.claimId} onChange={(value) => setField("claimId", value)} placeholder="e.g. CLM-48213" />
              <NumberField label="Amount deducted" value={claim.amount} onChange={(value) => setField("amount", value)} prefix="$" placeholder="450" />
              <TextField label="Order, PO, or route number" value={claim.orderRef} onChange={(value) => setField("orderRef", value)} placeholder="Optional" />
              <TextField label="Delivery date" type="date" value={claim.deliveryDate} onChange={(value) => setField("deliveryDate", value)} />
              {claim.category !== "Penalty" && (
                <TextField
                  label="Date they reported it"
                  type="date"
                  value={claim.reportedDate}
                  onChange={(value) => setField("reportedDate", value)}
                  hint="Include the date shown on the claim notice."
                />
              )}
            </FieldGrid>
          </div>
        </Panel>

        <Panel title="What happened">
          <Segmented label="Was your crew at fault?" value={claim.fault} onChange={(value) => setField("fault", value)} options={FAULT_OPTIONS} />
          {["partial", "yes"].includes(claim.fault) && (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The letter asks them to reverse any unsupported charge and document the basis and amount of any remaining charge.
            </p>
          )}
        </Panel>

        <Panel title="Proof you have" description="Only what you check goes in the letter.">
          <div className="grid gap-2">
            {forCategory(EVIDENCE, claim.category).map((item) => (
              <CheckRow
                key={item.id}
                label={item.label}
                hint={item.hint}
                checked={claim.evidence.includes(item.id)}
                onChange={(on) => toggle("evidence", item.id, on)}
              />
            ))}
          </div>
        </Panel>

        <Panel title="What to ask them for" description="Anything they haven't shown you yet.">
          <div className="grid gap-2">
            {forCategory(REQUESTS, claim.category).map((item) => (
              <CheckRow key={item.id} label={item.label} checked={claim.requests.includes(item.id)} onChange={(on) => toggle("requests", item.id, on)} />
            ))}
          </div>
          <div className="mt-4 max-w-[220px]">
            <NumberField label="Ask for a reply within" value={claim.responseDays} onChange={(value) => setField("responseDays", value)} suffix="bus. days" />
          </div>
        </Panel>

        <Panel title="Who it's to and from" description="Your details are saved on this device for next time.">
          <FieldGrid>
            <TextField label="Send to" value={claim.recipient} onChange={(value) => setField("recipient", value)} placeholder="Claims Department" />
            <TextField label="Their email (optional)" type="email" value={claim.recipientEmail} onChange={(value) => setField("recipientEmail", value)} />
            <TextField label="Your company" value={sender.values.company} onChange={(value) => sender.set("company", value)} autoComplete="organization" />
            <TextField label="Your name" value={sender.values.name} onChange={(value) => sender.set("name", value)} autoComplete="name" />
            <TextField label="Your title" value={sender.values.title} onChange={(value) => sender.set("title", value)} placeholder="Owner" />
            <TextField label="Phone" type="tel" value={sender.values.phone} onChange={(value) => sender.set("phone", value)} autoComplete="tel" />
            <TextField label="Email" type="email" value={sender.values.email} onChange={(value) => sender.set("email", value)} autoComplete="email" wide />
          </FieldGrid>
        </Panel>
      </div>

      <div ref={resultsRef} id="results" tabIndex={-1} className="calculator-results">
        <ResultNav />
        <Panel title="Your letter" className="result-panel letter-panel">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Subject</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{letter.subject}</p>
          <label htmlFor="letter-body" className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Letter (you can edit it)
          </label>
          <textarea
            id="letter-body"
            value={text}
            onChange={(event) => setOverride(event.target.value)}
            rows={18}
            className="letter-draft"
          />
          {edited && (
            <p className="mt-2 text-xs leading-5 text-amber-700">
              You've edited the letter, so form changes won't show up.{" "}
              <button type="button" onClick={() => setOverride(null)} className="font-bold underline">
                Rebuild from the form
              </button>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="site-button site-button-small">
              Copy letter
            </button>
            <a href={mailto} className="site-button site-button-quiet site-button-small">
              Open in email
            </a>
            <button type="button" onClick={download} className="site-button site-button-quiet site-button-small">
              Download .txt
            </button>
            <button type="button" onClick={print} className="site-button site-button-quiet site-button-small">
              Print
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold text-emerald-700" role="status" aria-live="polite">
            {status}
          </p>
        </Panel>

        <ToolUpgrade source="chargeback-dispute-letter" example={JSON.stringify(claim) === JSON.stringify(CLAIM_DEFAULTS) && JSON.stringify(sender.values) === JSON.stringify(SENDER_DEFAULTS) && override == null} payload={{
          kind: "claim", title: claim.claimId ? "Claim " + claim.claimId : "Chargeback dispute", inputs: claim, letter: text, editedLetter: override, subject: letter.subject,
          metrics: [["Claim reference", claim.claimId || "Unassigned"], ["Disputed amount", claim.amount ? money2(cleanNum(claim.amount)) : "Unspecified"]],
        }} />

        <Panel title="Your strongest argument">
          <p className="text-sm leading-6 text-slate-700">{letter.angle}</p>
        </Panel>

        {letter.gaps.length > 0 && (
          <Panel title="Make it stronger">
            <Notes items={letter.gaps} tone="info" />
          </Panel>
        )}
      </div>

      <pre className="letter-print hidden whitespace-pre-wrap font-sans text-[12pt] leading-relaxed text-black">{`Subject: ${letter.subject}\n\n${text}`}</pre>
    </div>
  );
}
