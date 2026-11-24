import { useEffect, useRef, useState } from "react";
import { prepareDraft, pruneDrafts, visitId } from "../journey/draft";
import { ResultPreview } from "../journey/ResultPreview";
import "../journey/journey.css";

const actions = {
  "route-profit-calculator": "Save this route",
  "contract-rate-checker": "Save this offer",
  "chargeback-dispute-letter": "Track this claim",
  "driver-pay-calculator": "Save this crew plan",
};

async function record(source, event) {
  const origin = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!origin || !key) return false;
  try {
    const response = await fetch(origin + "/rest/v1/rpc/record_tool_visit", {
      method: "POST", keepalive: true, referrerPolicy: "no-referrer",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ visit: visitId(source), tool: source, step: event }),
    });
    return response.ok;
  } catch { return false; }
}

export default function ToolUpgrade({ source, payload, example }) {
  const [error, setError] = useState("");
  const completed = useRef(false);
  const interacted = useRef(false);
  const root = useRef(null);

  useEffect(() => {
    pruneDrafts();
    const input = () => { interacted.current = true; };
    const form = document.querySelector("#inputs");
    form?.addEventListener("input", input);
    root.current?.closest("#results")?.addEventListener("input", input);
    const results = root.current?.closest("#results");
    return () => {
      form?.removeEventListener("input", input);
      results?.removeEventListener("input", input);
    };
  }, []);

  useEffect(() => {
    if (example || !interacted.current || completed.current) return;
    const timer = setTimeout(async () => {
      if (!document.querySelector('[aria-invalid="true"]')) completed.current = await record(source, "completed");
    }, 600);
    return () => clearTimeout(timer);
  }, [example, payload, source]);

  function start() {
    if (document.querySelector('[aria-invalid="true"]')) {
      setError("Correct the highlighted input before saving.");
      return;
    }
    try {
      const draft = prepareDraft(source, payload, example);
      if (!example) void record(source, "completed");
      void record(source, "chosen");
      location.assign(`/?auth=signup&from=${source}&resume=${draft.id}`);
    } catch {
      setError("Your browser couldn’t keep this draft. Allow site storage and try again.");
    }
  }
  return <section className="tool-upgrade" ref={root}>
    <ResultPreview payload={payload} example={example} heading="h3" />
    <div className="journey-offer">
    <button className="site-button" onClick={start}>{actions[source]} and start my trial <span aria-hidden="true">→</span></button>
    <p className="upgrade-price">3 days free. Card required. Then $99/month for 12 months, then $199/month. Cancel anytime.</p>
    {error && <p role="alert">{error}</p>}
    </div>
  </section>;
}
