import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFinalReportHtml, committeeStepRoutes, copy, demoInput, downloadFinalReport } from "@/lib/reject-me-first";
import { startReview, submitRebuttal } from "./committee";

describe("committeeStepRoutes", () => {
  it("defines the five routed steps in the expected order for both languages", () => {
    expect(committeeStepRoutes.en.map(step => step.key)).toEqual([
      "input",
      "brief",
      "review",
      "rebuttal",
      "verdict",
    ]);
    expect(committeeStepRoutes.en.every(step => step.href.startsWith("/flow/"))).toBe(true);

    expect(committeeStepRoutes.ar.map(step => step.key)).toEqual([
      "input",
      "brief",
      "review",
      "rebuttal",
      "verdict",
    ]);
    expect(committeeStepRoutes.ar[4]?.label).toBe("الحكم النهائي");
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
