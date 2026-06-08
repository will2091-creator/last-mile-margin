import { generateForecastWithOpenAI } from "../server/openaiCore.js";

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
    const body = getBody(request);
    const result = await generateForecastWithOpenAI({ context: body.context });
    sendJson(response, result.ok ? 200 : result.status, result.payload);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "AI API error." });
  }
}
