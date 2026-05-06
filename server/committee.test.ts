import { describe, expect, it } from "vitest";
import { agentOrder } from "@shared/rejectMeFirst";
import { buildComparisonRows, demoCase, startReview, submitRebuttal } from "./committee";


describe("committee.startReview", () => {
  it("detects Arabic input, returns RTL mode, and keeps the Technical Agent label", async () => {
    const result = await startReview({
      useMock: true,
      freeText: "منصة تساعد الفرق الصغيرة على تحويل الاجتماعات إلى مهام واضحة ومتابعة تلقائية.",
      structured: {
        projectName: "لجنة",
        idea: "منصة ذكاء اصطناعي لإدارة مخرجات الاجتماعات",
        problem: "تضيع القرارات والمهام بعد الاجتماعات.",
        solution: "تحويل النقاش إلى ملخصات ومهام ومتابعات تلقائية.",
        additionalInfo: "التركيز الأول على الفرق الصغيرة.",
        sections: [{ title: "القيمة", content: "توفير وقت التوثيق والمتابعة." }],
      },
    });

    expect(result.language).toBe("ar");
    expect(result.direction).toBe("rtl");
    expect(result.mode).toBe("mock");
    expect(result.reviews).toHaveLength(agentOrder.length);
    expect(result.reviews.map(review => review.agent)).toEqual(agentOrder);
    expect(result.reviews.find(review => review.agent === "technical")?.label).toBe("الوكيل التقني");
  });

  it("returns UI-ready scores and confidence values in mock mode", async () => {
    const result = await startReview(demoCase.input);

    for (const review of result.reviews) {
      expect(review.score).toBeGreaterThanOrEqual(0);
      expect(review.score).toBeLessThanOrEqual(10);
      expect(Number.isInteger(review.confidence)).toBe(true);
      expect(review.confidence).toBeGreaterThanOrEqual(0);
      expect(review.confidence).toBeLessThanOrEqual(100);
      expect(review.top_objections.length).toBeLessThanOrEqual(3);
      expect(review.strengths.length).toBeLessThanOrEqual(2);
    }
  });

  it("runs only the user-selected evaluators while preserving committee order", async () => {
    const result = await startReview({
      ...demoCase.input,
      selectedAgents: ["technical", "customer"],
    });

    expect(result.reviews).toHaveLength(2);
    expect(result.reviews.map(review => review.agent)).toEqual(["customer", "technical"]);
    expect(result.reviews.every(review => ["customer", "technical"].includes(review.agent))).toBe(true);
  });
});

describe("committee.submitRebuttal", () => {
  it("keeps structured rebuttals linked to their matching objections and agents", async () => {
    const firstRound = await startReview(demoCase.input);
    const investorObjection = firstRound.reviews.find(review => review.agent === "investor")!.top_objections[0]!;
    const customerObjection = firstRound.reviews.find(review => review.agent === "customer")!.top_objections[0]!;
    const technicalObjection = firstRound.reviews.find(review => review.agent === "technical")!.top_objections[0]!;

    const result = await submitRebuttal({
      language: firstRound.language,
      direction: firstRound.direction,
      mode: firstRound.mode,
      projectBrief: firstRound.projectBrief,
      reviews: firstRound.reviews,
      rebuttal: {
        structured: {
          investor: [{ objection: investorObjection, response: "We already have repeat weekly usage across pilot teams." }],
          customer: [{ objection: customerObjection, response: "The first buyers are agencies that run many client meetings." }],
          technical: [{ objection: technicalObjection, response: "The MVP only covers summaries, action items, and workspace sync." }],
        },
      },
    });

    expect(result.linked_rebuttal).toEqual([
      { agent: "investor", objection: investorObjection, response: "We already have repeat weekly usage across pilot teams." },
      { agent: "customer", objection: customerObjection, response: "The first buyers are agencies that run many client meetings." },
      { agent: "technical", objection: technicalObjection, response: "The MVP only covers summaries, action items, and workspace sync." },
    ]);
    expect(result.second_round).toHaveLength(agentOrder.length);
    expect(result.comparison).toHaveLength(agentOrder.length);
    expect(result.final_verdict.actionable_tips.length).toBeGreaterThan(0);
  });

  it("improves at least one score when rebuttal quality is strong in mock mode", async () => {
    const firstRound = await startReview(demoCase.input);
    const result = await submitRebuttal({
      language: firstRound.language,
      direction: firstRound.direction,
      mode: firstRound.mode,
      projectBrief: firstRound.projectBrief,
      reviews: firstRound.reviews,
      rebuttal: {
        freeText:
          "We already have five pilot teams using the workflow weekly, the first buyers are agencies with frequent meetings, and the MVP scope is intentionally narrow around summaries, action items, and workspace sync. We also know the first acquisition channel is founder-led sales into agencies already asking for cleaner follow-up workflows.",
      },
    });

    expect(result.comparison.some(row => row.improved)).toBe(true);
    expect(result.final_verdict.final_score).toBeGreaterThanOrEqual(0);
    expect(result.final_verdict.final_score).toBeLessThanOrEqual(10);
    expect(result.final_verdict.confidence).toBeGreaterThanOrEqual(0);
    expect(result.final_verdict.confidence).toBeLessThanOrEqual(100);
  });
});

describe("committee.buildComparisonRows", () => {
  it("preserves order and computes deltas for before-vs-after comparisons", async () => {
    const firstRound = await startReview(demoCase.input);
    const secondRound = firstRound.reviews.map((review, index) => ({
      agent: review.agent,
      label: review.label,
      updated_score: Number((review.score + 0.3 + index * 0.1).toFixed(1)),
      score_delta: Number((0.3 + index * 0.1).toFixed(1)),
      updated_stance: review.stance,
      rebuttal_quality: "partial" as const,
      key_insight: "Short updated insight",
      what_changed: "Short update",
      remaining_concerns: review.top_objections.slice(0, 2),
    }));

    const rows = buildComparisonRows(firstRound.reviews, secondRound);

    expect(rows.map(row => row.agent)).toEqual(agentOrder);
    expect(rows[0]?.score_before).toBe(firstRound.reviews[0]?.score);
    expect(rows[0]?.score_after).toBe(secondRound[0]?.updated_score);
    expect(rows.every(row => row.improved)).toBe(true);
  });
});
