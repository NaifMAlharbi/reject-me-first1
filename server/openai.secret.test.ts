import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = {
  BUILT_IN_FORGE_API_KEY: process.env.BUILT_IN_FORGE_API_KEY,
  BUILT_IN_FORGE_API_URL: process.env.BUILT_IN_FORGE_API_URL,
};

describe("internal LLM helper configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BUILT_IN_FORGE_API_KEY = "test-forge-key";
    process.env.BUILT_IN_FORGE_API_URL = "https://forge.manus.im";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.BUILT_IN_FORGE_API_KEY = originalEnv.BUILT_IN_FORGE_API_KEY;
    process.env.BUILT_IN_FORGE_API_URL = originalEnv.BUILT_IN_FORGE_API_URL;
  });

  it("sends chat completions through the built-in forge endpoint instead of OpenAI", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: "resp_1",
        created: Date.now(),
        model: "gemini-2.5-flash",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: "{\"ok\":true}",
            },
          },
        ],
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await import("./_core/llm");

    await invokeLLM({
      messages: [
        { role: "system", content: "Return JSON." },
        { role: "user", content: "Ping" },
      ],
      response_format: { type: "json_object" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("forge.manus.im/v1/chat/completions");
    expect(String(url)).not.toContain("openai.com");
    expect(init?.headers).toMatchObject({
      authorization: "Bearer test-forge-key",
    });
  });
});
