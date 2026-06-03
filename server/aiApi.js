import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.2";

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const extractJson = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  }
};

const createClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const callOpenAIJson = async ({ instructions, input }) => {
  const client = createClient();
  if (!client) {
    return {
      ok: false,
      status: 503,
      payload: {
        error: "OPENAI_API_KEY is not set. Using local fallback.",
      },
    };
  }

  const response = await client.responses.create({
    model: MODEL,
    instructions,
    input,
  });

  const parsed = extractJson(response.output_text);
  if (!parsed) {
    return {
      ok: false,
      status: 502,
      payload: {
        error: "AI response was not valid JSON.",
      },
    };
  }

  return { ok: true, payload: parsed };
};

const askInstructions = `You are Ask My Business for a final-mile delivery margin app.
Answer from the supplied business context. Understand casual language and typos.
Return only JSON with this shape:
{
  "title": "short answer headline",
  "summary": "plain-English answer using exact dollars/metrics where useful",
  "actions": ["2-4 concrete next actions"],
  "tab": "Dashboard|Intake|Profitability|Contracts|Compliance|Claims|Teams|Reports|Settings|Ask"
}
Do not invent records. If the user asks break-even, use totalCost as break-even revenue, requiredRevenue for target profit, and requiredRoutePay when route pay must change.`;

const intakeInstructions = `You are AI Intake for a final-mile delivery app.
Analyze pasted emails, route sheets, notes, contract terms, screenshots/PDF text placeholders, and mixed inputs.
Return only JSON with this shape:
{
  "message": "short status message",
  "drafts": [
    {
      "type": "claim|route|contract|file",
      "title": "draft title",
      "confidence": 0-100,
      "summary": "short summary",
      "data": {
        "category": "Property|Cargo|Penalty",
        "type": "issue or claim type",
        "amount": number,
        "driver": "driver name",
        "team": "team name",
        "route": "route/customer",
        "status": "Under Review",
        "preventable": "Yes|No|Maybe",
        "risk": "Low|Medium|High",
        "sourceType": "Email|Route Sheet|Contract Terms|File",
        "from": "email if available",
        "customer": "customer or store",
        "reference": "reference id",
        "routePay": number,
        "stops": number,
        "miles": number,
        "fuelPrice": number,
        "driverPay": number,
        "helperPay": number,
        "perStop": number,
        "installPay": number,
        "notes": "important source notes"
      },
      "claimIntelligence": {
        "disputeScore": 0-100,
        "missingEvidence": ["Photos", "POD", "Driver notes", "Reference"],
        "recommendation": "short recommendation",
        "nextAction": "short next action"
      }
    }
  ]
}
Create multiple drafts only when the source truly contains multiple business objects. Contract language about claims packets is not itself a claim. Route sheets with delivery windows are not claims unless damage/chargeback/deduction is present.`;

export async function handleAiApi(req, res, next) {
  if (req.method !== "POST" || !req.url?.startsWith("/api/")) {
    next();
    return;
  }

  try {
    const body = await readJsonBody(req);

    if (req.url.startsWith("/api/ask-business")) {
      const result = await callOpenAIJson({
        instructions: askInstructions,
        input: JSON.stringify({
          question: body.question,
          businessContext: body.businessContext,
        }),
      });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    if (req.url.startsWith("/api/analyze-intake")) {
      const result = await callOpenAIJson({
        instructions: intakeInstructions,
        input: JSON.stringify({
          text: body.text,
          files: body.files,
          teams: body.teams,
          claims: body.claims,
          settings: body.appSettings,
        }),
      });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    sendJson(res, 404, { error: "Unknown API route." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "AI API error." });
  }
}
