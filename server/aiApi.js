import { analyzeComplianceDocWithOpenAI, analyzeDamagePhotoWithOpenAI, analyzeIntakeWithOpenAI, askBusinessWithOpenAI, generateDisputeLetterWithOpenAI, generateMarginBriefWithOpenAI, parseDayLogWithOpenAI } from "./openaiCore.js";

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 12_000_000) {
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

export async function handleAiApi(req, res, next) {
  if (req.method !== "POST" || !req.url?.startsWith("/api/")) {
    next();
    return;
  }

  try {
    const body = await readJsonBody(req);

    if (req.url.startsWith("/api/ask-business")) {
      const result = await askBusinessWithOpenAI({
        question: body.question,
        businessContext: body.businessContext,
        history: body.history,
      });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    if (req.url.startsWith("/api/dispute-letter")) {
      const result = await generateDisputeLetterWithOpenAI({ claim: body.claim });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    if (req.url.startsWith("/api/margin-brief")) {
      const result = await generateMarginBriefWithOpenAI({ context: body.context });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    if (req.url.startsWith("/api/parse-daylog")) {
      const result = await parseDayLogWithOpenAI({ text: body.text });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    if (req.url.startsWith("/api/vision-claim")) {
      const result = await analyzeDamagePhotoWithOpenAI({ imageBase64: body.imageBase64, contentType: body.contentType, note: body.note });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    if (req.url.startsWith("/api/vision-doc")) {
      const result = await analyzeComplianceDocWithOpenAI({ imageBase64: body.imageBase64, contentType: body.contentType });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    if (req.url.startsWith("/api/analyze-intake")) {
      const result = await analyzeIntakeWithOpenAI({
        text: body.text,
        files: body.files,
        teams: body.teams,
        claims: body.claims,
        appSettings: body.appSettings,
      });
      sendJson(res, result.ok ? 200 : result.status, result.payload);
      return;
    }

    sendJson(res, 404, { error: "Unknown API route." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "AI API error." });
  }
}
