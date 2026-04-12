import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { restoreDraftState } from "@/contexts/CommitteeFlowContext";
import { getInputQualityIssue } from "./committee";

const projectRoot = path.resolve(import.meta.dirname, "..");
const committeePagesPath = path.join(projectRoot, "client", "src", "pages", "CommitteePages.tsx");
const flowShellPath = path.join(projectRoot, "client", "src", "components", "CommitteeFlowShell.tsx");

describe("committee input validation", () => {
  it("restores a saved draft by replacing fields exactly once instead of re-appending content", () => {
    const savedDraft = restoreDraftState({
      preferredLanguage: "ar",
      inputMode: "structured",
      freeText: "",
      transcriptText: "ملاحظات عميل مختصرة",
      structured: {
        projectName: "نواة",
        idea: "منصة تشغيل للفرق الصغيرة",
        problem: "الفرق تتشتت بين الأدوات",
        solution: "لوحة تشغيل واحدة",
        targetUsers: "الفرق الصغيرة",
        businessModel: "اشتراك شهري",
        traction: "",
        region: "السعودية",
        additionalInfo: "دليل أولي من 3 عملاء",
        sections: [{ title: "تفصيل", content: "نص القسم الأساسي" }],
      },
    });

    expect(savedDraft.structured.projectName).toBe("نواة");
    expect(savedDraft.structured.idea).toBe("منصة تشغيل للفرق الصغيرة");
    expect(savedDraft.structured.additionalInfo).toBe("دليل أولي من 3 عملاء");
    expect(savedDraft.transcriptText).toBe("ملاحظات عميل مختصرة");
    expect(savedDraft.structured.projectName.match(/نواة/g)?.length).toBe(1);
    expect(savedDraft.structured.sections).toEqual([{ title: "تفصيل", content: "نص القسم الأساسي" }]);
  });

  it("rejects a one-letter Arabic submission with a friendly validation message", () => {
    const issue = getInputQualityIssue({
      useMock: false,
      freeText: "ي",
      transcriptText: "",
      pdfText: "",
      structured: {
        projectName: "",
        idea: "",
        problem: "",
        solution: "",
        targetUsers: "",
        businessModel: "",
        traction: "",
        region: "",
        additionalInfo: "",
        sections: [],
      },
    }, "ar");

    expect(issue).toContain("قصير جدًا للتقييم");
  });

  it("rejects a one-letter English submission with a clear validation message", () => {
    const issue = getInputQualityIssue({
      useMock: false,
      freeText: "x",
      transcriptText: "",
      pdfText: "",
      structured: {
        projectName: "",
        idea: "",
        problem: "",
        solution: "",
        targetUsers: "",
        businessModel: "",
        traction: "",
        region: "",
        additionalInfo: "",
        sections: [],
      },
    }, "en");

    expect(issue).toContain("too short to evaluate");
  });
});

describe("persistent navigation layout", () => {
  it("keeps the homepage top bar sticky and includes language plus theme controls", () => {
    const source = readFileSync(committeePagesPath, "utf8");

    expect(source).toContain('container relative flex min-h-screen flex-col pt-5 pb-10 md:pt-6 md:pb-14');
    expect(source).toContain('grid flex-1 content-center gap-6');
    expect(source).toContain('sticky top-0 z-30');
    expect(source).toContain('flow.setPreferredLanguage("ar")');
    expect(source).toContain('flow.setPreferredLanguage("en")');
    expect(source).toContain('onClick={toggleTheme}');
    expect(source).toContain('flow.preferredLanguage === "ar" ? "الصفحة الرئيسية" : "Home"');
  });

  it("starts the first review directly from the input page and removes the PDF plus summary step", () => {
    const source = readFileSync(committeePagesPath, "utf8");

    expect(source).toContain('label: flow.text.startCommittee');
    expect(source).toContain('await flow.startCommittee();');
    expect(source).toContain('goTo("/flow/review")');
    expect(source).not.toContain('flow.text.pdf');
    expect(source).not.toContain('flow.text.pdfPlaceholder');
    expect(source).not.toContain('flow.setPdfText');
    expect(source).not.toContain('export function BriefPage');
  });

  it("keeps a persistent flow header with an explicit home button", () => {
    const source = readFileSync(flowShellPath, "utf8");

    expect(source).toContain('sticky top-4 z-40');
    expect(source).toContain('onNavigate("/")');
    expect(source).toContain('{isArabic ? "الصفحة الرئيسية" : "Home"}');
    expect(source).toContain('toggleTheme');
  });
});
