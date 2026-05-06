import { ENV } from "./env";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type InvokeLLMInput = {
  model?: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
};

export type InvokeLLMResponse = {
  id?: string;
  choices: Array<{
    index?: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason?: string | null;
  }>;
};

function getModel(explicitModel?: string) {
  if (explicitModel?.trim()) return explicitModel.trim();
  if (process.env.LLM_MODEL?.trim()) return process.env.LLM_MODEL.trim();
  if (process.env.OPENAI_MODEL?.trim()) return process.env.OPENAI_MODEL.trim();
  return "gpt-4.1-mini";
}

function getBaseUrl() {
  if (ENV.openAiApiKey) return "https://api.openai.com";
  if (ENV.forgeApiUrl) return ENV.forgeApiUrl;
  throw new Error(
    "LLM is not configured. Set OPENAI_API_KEY, or set BUILT_IN_FORGE_API_URL with BUILT_IN_FORGE_API_KEY.",
  );
}

function getAuthToken() {
  if (ENV.openAiApiKey) return ENV.openAiApiKey;
  if (ENV.forgeApiKey) return ENV.forgeApiKey;
  throw new Error(
    "LLM auth is not configured. Set OPENAI_API_KEY, or set BUILT_IN_FORGE_API_KEY when using BUILT_IN_FORGE_API_URL.",
  );
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export async function invokeLLM(input: InvokeLLMInput): Promise<InvokeLLMResponse> {
  if (!input.messages.length) {
    throw new Error("invokeLLM requires at least one message.");
  }

  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const endpoint = new URL("v1/chat/completions", baseUrl).toString();
  const token = getAuthToken();
  const model = getModel(input.model);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      temperature: input.temperature ?? 0.3,
      max_tokens: input.max_tokens ?? 1600,
      ...(input.response_format ? { response_format: input.response_format } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `LLM request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`,
    );
  }

  const data = (await response.json()) as InvokeLLMResponse;
  if (!Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error("LLM response did not include choices.");
  }

  const content = data.choices[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("LLM returned an empty assistant message.");
  }

  return data;
}
