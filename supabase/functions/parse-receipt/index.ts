import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";

const instructions = `You extract expense receipt data for a final-mile delivery business.
Return only JSON with this exact shape:
{
  "expenseType": "Gas|Tools|Maintenance|Parking/Tolls|Other",
  "vendor": "merchant name or empty string",
  "amount": number,
  "notes": "short useful note with date or item clues",
  "confidence": 0-100
}
Use Gas for fuel stations and fuel purchases. Use Tools for tool/hardware purchases. Use Maintenance for repairs, parts, oil, tires, or service. Use Parking/Tolls for tolls, parking, bridges, or fees.`;

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth gate: require a signed-in Supabase user. The mobile app sends the user's
  // session token automatically via functions.invoke, so this blocks anonymous /
  // bot calls (which would burn Anthropic credits) without breaking real users.
  // JWT-verify is off on this function so the new sb_publishable_ key works; we
  // verify the session here instead, which is provider-key-format agnostic.
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Auth is not configured for this function." }, 503);
  }
  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized — sign in to use receipt scanning." }, 401);
  } catch {
    return json({ error: "Unauthorized." }, 401);
  }

  try {
    const { imageBase64, contentType = "image/jpeg" } = await req.json();
    if (!imageBase64) {
      return json({ error: "imageBase64 is required." }, 400);
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return json({ error: "ANTHROPIC_API_KEY is not set for this Supabase function." }, 503);
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5",
        max_tokens: 1024,
        system: `${instructions}\n\nReturn ONLY the JSON object — no preamble, no markdown code fences.`,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the receipt fields from this image." },
              { type: "image", source: { type: "base64", media_type: contentType, data: imageBase64 } },
            ],
          },
        ],
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return json({ error: payload?.error?.message || "Receipt extraction failed." }, response.status);
    }

    const outputText = Array.isArray(payload?.content)
      ? payload.content.filter((block: { type?: string }) => block?.type === "text").map((block: { text?: string }) => block.text || "").join("")
      : "";
    const parsed = parseJson(outputText);
    if (!parsed) {
      return json({ error: "Receipt extraction did not return valid JSON." }, 502);
    }

    return json({
      expenseType: normalizeExpenseType(parsed.expenseType),
      vendor: String(parsed.vendor || ""),
      amount: Number(parsed.amount || 0),
      notes: String(parsed.notes || ""),
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence || 0))),
    });
  } catch (error) {
    return json({ error: error.message || "Receipt parser error." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeExpenseType(value: string) {
  const allowed = ["Gas", "Tools", "Maintenance", "Parking/Tolls", "Other"];
  return allowed.includes(value) ? value : "Other";
}
