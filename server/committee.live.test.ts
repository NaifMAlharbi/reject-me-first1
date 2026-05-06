import { afterEach, describe, expect, it, vi } from "vitest";
import { agentOrder } from "@shared/rejectMeFirst";

function llmJson(content: unknown) {
  return {
    id: "mock-llm-response",
    created: Date.now(),
    model: "test-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant" as const,
          content: JSON.stringify(content),
        },
        finish_reason: "stop",
      },
    ],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("committee live mode", () => {
  it("uses the internal LLM path and returns founder-specific objections instead of canned fallback phrasing", async () => {
    const briefResponse = llmJson({
      project_name: "RejectPilot",
      one_line_summary: "AI workflow for agencies that turns meeting notes into action items and follow-up drafts.",
      problem: "Agencies lose tasks and accountability after client meetings, so next steps slip.",
      solution: "The product turns meeting transcripts into summaries, owners, deadlines, and follow-up drafts.",
      target_customer: "Small agencies with repeated client meetings every week.",
      customer_pain: "Project managers waste hours manually rewriting notes and chasing owners.",
      business_model: "Per-seat SaaS for agencies with a team plan.",
      market_type: "B2B SaaS",
      industry: "Agency operations",
      differentiation: "The wedge is narrow around summaries, action items, and workspace sync instead of generic meeting notes.",
      distribution_strategy: "Founder-led sales into agencies already asking for cleaner follow-up workflows.",
      evidence_or_traction: "Five pilot teams already use the workflow weekly.",
      key_assumptions: [
        "Agencies will switch from manual notes if follow-up quality is materially better.",
        "Pilot usage can convert into paid seats.",
        "Workspace sync is enough for the initial wedge.",
      ],
      known_risks: [
        "Acquisition may stay founder-dependent for too long.",
        "Meeting data quality may vary across teams.",
        "Users may resist changing note-taking habits.",
      ],
      unknowns: [
        "How sticky weekly usage will remain after pilots.",
        "Which agency segment converts fastest.",
        "How much setup friction workspace sync creates.",
      ],
    });

    const investorResponse = llmJson({
      agent: "investor",
      label: "Investor Agent",
      score: 7.1,
      confidence: 81,
      stance: "mixed",
      key_insight:
        "Weekly pilot usage is promising, but the business still depends on proving repeatable agency acquisition beyond founder hustle.",
      top_objections: [
        "Founder-led sales into agencies may work for the first few pilots, but the brief does not yet show a repeatable channel beyond the founder network.",
        "Five pilot teams provide a signal, yet they are still too few to prove that agencies will retain and expand paid seats.",
        "The team plan business model sounds reasonable, but the brief does not show why agencies will pay enough to support CAC once founder-led outreach slows.",
      ],
      strengths: [
        "Five pilot teams using the workflow weekly is stronger than a concept-only pitch at this stage.",
        "The product wedge stays narrow around summaries, action items, and workspace sync, which makes the early scope easier to defend.",
      ],
      summary:
        "This is an interesting early wedge with real pilot movement, but the investment case still hinges on proving repeatable distribution and durable retention.",
    });

    const customerResponse = llmJson({
      agent: "customer",
      label: "Customer Agent",
      score: 7.4,
      confidence: 79,
      stance: "supportive",
      key_insight:
        "The pain is easy for agency teams to recognize, though the switching trigger still depends on whether the follow-up drafts are reliably better than manual habits.",
      top_objections: [
        "Agency project managers may like the idea, but they will not change their workflow unless the follow-up drafts clearly save more time than their current note templates.",
        "The brief targets agencies broadly, so it is still unclear which kind of agency feels this pain strongly enough to buy first.",
        "Workspace sync helps onboarding, yet any setup friction during the first meeting could make busy agency teams abandon the product quickly.",
      ],
      strengths: [
        "The product speaks to a concrete post-meeting pain that agency teams already feel every week.",
        "Summaries, owners, deadlines, and follow-up drafts describe an outcome that buyers can understand without a long explanation.",
      ],
      summary:
        "Customers can understand the promise quickly, but the first buyer segment and the exact switching trigger still need sharper proof.",
    });

    const technicalResponse = llmJson({
      agent: "technical",
      label: "Technical Agent",
      score: 6.9,
      confidence: 76,
      stance: "mixed",
      key_insight:
        "The MVP is directionally buildable, but reliable transcript quality and workspace synchronization can still widen the scope faster than the brief suggests.",
      top_objections: [
        "Turning transcripts into accurate summaries, owners, and deadlines is feasible, but inconsistent meeting data quality could create noisy outputs that agencies stop trusting.",
        "Workspace sync sounds lightweight in the brief, yet each downstream tool can add edge cases that stretch a small team beyond a narrow MVP.",
        "Generating follow-up drafts plus action items in one flow may look simple to users, but it can expand QA needs if the product must stay reliable across very different meeting styles.",
      ],
      strengths: [
        "The initial scope is narrower than a full meeting assistant, which gives the MVP a more realistic first build boundary.",
        "The workflow centers on post-meeting outputs rather than real-time collaboration, which reduces technical complexity early on.",
      ],
      summary:
        "The first version looks buildable, but transcript reliability and integration edge cases are the main reasons execution could drift wider than planned.",
    });

    const genericRoleResponse = (agent: string, label: string, objection: string) =>
      llmJson({
        agent,
        label,
        score: 6.8,
        confidence: 77,
        stance: "mixed",
        key_insight: objection,
        top_objections: [objection, objection, objection],
        strengths: [
          "The brief includes a narrow wedge around summaries, action items, and workspace sync.",
          "Five pilot teams already use the workflow weekly, which is better than a pure concept stage.",
        ],
        summary: objection,
      });

    const invokeLLM = vi.fn().mockImplementation(async (params: { messages: Array<{ content: unknown }> }) => {
      const systemMessage = params.messages[0]?.content;
      const systemText = typeof systemMessage === "string" ? systemMessage : JSON.stringify(systemMessage);

      if (systemText.includes("You structure startup ideas") || systemText.includes("تلخّص أفكار الشركات الناشئة")) {
        return briefResponse;
      }
      if (systemText.includes("Investor Agent") || systemText.includes("وكيل المستثمر")) {
        return investorResponse;
      }
      if (systemText.includes("Customer Agent") || systemText.includes("وكيل العميل")) {
        return customerResponse;
      }
      if (systemText.includes("Technical Agent") || systemText.includes("الوكيل التقني")) {
        return technicalResponse;
      }
      if (systemText.includes("Financial Agent") || systemText.includes("الوكيل المالي")) {
        return genericRoleResponse(
          "financial",
          "Financial Agent",
          "The brief does not yet prove that agency pricing, paid seats, and retention economics will support a durable SaaS business beyond the first pilots.",
        );
      }
      if (systemText.includes("Legal Agent") || systemText.includes("الوكيل القانوني")) {
        return genericRoleResponse(
          "legal",
          "Legal Agent",
          "Handling meeting transcripts and client follow-up drafts introduces privacy and consent obligations that the brief does not yet explain clearly enough.",
        );
      }
      if (systemText.includes("Operations Agent") || systemText.includes("الوكيل التشغيلي")) {
        return genericRoleResponse(
          "operator",
          "Operations Agent",
          "The workflow promises cleaner follow-up after meetings, but the brief does not yet show who owns onboarding, support, and change management inside each agency.",
        );
      }
      if (systemText.includes("Marketing Agent") || systemText.includes("الوكيل التسويقي")) {
        return genericRoleResponse(
          "marketing",
          "Marketing Agent",
          "The founder-led sales story is credible early, but the brief does not yet show a repeatable message and channel that can scale past direct founder outreach.",
        );
      }

      throw new Error(`Unexpected prompt in test mock: ${systemText}`);
    });

    vi.doMock("./_core/llm", () => ({ invokeLLM }));

    const { getDemoCase, startReview } = await import("./committee");
    const result = await startReview({
      ...getDemoCase("en").input,
      useMock: false,
    });

    expect(result.mode).toBe("live");
    expect(invokeLLM.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(result.reviews).toHaveLength(agentOrder.length);

    const allObjections = result.reviews.flatMap(review => review.top_objections).join(" ");
    const normalizedObjections = allObjections.toLowerCase();

    expect(allObjections).toMatch(/founder-led sales|pilot teams|paid seats/i);
    expect(allObjections).toMatch(/small teams lose decisions|early pilots with five teams|after meetings|weekly usage/i);
    expect(normalizedObjections).not.toContain("needs more validation");
  });
});
