import { describe, expect, it } from "vitest";

describe("OpenAI secret validation", () => {
  it("accepts the configured OPENAI_API_KEY against the models endpoint", async () => {
    const apiKey = process.env.OPENAI_API_KEY;

    expect(apiKey).toBeTruthy();
    expect(apiKey?.startsWith("sk-")).toBe(true);

    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const text = await response.text();

    expect(response.ok, text).toBe(true);
    expect(text.toLowerCase()).toContain("data");
  }, 30_000);
});
