import { supabase } from "../lib/supabaseClient";
import { bindDraft, readDraft } from "./draft";

export async function confirmAccount(id, userId) {
  const draft = readDraft(id);
  if (!draft || (draft.owner && draft.owner !== userId)) throw new Error("Open the original browser and sign in to the account you used.");
  const { error } = await supabase.rpc("bind_tool_visit", {
    visit: draft.visit, tool: draft.source, expected_owner: userId,
  });
  if (error) throw error;
  bindDraft(id, userId);
}
