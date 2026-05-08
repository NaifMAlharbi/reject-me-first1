/**
 * Web search tool for agentic evaluations.
 * Uses Tavily API (free tier: 1,000 searches/month) for real-time market data.
 * Falls back gracefully when no API key is configured.
 */

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
  answer?: string;
};

function getTavilyApiKey(): string | null {
  const key = process.env.TAVILY_API_KEY?.trim();
  return key || null;
}

/**
 * Search the web using Tavily API.
 * Returns up to `maxResults` search results with titles, URLs, and snippets.
 */
export async function searchWeb(
  query: string,
  options?: { maxResults?: number; searchDepth?: "basic" | "advanced" },
): Promise<SearchResponse> {
  const apiKey = getTavilyApiKey();

  if (!apiKey) {
    console.warn("[Search] TAVILY_API_KEY not set — returning empty results.");
    return { query, results: [] };
  }

  const maxResults = options?.maxResults ?? 5;
  const searchDepth = options?.searchDepth ?? "basic";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[Search] Tavily API error (${response.status}): ${detail}`);
      return { query, results: [] };
    }

    const data = (await response.json()) as {
      answer?: string;
      results?: Array<{
        title?: string;
        url?: string;
        content?: string;
      }>;
    };

    const results: SearchResult[] = (data.results ?? [])
      .filter(
        (r): r is { title: string; url: string; content: string } =>
          typeof r.title === "string" && typeof r.url === "string" && typeof r.content === "string",
      )
      .map((r) => ({
        title: r.title.trim(),
        url: r.url.trim(),
        snippet: r.content.trim().slice(0, 300),
      }));

    console.log(`[Search] "${query}" → ${results.length} results`);

    return {
      query,
      results,
      answer: typeof data.answer === "string" ? data.answer.trim() : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`[Search] Timed out: "${query}"`);
    } else {
      console.error("[Search] Failed:", error instanceof Error ? error.message : String(error));
    }
    return { query, results: [] };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if web search is available (API key is configured).
 */
export function isSearchAvailable(): boolean {
  return Boolean(getTavilyApiKey());
}
