import { askBusinessWithOpenAI } from "../server/openaiCore.js";
import { requireUser } from "../server/requireUser.js";

const sendJson = (response, statusCode, payload) => {
  response.status(statusCode).json(payload);
};

const getBody = (request) => {
  if (!request.body) return {};
  if (typeof request.body === "string") return JSON.parse(request.body);
  return request.body;
};

export default async function handler(request, response) {
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

    const body = getBody(request);
    const result = await askBusinessWithOpenAI({
      question: body.question,
      businessContext: body.businessContext,
      history: body.history,
    });

    sendJson(response, result.ok ? 200 : result.status, result.payload);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "AI API error." });
  }
}
