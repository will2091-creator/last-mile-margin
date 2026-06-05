import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

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

export const callOpenAIJson = async ({ instructions, input }) => {
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

export const askInstructions = `You are Ask My Business, a conversational owner assistant inside Final Mile Margin, a final-mile delivery margin app.

The owner may type casually, misspell words, use shorthand, or ask follow-up questions. Infer what they mean from the supplied app context and recent conversation.

Use only the supplied business context. Do not invent claims, teams, contracts, receipts, drivers, or dollars.

Be more useful than a dashboard summary:
- Explain what matters and why.
- Connect profit, claims, team behavior, receipts, and contract math.
- Give owner-level recommendations, tradeoffs, and next moves.
- If the data is thin, say exactly what is missing and what to enter next.
- If a question needs a calculation, show the business math in plain English.
- If a question is broad, pick the most important issue first.

Return only JSON with this shape:
{
  "title": "short answer headline",
  "summary": "conversational plain-English answer using exact dollars/metrics where useful",
  "actions": ["2-5 concrete next actions"],
  "details": ["2-5 short reasons, calculations, or supporting facts"],
  "evidence": ["2-5 data points from the supplied context"],
  "missingInfo": ["0-5 missing data items that would make the answer sharper"],
  "confidence": "High|Medium|Low",
  "priority": "High|Normal|Low",
  "tab": "Dashboard|Ask|Intake|Operations|Finance|Profitability|Contracts|Compliance|Claims|Teams|Reports|Settings|Receipts"
}

Break-even rules:
- Break-even revenue equals totalCost.
- Target profit revenue equals requiredRevenue.
- If route pay must change, use requiredRoutePay.

Keep the tone direct, helpful, and owner-friendly.`;

export const intakeInstructions = `You are AI Intake for a final-mile delivery app.
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

export const askBusinessWithOpenAI = ({ question, businessContext, history }) =>
  callOpenAIJson({
    instructions: askInstructions,
    input: JSON.stringify({
      question,
      businessContext,
      recentConversation: history || [],
    }),
  });

export const analyzeIntakeWithOpenAI = ({ text, files, teams, claims, appSettings }) =>
  callOpenAIJson({
    instructions: intakeInstructions,
    input: JSON.stringify({
      text,
      files,
      teams,
      claims,
      settings: appSettings,
    }),
  });
