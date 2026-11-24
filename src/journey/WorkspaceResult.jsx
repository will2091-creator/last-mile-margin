import { ArrowRight, Check, CircleHelp, RotateCcw } from "lucide-react";
import { confirmAccount } from "./confirmAccount";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { forgetDraft, readDraft } from "./draft";
import { ResultPreview } from "./ResultPreview";
import "./journey.css";

export function DraftSummary({ id, owner, showTerms = true }) {
  if (!id) return null;
  const draft = readDraft(id);
  if (!draft || (draft.owner && draft.owner !== owner)) return <p className="journey-summary">To continue with your result, open this link in the browser and account where you started.</p>;
  return <section className="journey-summary">
    <p className="journey-caption">What you’re saving</p>
    <ResultPreview payload={draft.payload} example={draft.example} />
    {showTerms && <p className="journey-terms">3 days free with a card. Then $99/month for 12 months, then $199/month. Cancel anytime.</p>}
    {!draft.owner && <a className="journey-edit" href={`/tools/${draft.source}?editResult=${draft.id}`}>Edit this result</a>}
  </section>;
}

export default function WorkspaceResult({ id, pending, user, onPriceRoute }) {
  const [item, setItem] = useState(null);
  const [list, setList] = useState([]);
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [date, setDate] = useState("");
  const [dateStatus, setDateStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const draft = pending ? readDraft(id) : null;
  useEffect(() => {
    let active = true;
    async function load() {
      setState("loading");
      if (!id) {
        const { data, error } = await supabase.from("saved_tool_items").select("id,payload->>title,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
        if (error) throw error;
        if (active) { setList(data); setState("list"); }
        return;
      }
      const { data: existing, error } = await supabase.from("saved_tool_items").select("*").eq("id",id).eq("owner_id",user.id).maybeSingle();
      if (error) throw error;
      if (!active) return;
      let saved = existing;
      if (!saved) {
        const local = pending && readDraft(id);
        if (!local || (local.owner && local.owner !== user.id)) { setState("missing"); return; }
        if (!local.owner) { setState("confirm"); return; }
        const result = await supabase.rpc("save_tool_item", {
          item:id, visit:local.visit, tool:local.source, expected_owner:user.id, content:local.payload, is_example:local.example,
        }).single();
        if (result.error) throw result.error;
        saved = result.data;
      }
      if (!active) return;
      setItem(saved); setDate(saved.deadline || ""); setState("saved");
      if (pending) {
        history.replaceState(null,"","/?toolItem="+id);
        forgetDraft(id);
      }
    }
    load().catch(() => { if(active) setState("error"); });
    return () => { active=false; };
  },[id,pending,user.id,attempt]);

  async function confirm() {
    setBusy(true);
    try { await confirmAccount(id,user.id); setAttempt(n=>n+1); }
    catch { setState("error"); }
    finally { setBusy(false); }
  }

  async function saveDeadline() {
    setBusy(true); setDateStatus("");
    try {
      const {error} = await supabase.from("saved_tool_items").update({deadline:date || null}).eq("id",id).eq("owner_id",user.id).select("id").single();
      if (error) throw error;
      setDateStatus("Deadline saved.");
    } catch { setDateStatus("Couldn’t save the deadline. Try again."); }
    finally { setBusy(false); }
  }

  return <main className="journey-shell"><section className="journey-card" data-state={state}>
    <div className="journey-brand"><img src="/brand/lmm-mark.png" alt="" width="25" height="25"/><strong>Last Mile Margin</strong><span>Your workspace</span></div>
    {state==="loading" && <p role="status">Opening your result…</p>}
    {state==="list" && <><h1>Saved tool results</h1>{list.length ? <ul>{list.map(row=><li key={row.id}><a className="journey-link" href={"/?toolItem="+row.id}>{row.title} · {new Date(row.created_at).toLocaleDateString()}</a></li>)}</ul> : <p>Your saved routes, offers, claims, and crew plans will appear here.</p>}</>}
    {state==="confirm" && draft && <><h1>Save to your workspace</h1><p>You’re signed in as {user.email}.</p><DraftSummary id={id} owner={user.id}/><button disabled={busy} className="journey-button" onClick={confirm}>Save to this account</button></>}
    {state==="missing" && <><h1>Open your original browser</h1><p>This account has no saved copy of that result. Return to the device and browser where you used the tool to finish saving. Local drafts expire after seven days.</p></>}
    {state==="error" && <><div className="journey-retry-mark"><CircleHelp aria-hidden="true" /></div><h1>Couldn’t open your result</h1><p role="alert">Check your connection and try again. Retrying opens the same item.</p><button className="journey-button" onClick={()=>setAttempt(n=>n+1)}><RotateCcw size={16} aria-hidden="true"/>Try again</button></>}
    {state==="saved" && item && <>
      <ResultPreview payload={item.payload} example={item.example} showLetter={false} heading="h1"/>
      <p className="journey-saved"><Check size={16} aria-hidden="true"/>Saved to your workspace</p>
      {item.payload.comparison && <ul>{item.payload.comparison.map(([label,value],index)=><li key={index}>{label} · <strong>{value}</strong></li>)}</ul>}
      {item.source==="chargeback-dispute-letter" && <>
        <h2>{item.payload.subject}</h2><p className="journey-letter">{item.payload.letter}</p>
        <label>Dispute deadline <input className="rounded-lg border p-2" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
        <button disabled={busy} className="journey-link" onClick={saveDeadline}>Save deadline</button><p role="status">{dateStatus}</p>
      </>}
      {item.payload.routeForm && onPriceRoute && <button className="journey-button" onClick={()=>onPriceRoute(item)}>{item.source==="driver-pay-calculator"?"Price a route with this crew":"Open in Route Profit Check"}<ArrowRight size={17} aria-hidden="true"/></button>}

    </>}
    <nav className="journey-actions" aria-label="Workspace navigation">{state==="saved" && <a href="/?toolLibrary=1" className="journey-link">All saved tool results</a>}<a className="journey-link" href="/">Dashboard</a></nav>
  </section></main>;
}
