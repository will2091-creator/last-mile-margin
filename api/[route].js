// Single serverless function for every /api/* route.
//
// Vercel's Hobby plan caps a deployment at 12 serverless functions, and this
// project had exactly 12 (one file per AI endpoint) — adding a 13th broke every
// deploy. Routing them all through this one dynamic function keeps the URLs
// identical (/api/ask-business, /api/vision-claim, ...) while counting as one.
//
// To add an AI endpoint: add a *WithOpenAI export in server/openaiCore.js, a
// line in AI_ROUTES below, and the same entry in server/aiApi.js (dev server).

import {
  analyzeComplianceDocWithOpenAI,
  analyzeDamagePhotoWithOpenAI,
  analyzeIntakeWithOpenAI,
  analyzeReceiptWithOpenAI,
  askBusinessWithOpenAI,
  generateContractEvalWithOpenAI,
  generateDisputeLetterWithOpenAI,
  generateForecastWithOpenAI,
  generateMarginBriefWithOpenAI,
  generateRiskForecastWithOpenAI,
  generateWatchdogWithOpenAI,
  parseDayLogWithOpenAI,
} from "../server/openaiCore.js";
import { requireUser } from "../server/requireUser.js";
import { runKeepalive } from "../server/keepalive.js";

// Each entry maps the request body to exactly the arguments the old per-file
// handler passed. All AI routes are POST-only and require a signed-in user.
const AI_ROUTES = {
  "analyze-intake": (b) => analyzeIntakeWithOpenAI({ text: b.text, files: b.files, teams: b.teams, claims: b.claims, appSettings: b.appSettings }),
  "ask-business": (b) => askBusinessWithOpenAI({ question: b.question, businessContext: b.businessContext, history: b.history }),
  "contract-eval": (b) => generateContractEvalWithOpenAI({ context: b.context }),
  "dispute-letter": (b) => generateDisputeLetterWithOpenAI({ claim: b.claim }),
  "forecast": (b) => generateForecastWithOpenAI({ context: b.context }),
  "margin-brief": (b) => generateMarginBriefWithOpenAI({ context: b.context }),
  "parse-daylog": (b) => parseDayLogWithOpenAI({ text: b.text }),
  "risk-forecast": (b) => generateRiskForecastWithOpenAI({ context: b.context }),
  "vision-claim": (b) => analyzeDamagePhotoWithOpenAI({ imageBase64: b.imageBase64, contentType: b.contentType, note: b.note }),
  "vision-doc": (b) => analyzeComplianceDocWithOpenAI({ imageBase64: b.imageBase64, contentType: b.contentType }),
  "vision-receipt": (b) => analyzeReceiptWithOpenAI({ imageBase64: b.imageBase64, contentType: b.contentType }),
  "watchdog": (b) => generateWatchdogWithOpenAI({ anomalies: b.anomalies, context: b.context }),
};

const sendJson = (response, statusCode, payload) => {
  response.status(statusCode).json(payload);
};

const getBody = (request) => {
  if (!request.body) return {};
  if (typeof request.body === "string") return JSON.parse(request.body);
  return request.body;
};

// Vercel exposes the [route] segment as request.query.route; fall back to the
// last path segment so this also works if the query isn't populated.
const getRoute = (request) => {
  const fromQuery = request.query?.route;
  if (typeof fromQuery === "string" && fromQuery) return fromQuery;
  try {
    return new URL(request.url || "", "http://localhost").pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return "";
  }
};

export default async function handler(request, response) {
  const route = getRoute(request);

  if (route === "keepalive") {
    await runKeepalive(request, response);
    return;
  }

  if (!Object.hasOwn(AI_ROUTES, route)) {
    sendJson(response, 404, { error: "Unknown API route." });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const auth = await requireUser(request);
    if (!auth.ok) {
      sendJson(response, auth.status, { error: auth.error });
      return;
    }

    const result = await AI_ROUTES[route](getBody(request));
    sendJson(response, result.ok ? 200 : result.status, result.payload);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "AI API error." });
  }
}
