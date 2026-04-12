import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFinalReportHtml, committeeStepRoutes, copy, demoInput, downloadFinalReport } from "@/lib/reject-me-first";
import { getDemoCase, startReview, submitRebuttal } from "./committee";

describe("committeeStepRoutes", () => {
  it("defines the four routed steps in the expected order for both languages", () => {
    expect(committeeStepRoutes.en.map(step => step.key)).toEqual([
      "input",
      "review",
      "rebuttal",
      "verdict",
    ]);
    expect(committeeStepRoutes.en.every(step => step.href.startsWith("/flow/"))).toBe(true);

    expect(committeeStepRoutes.ar.map(step => step.key)).toEqual([
      "input",
      "review",
      "rebuttal",
      "verdict",
    ]);
    expect(committeeStepRoutes.ar[3]?.label).toBe("الحكم النهائي");
  });

  it("keeps the landing copy focused on separate real submission and guided demo entry points", () => {
    expect(copy.en.submitProject.toLowerCase()).toContain("project");
    expect(copy.en.exploreDemo.toLowerCase()).toContain("demo");
    expect(copy.ar.submitProject).toContain("مشروع");
    expect(copy.ar.exploreDemo).toContain("ديمو");
    expect(copy.en.liveMode).not.toEqual(copy.en.mockMode);
    expect(copy.ar.liveMode).not.toEqual(copy.ar.mockMode);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildFinalReportHtml", () => {
  it("builds an English final report that includes the project brief, verdict, and review comparisons", async () => {
    const firstRound = await startReview({
      useMock: true,
      freeText:
        "An AI workflow for agencies that turns meeting notes into action items, owners, and follow-up drafts.",
      structured: demoInput(),
    });

    const rebuttalResult = await submitRebuttal({
      language: firstRound.language,
      direction: firstRound.direction,
      mode: firstRound.mode,
      projectBrief: firstRound.projectBrief,
      reviews: firstRound.reviews,
      rebuttal: {
        freeText:
          "Five pilot teams already use the product weekly, the first ICP is agencies with repeated client meetings, and the MVP stays narrow around summaries, action items, and workspace sync.",
      },
    });

    const html = buildFinalReportHtml({
      language: "en",
      firstRound,
      rebuttalResult,
    });

    expect(html).toContain('<html lang="en" dir="ltr">');
    expect(html).toContain(copy.en.projectBrief);
    expect(html).toContain(copy.en.finalVerdict);
    expect(html).toContain(firstRound.projectBrief.project_name);
    expect(html).toContain(rebuttalResult.final_verdict.committee_summary);
    expect(html).toContain(firstRound.reviews[0]!.label);
  });

  it("builds an Arabic final report with RTL direction and localized file naming support", async () => {
    const firstRound = await startReview({
      useMock: true,
      freeText: "منصة تحول ملاحظات الاجتماعات إلى مهام ومتابعات للفرق الصغيرة.",
      structured: {
        ...demoInput(),
        projectName: "جسر الاجتماعات",
      },
    });

    const rebuttalResult = await submitRebuttal({
      language: firstRound.language,
      direction: firstRound.direction,
      mode: firstRound.mode,
      projectBrief: firstRound.projectBrief,
      reviews: firstRound.reviews,
      rebuttal: {
        freeText:
          "لدينا فرق تجريبية تستخدم المنتج أسبوعيًا، ونركز على حالات استخدام محددة جدًا في البداية حتى يكون التنفيذ واقعيًا.",
      },
    });

    const html = buildFinalReportHtml({
      language: "ar",
      firstRound,
      rebuttalResult,
    });

    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain(copy.ar.projectBrief);
    expect(html).toContain(copy.ar.finalVerdict);
    expect(copy.ar.reportFileName).toContain("-ar");
  });

  it("triggers a localized browser download for the final report", async () => {
    const firstRound = await startReview({
      useMock: true,
      freeText: "An AI workflow for agencies that turns meeting notes into action items.",
      structured: demoInput(),
    });

    const rebuttalResult = await submitRebuttal({
      language: firstRound.language,
      direction: firstRound.direction,
      mode: firstRound.mode,
      projectBrief: firstRound.projectBrief,
      reviews: firstRound.reviews,
      rebuttal: {
        freeText: "The first product scope stays narrow, and pilot teams already use it weekly.",
      },
    });

    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const createObjectURL = vi.fn(() => "blob:report");
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        href: "",
        download: "",
        click,
        remove,
      })),
      body: { appendChild },
    });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    downloadFinalReport({
      language: "en",
      firstRound,
      rebuttalResult,
    });

    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });
});

import { buildFreshDraft, restoreDraftState, sanitizeStructuredFieldValue } from "../client/src/contexts/CommitteeFlowContext";
import { initialDraft } from "../client/src/lib/reject-me-first";
import { agentPrompts, reevaluatePrompts } from "./committee";

