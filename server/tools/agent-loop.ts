/**
 * Agent loop: the core agentic infrastructure.
 * Implements the observe → think → act → observe cycle using OpenAI function calling.
 *
 * This turns our evaluators from "LLM personas" into "real agents with tools".
 */

import { invokeLLM, type LLMMessage } from "../_core/llm";
import { searchWeb, type SearchResult } from "./search";

/** Tool definitions in OpenAI function-calling format */
export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

/** A tool call request from the model */
type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

/** Response from the model, potentially including tool calls */
type AgentResponse = {
  content: string | null;
  tool_calls?: ToolCall[];
};

/** The web search tool definition */
const WEB_SEARCH_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "search_web",
    description:
      "Search the web for real-time information about markets, competitors, regulations, trends, or any factual data needed to evaluate the startup. Use this to ground your evaluation in real data instead of guessing.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The search query. Be specific — include the industry, market, or topic. Examples: 'EdTech market size 2024 TAM', 'Otter.ai competitors meeting assistant', 'Saudi Arabia PDPL data privacy law requirements'",
        },
      },
      required: ["query"],
    },
  },
};

/** Execute a tool call and return the result */
async function executeTool(toolCall: ToolCall): Promise<string> {
  const { name, arguments: argsStr } = toolCall.function;

  if (name === "search_web") {
    try {
      const args = JSON.parse(argsStr) as { query: string };
      const result = await searchWeb(args.query, { maxResults: 3 });

      if (result.results.length === 0) {
        return JSON.stringify({ query: args.query, results: [], note: "No results found." });
      }

      // Format results concisely for the agent
      const formatted = result.results.map((r: SearchResult) => ({
        title: r.title,
        snippet: r.snippet.slice(0, 200),
        url: r.url,
      }));

      return JSON.stringify({
        query: args.query,
        answer: result.answer?.slice(0, 300),
        results: formatted,
      });
    } catch (error) {
      return JSON.stringify({
        error: `Search failed: ${error instanceof Error ? error.message : "unknown error"}`,
      });
    }
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

/**
 * Run an agent loop with tool calling.
 *
 * The agent can call tools (web search) up to `maxToolCalls` times.
 * After gathering information, it produces a final response.
 *
 * This is what makes it a REAL AGENT:
 * - It DECIDES what to search (autonomy)
 * - It CALLS tools based on reasoning (tool use)
 * - It OBSERVES results and adapts (observe→act loop)
 */
export async function runAgentWithTools({
  system,
  user,
  tools = [WEB_SEARCH_TOOL],
  maxToolCalls = 3,
  model,
  temperature,
  maxTokens,
  responseFormat,
}: {
  system: string;
  user: string;
  tools?: ToolDefinition[];
  maxToolCalls?: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
}): Promise<{ content: string; toolCallsUsed: number; searches: string[] }> {
  const messages: LLMMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let toolCallsUsed = 0;
  const searches: string[] = [];

  // Agent loop: keep running until the model stops calling tools
  for (let iteration = 0; iteration < maxToolCalls + 1; iteration++) {
    const response = await invokeLLM({
      model,
      messages,
      temperature: temperature ?? 0.3,
      max_tokens: maxTokens ?? 2000,
      response_format: iteration === maxToolCalls ? responseFormat : undefined, // Only enforce format on final call
      tools: iteration < maxToolCalls ? tools : undefined, // Don't offer tools on last iteration
    });

    const choice = response.choices[0];
    const message = choice?.message as AgentResponse | undefined;

    if (!message) {
      throw new Error("Agent loop: no message in response.");
    }

    // If model made tool calls, execute them and continue the loop
    if (message.tool_calls && message.tool_calls.length > 0 && iteration < maxToolCalls) {
      // Add the assistant's tool call message
      messages.push({
        role: "assistant",
        content: message.content ?? "",
        tool_calls: message.tool_calls,
      });

      // Execute each tool call
      for (const toolCall of message.tool_calls) {
        const result = await executeTool(toolCall);
        toolCallsUsed++;

        if (toolCall.function.name === "search_web") {
          try {
            const args = JSON.parse(toolCall.function.arguments) as { query: string };
            searches.push(args.query);
          } catch {
            // ignore parse errors for tracking
          }
        }

        // Add tool result back to the conversation
        messages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      }

      console.log(`[Agent] Iteration ${iteration + 1}: ${message.tool_calls.length} tool call(s), continuing...`);
      continue;
    }

    // Model returned a final response (no tool calls)
    const content = message.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Agent loop: empty final response.");
    }

    console.log(`[Agent] Completed after ${toolCallsUsed} tool call(s).`);
    return { content, toolCallsUsed, searches };
  }

  throw new Error("Agent loop: exceeded maximum iterations without final response.");
}

/**
 * Generate agent questions about a project brief.
 * Each agent analyzes the brief and identifies what information is missing
 * from their perspective.
 *
 * This is agentic because the agent DECIDES what to ask based on its analysis.
 */
export async function generateAgentQuestion({
  agentPrompt,
  briefText,
  language,
  agentLabel,
}: {
  agentPrompt: string;
  briefText: string;
  language: "en" | "ar";
  agentLabel: string;
}): Promise<{ question: string; reason: string } | null> {
  const questionPrompt =
    language === "ar"
      ? `أنت ${agentLabel}. اقرأ الملخص التالي وحدد أهم معلومة مفقودة من وجهة نظرك.
إذا كان الملخص كاملًا بما يكفي لتقييمك، أعد: {"skip": true}
وإلا أعد JSON: {"question": "سؤالك المحدد", "reason": "لماذا تحتاج هذه المعلومة (جملة قصيرة)"}
لا تسأل أسئلة عامة. اسأل شيئًا محددًا يغيّر تقييمك.`
      : `You are the ${agentLabel}. Read the following brief and identify the SINGLE most important piece of missing information from YOUR perspective.
If the brief is complete enough for your evaluation, return: {"skip": true}
Otherwise return JSON: {"question": "Your specific question", "reason": "Why you need this (one short sentence)"}
Do NOT ask generic questions. Ask something specific that would change your evaluation.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: agentPrompt },
        {
          role: "user",
          content: `${questionPrompt}\n\n${language === "ar" ? "الملخص:" : "Project brief:"}\n${briefText}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as { skip?: boolean; question?: string; reason?: string };
    if (parsed.skip) return null;
    if (!parsed.question?.trim()) return null;

    return {
      question: parsed.question.trim().slice(0, 300),
      reason: (parsed.reason ?? "").trim().slice(0, 200),
    };
  } catch (error) {
    console.error(`[Agent] Question generation failed for ${agentLabel}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}