describe("committee draft reset", () => {
  it("builds a true fresh draft while preserving the selected language", () => {
    const fresh = buildFreshDraft("ar");

    expect(fresh).toMatchObject({
      ...initialDraft(),
      preferredLanguage: "ar",
      freeText: "",
      transcriptText: "",
      freeRebuttal: "",
      firstRound: null,
      rebuttalResult: null,
    });
    expect(fresh.structured.sections).toEqual([]);
    expect(fresh.structuredRebuttal.investor).toEqual([]);
    expect(fresh.structuredRebuttal.customer).toEqual([]);
    expect(fresh.structuredRebuttal.technical).toEqual([]);
  });

  it("restores malformed persisted drafts safely without reviving stale review state", () => {
    const restored = restoreDraftState({
      preferredLanguage: "en",
      freeText: "old idea",
      firstRound: null,
      rebuttalResult: null,
      structured: {
        ...initialDraft().structured,
        projectName: "Legacy Draft",
        sections: "bad-data" as never,
      },
      structuredRebuttal: {
        investor: "bad-data" as never,
        customer: [{ objection: "Price", response: "We will test" }],
        technical: undefined as never,
      },
    });

    expect(restored.freeText).toBe("old idea");
    expect(restored.firstRound).toBeNull();
    expect(restored.rebuttalResult).toBeNull();
    expect(restored.structured.projectName).toBe("Legacy Draft");
    expect(restored.structured.sections).toEqual([]);
    expect(restored.structuredRebuttal.investor).toEqual([]);
    expect(restored.structuredRebuttal.customer).toEqual([{ objection: "Price", response: "We will test" }]);
    expect(restored.structuredRebuttal.technical).toEqual([]);
  });

  it("truncates an overlong project name before it can hit the API schema limit", () => {
    const overlongName = "A".repeat(140);

    expect(sanitizeStructuredFieldValue("projectName", overlongName)).toHaveLength(120);
    expect(sanitizeStructuredFieldValue("projectName", overlongName)).toBe(overlongName.slice(0, 120));
  });

  it("sanitizes persisted project names that were saved before the 120-character guardrail existed", () => {
    const restored = restoreDraftState({
      preferredLanguage: "en",
      structured: {
        ...initialDraft().structured,
        projectName: "B".repeat(145),
      },
    });

    expect(restored.structured.projectName).toHaveLength(120);
  });
});

describe("committee demo language", () => {
  it("returns a fully Arabic demo case when Arabic is requested", () => {
    const demo = getDemoCase("ar");

    expect(demo.input.language).toBe("ar");
    expect(demo.input.structured?.projectName).toMatch(/[\u0600-\u06FF]/);
    expect(demo.rebuttal.freeText).toMatch(/[\u0600-\u06FF]/);
    expect(demo.title).toMatch(/[\u0600-\u06FF]/);
  });

  it("keeps Arabic direction and language when the Arabic demo is evaluated", async () => {
    const demo = getDemoCase("ar");
    const firstRound = await startReview(demo.input);

    expect(firstRound.language).toBe("ar");
    expect(firstRound.direction).toBe("rtl");
    expect(firstRound.projectBrief.project_name).toMatch(/[\u0600-\u06FF]/);
  });
});

describe("committee prompt quality", () => {
  it("keeps first-round prompts grounded, role-specific, and non-canned", () => {
    expect(agentPrompts.en.investor).toContain("Top objections must be specific and causal");
    expect(agentPrompts.en.customer).toContain("genuine adoption blockers");
    expect(agentPrompts.en.technical).toContain("concrete build or operations risks");

    expect(agentPrompts.ar.investor).toContain("لا عبارات عامة محفوظة");
    expect(agentPrompts.ar.customer).toContain("عوائق تبنٍ حقيقية");
    expect(agentPrompts.ar.technical).toContain("مخاطر بناء أو تشغيل ملموسة");
  });

  it("keeps second-round prompts focused on whether rebuttals actually reduce uncertainty", () => {
    expect(reevaluatePrompts.en.investor).toContain("Do not rescore the entire startup from scratch");
    expect(reevaluatePrompts.en.customer).toContain("would actually help a buyer or user say yes");
    expect(reevaluatePrompts.en.technical).toContain("reduces delivery ambiguity");

    expect(reevaluatePrompts.ar.investor).toContain("لا تعد تقييم المشروع كله من الصفر");
    expect(reevaluatePrompts.ar.customer).toContain("يساعد مستخدمًا أو مشتريًا على قول نعم");
    expect(reevaluatePrompts.ar.technical).toContain("خفّض غموض التنفيذ");
  });
});
