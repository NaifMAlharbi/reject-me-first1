import {
  agentLabels,
  agentOrder,
  defaultStructuredInput,
  defaultStructuredRebuttal,
  rebuttalQualityLabels,
  stanceLabels,
  verdictLabels,
  type AgentKey,
  type FirstReview,
  type Language,
  type ReevaluateResult,
  type StructuredFounderInput,
} from "@shared/rejectMeFirst";

export type InputMode = "free" | "structured";
export type RebuttalMode = "free" | "structured";

export const STORAGE_KEY = "reject-me-first-flow";

export const committeeStepRoutes = {
  en: [
    { key: "input", label: "Project input", href: "/flow/input" },
    { key: "review", label: "First review", href: "/flow/review" },
    { key: "rebuttal", label: "Rebuttal", href: "/flow/rebuttal" },
    { key: "verdict", label: "Final verdict", href: "/flow/verdict" },
  ],
  ar: [
    { key: "input", label: "إدخال المشروع", href: "/flow/input" },
    { key: "review", label: "المراجعة الأولى", href: "/flow/review" },
    { key: "rebuttal", label: "الرد على الاعتراضات", href: "/flow/rebuttal" },
    { key: "verdict", label: "الحكم النهائي", href: "/flow/verdict" },
  ],
} as const;

export const copy = {
  en: {
    appName: "Reject Me First",
    eyebrow: "AI committee simulation",
    title: "A realistic investment and technical committee for startup ideas.",
    subtitle:
      "Move through the review as clear steps: submit the project, run the committee immediately, answer objections, and inspect the verdict.",
    landingDescription:
      "This is not a chatbot. The system turns founder input into a clean review package, runs three concise evaluations, and shows what changed after rebuttal.",
    startFlow: "Start review flow",
    continueFlow: "Continue current flow",
    submitProject: "Submit a real project",
    exploreDemo: "Open guided demo",
    submitProjectDesc: "Bring your own startup idea, pitch notes, or deck text and run the committee on your actual project.",
    exploreDemoDesc: "Preview the full experience with a prepared sample so you can inspect the screens before submitting your own idea.",
    projectInput: "Project input",
    projectBrief: "Project summary",
    firstReview: "First review",
    rebuttal: "Rebuttal",
    finalVerdict: "Final verdict",
    freeText: "Free text",
    structured: "Structured input",
    freeRebuttal: "Free rebuttal",
    structuredRebuttal: "Structured rebuttal",
    liveMode: "Live project review",
    mockMode: "Demo preview",
    modeHelpTitle: "What does this mode mean?",
    modeHelpLive: "GPT review sends your project to the real evaluation model and returns an actual committee assessment.",
    modeHelpMock: "Demo review is a safe sample path for testing the screens quickly without relying on the live model.",
    shortInputWarning: "The current input is too short to judge fairly. Add more detail about the idea, customer, problem, and evidence first.",
    reset: "Reset",
    loadDemo: "Load demo",
    next: "Next",
    back: "Back",
    startCommittee: "Run committee",
    openRebuttal: "Answer objections",
    openVerdict: "Open final verdict",
    downloadReport: "Download final report",
    reportReady: "Report ready",
    language: "Language",
    mode: "Mode",
    noDataYet: "No committee output yet",
    briefReady: "Project brief is ready for committee review.",
    reviewMissing: "Run the committee first to unlock this page.",
    rebuttalMissing: "Submit a rebuttal first to unlock the final verdict.",
    projectName: "Project name",
    idea: "Idea",
    problem: "Problem",
    solution: "Solution",
    additionalInfo: "Additional info",
    transcript: "Transcript text",
    dynamicSections: "Dynamic sections",
    addSection: "Add section",
    sectionTitle: "Section title",
    sectionContent: "Section content",
    remove: "Remove",
    founderNarrative: "Founder narrative",
    founderNarrativePlaceholder:
      "Describe the startup clearly. Include what it does, for whom, why it matters, and any evidence or traction.",
    transcriptPlaceholder: "Optional transcript or call notes.",
    reviewSummary: "Committee summary",
    score: "Score",
    confidence: "Confidence",
    stance: "Stance",
    keyInsight: "Key insight",
    strengths: "Strengths",
    objections: "Objections",
    summary: "Summary",
    scoreDelta: "Score change",
    whatChanged: "What changed",
    remainingConcerns: "Remaining concerns",
    comparison: "Before vs after",
    improved: "Improved",
    unchanged: "Unchanged",
    strongestPoint: "Strongest point",
    biggestRisk: "Biggest risk",
    improvedAfterRebuttal: "Improved after rebuttal",
    stillUnproven: "Still unproven",
    nextSteps: "Actionable next steps",
    linkedResponses: "Linked rebuttal responses",
    objection: "Objection",
    response: "Response",
    emptyResponseHint: "Respond only where you want to answer.",
    pageIntroBrief: "Describe the project once, then start the first committee review directly without an extra summary page.",
    pageIntroReview: "Three agents review the same brief in parallel: investor, customer, and technical.",
    pageIntroRebuttal: "Answer objections directly. The system links responses to objections before the second round.",
    pageIntroVerdict: "Inspect the score shift, stance changes, and the final committee verdict.",
    panelStatus: "Flow status",
    briefStatus: "Brief prepared",
    reviewStatus: "First review complete",
    verdictStatus: "Final verdict ready",
    savedDraft: "Your current work is preserved only inside this active flow until you reset or return home.",
    reportFileName: "reject-me-first-report",
  },
  ar: {
    appName: "Reject Me First",
    eyebrow: "محاكاة لجنة ذكاء اصطناعي",
    title: "لجنة استثمار وتقنية واقعية لتقييم أفكار الشركات الناشئة.",
    subtitle:
      "تحرّك عبر خطوات واضحة: أرسل المشروع، شغّل اللجنة مباشرة، أجب على الاعتراضات، ثم راجع الحكم النهائي.",
    landingDescription:
      "هذا ليس شات. النظام يحوّل مدخلات المؤسس إلى حزمة مراجعة واضحة، ثم يشغّل ثلاث مراجعات مختصرة ويعرض ما تغيّر بعد الرد.",
    startFlow: "ابدأ مسار المراجعة",
    continueFlow: "تابع المسار الحالي",
    submitProject: "أرسل مشروعك الحقيقي",
    exploreDemo: "افتح الديمو الجاهز",
    submitProjectDesc: "أدخل فكرتك أو ملاحظات العرض أو النص الخاص بمشروعك، وشغّل اللجنة على مشروعك الحقيقي.",
    exploreDemoDesc: "استعرض التجربة كاملة على مثال جاهز قبل ما ترسل مشروعك أنت.",
    projectInput: "إدخال المشروع",
    projectBrief: "ملخص المشروع",
    firstReview: "المراجعة الأولى",
    rebuttal: "الرد على الاعتراضات",
    finalVerdict: "الحكم النهائي",
    freeText: "نص حر",
    structured: "إدخال منظم",
    freeRebuttal: "رد حر",
    structuredRebuttal: "رد منظم",
    liveMode: "مراجعة مشروع حقيقي",
    mockMode: "عرض ديمو",
    modeHelpTitle: "وش معنى هذا الوضع؟",
    modeHelpLive: "تقييم GPT يرسل مشروعك إلى نموذج التقييم الفعلي ويعطيك مراجعة لجنة حقيقية.",
    modeHelpMock: "التقييم التجريبي مجرد مسار عرض سريع لاختبار الصفحات بدون الاعتماد على النموذج الفعلي.",
    shortInputWarning: "المدخل الحالي قصير جدًا وما يكفي لتقييم عادل. أضف تفاصيل أكثر عن الفكرة والعميل والمشكلة والدليل.",
    reset: "إعادة ضبط",
    loadDemo: "تحميل نموذج",
    next: "التالي",
    back: "رجوع",
    startCommittee: "تشغيل اللجنة",
    openRebuttal: "الرد على الاعتراضات",
    openVerdict: "فتح الحكم النهائي",
    downloadReport: "تنزيل التقرير النهائي",
    reportReady: "التقرير جاهز",
    language: "اللغة",
    mode: "الوضع",
    noDataYet: "لا توجد مخرجات بعد",
    briefReady: "ملخص المشروع جاهز لمراجعة اللجنة.",
    reviewMissing: "شغّل اللجنة أولًا لفتح هذه الصفحة.",
    rebuttalMissing: "أرسل الرد أولًا لفتح الحكم النهائي.",
    projectName: "اسم المشروع",
    idea: "الفكرة",
    problem: "المشكلة",
    solution: "الحل",
    additionalInfo: "معلومات إضافية",
    transcript: "نص تفريغ أو ملاحظات",
    dynamicSections: "أقسام إضافية",
    addSection: "إضافة قسم",
    sectionTitle: "عنوان القسم",
    sectionContent: "محتوى القسم",
    remove: "حذف",
    founderNarrative: "وصف المؤسس",
    founderNarrativePlaceholder:
      "اشرح المشروع بوضوح: ماذا يفعل، لمن، لماذا هو مهم، وما الدليل أو المؤشرات المتاحة.",
    transcriptPlaceholder: "اختياري: تفريغ مكالمة أو ملاحظات اجتماع.",
    reviewSummary: "ملخص اللجنة",
    score: "الدرجة",
    confidence: "الثقة",
    stance: "الموقف",
    keyInsight: "أهم نقطة",
    strengths: "نقاط القوة",
    objections: "الاعتراضات",
    summary: "الملخص",
    scoreDelta: "تغير الدرجة",
    whatChanged: "ما الذي تغيّر",
    remainingConcerns: "المخاوف المتبقية",
    comparison: "قبل وبعد",
    improved: "تحسن",
    unchanged: "دون تغيير",
    strongestPoint: "أقوى نقطة",
    biggestRisk: "أكبر مخاطرة",
    improvedAfterRebuttal: "ما تحسن بعد الرد",
    stillUnproven: "ما زال غير مثبت",
    nextSteps: "الخطوات المقترحة",
    linkedResponses: "الردود المرتبطة",
    objection: "الاعتراض",
    response: "الرد",
    emptyResponseHint: "أجب فقط على النقاط التي تريد الرد عليها.",
    pageIntroBrief: "اكتب المشروع مرة واحدة، ثم ابدأ المراجعة الأولى مباشرة بدون صفحة ملخص إضافية.",
    pageIntroReview: "ثلاثة وكلاء يراجعون نفس الملخص بالتوازي: المستثمر والعميل والتقني.",
    pageIntroRebuttal: "أجب على الاعتراضات مباشرة. النظام يربط الردود بالاعتراضات قبل الجولة الثانية.",
    pageIntroVerdict: "راجع تغير الدرجة وتغير الموقف والحكم النهائي للجنة.",
    panelStatus: "حالة المسار",
    briefStatus: "تم تجهيز الملخص",
    reviewStatus: "اكتملت المراجعة الأولى",
    verdictStatus: "الحكم النهائي جاهز",
    savedDraft: "يتم حفظ العمل فقط داخل هذا المسار الحالي إلى أن تعيد الضبط أو ترجع للرئيسية.",
    reportFileName: "reject-me-first-report-ar",
  },
} as const;

export function demoInput(): StructuredFounderInput {
  return {
    projectName: "BriefBridge",
    idea:
      "An AI meeting assistant that turns notes, recordings, and meeting fragments into summaries, owners, and follow-up drafts for small teams.",
    problem:
      "Small agencies and remote teams lose decisions after client and internal meetings because nobody owns documentation and follow-up.",
    solution:
      "Capture meeting input, extract decisions and tasks, assign owners, and sync summaries into Google Workspace in one workflow.",
    additionalInfo:
      "Initial focus is agencies and small remote teams running frequent Zoom calls in English and Arabic.",
    sections: [
      { title: "Business model", content: "Monthly SaaS subscription priced per workspace." },
      { title: "Differentiation", content: "Better action-item extraction for bilingual Arabic and English meetings." },
      { title: "Distribution", content: "Founder-led sales, content, and partner referrals." },
      { title: "Evidence", content: "Five pilot teams already use the workflow weekly." },
    ],
  };
}

export function detectInputLanguage(text: string): Language {
  return /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
}

export function getCombinedText(
  freeText: string,
  structured: StructuredFounderInput,
  transcriptText: string,
) {
  return [
    freeText,
    structured.projectName,
    structured.idea,
    structured.problem,
    structured.solution,
    structured.additionalInfo,
    transcriptText,
    ...structured.sections.flatMap(section => [section.title, section.content]),
  ]
    .join(" ")
    .trim();
}

export function scoreText(value: number) {
  return value.toFixed(1);
}

export function scoreDeltaText(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderList(items: string[]) {
  if (!items.length) return "<p class=\"muted\">—</p>";
  return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderLinkedRebuttal(
  language: Language,
  items: ReevaluateResult["linked_rebuttal"],
) {
  const text = copy[language];
  if (!items.length) return `<p class="muted">${escapeHtml(text.noDataYet)}</p>`;
  return `
    <table>
      <thead>
        <tr>
          <th>Agent</th>
          <th>${escapeHtml(text.objection)}</th>
          <th>${escapeHtml(text.response)}</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            item => `
            <tr>
              <td>${escapeHtml(agentLabels[language][item.agent])}</td>
              <td>${escapeHtml(item.objection)}</td>
              <td>${escapeHtml(item.response)}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderComparison(language: Language, items: ReevaluateResult["comparison"]) {
  const text = copy[language];
  if (!items.length) return `<p class="muted">${escapeHtml(text.noDataYet)}</p>`;
  return `
    <table>
      <thead>
        <tr>
          <th>Agent</th>
          <th>${escapeHtml(text.score)}</th>
          <th>${escapeHtml(text.score)} ${escapeHtml(text.next)}</th>
          <th>${escapeHtml(text.scoreDelta)}</th>
          <th>${escapeHtml(text.stance)}</th>
          <th>${escapeHtml(text.stance)} ${escapeHtml(text.next)}</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            item => `
            <tr>
              <td>${escapeHtml(item.label)}</td>
              <td>${scoreText(item.score_before)}</td>
              <td>${scoreText(item.score_after)}</td>
              <td>${scoreDeltaText(item.score_delta)}</td>
              <td>${escapeHtml(stanceLabels[language][item.stance_before])}</td>
              <td>${escapeHtml(stanceLabels[language][item.stance_after])}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

export function buildFinalReportHtml({
  language,
  firstRound,
  rebuttalResult,
}: {
  language: Language;
  firstRound: FirstReview;
  rebuttalResult: ReevaluateResult;
}) {
  const text = copy[language];
  const direction = language === "ar" ? "rtl" : "ltr";
  const brief = firstRound.projectBrief;
  const verdict = rebuttalResult.final_verdict;

  const reviewCards = firstRound.reviews
    .map(
      review => `
      <section class="panel">
        <h3>${escapeHtml(review.label)}</h3>
        <div class="metrics">
          <div><span>${escapeHtml(text.score)}</span><strong>${scoreText(review.score)}</strong></div>
          <div><span>${escapeHtml(text.confidence)}</span><strong>${review.confidence}%</strong></div>
          <div><span>${escapeHtml(text.stance)}</span><strong>${escapeHtml(stanceLabels[language][review.stance])}</strong></div>
        </div>
        <p><strong>${escapeHtml(text.keyInsight)}:</strong> ${escapeHtml(review.key_insight)}</p>
        <h4>${escapeHtml(text.strengths)}</h4>
        ${renderList(review.strengths)}
        <h4>${escapeHtml(text.objections)}</h4>
        ${renderList(review.top_objections)}
        <p><strong>${escapeHtml(text.summary)}:</strong> ${escapeHtml(review.summary)}</p>
      </section>
    `,
    )
    .join("");

  const reevalCards = rebuttalResult.second_round
    .map(
      item => `
      <section class="panel">
        <h3>${escapeHtml(item.label)}</h3>
        <div class="metrics">
          <div><span>${escapeHtml(text.score)}</span><strong>${scoreText(item.updated_score)}</strong></div>
          <div><span>${escapeHtml(text.scoreDelta)}</span><strong>${scoreDeltaText(item.score_delta)}</strong></div>
          <div><span>${escapeHtml(text.stance)}</span><strong>${escapeHtml(stanceLabels[language][item.updated_stance])}</strong></div>
          <div><span>${escapeHtml(text.response)}</span><strong>${escapeHtml(rebuttalQualityLabels[language][item.rebuttal_quality])}</strong></div>
        </div>
        <p><strong>${escapeHtml(text.keyInsight)}:</strong> ${escapeHtml(item.key_insight)}</p>
        <p><strong>${escapeHtml(text.whatChanged)}:</strong> ${escapeHtml(item.what_changed)}</p>
        <h4>${escapeHtml(text.remainingConcerns)}</h4>
        ${renderList(item.remaining_concerns)}
      </section>
    `,
    )
    .join("");

  return `
  <!doctype html>
  <html lang="${language}" dir="${direction}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(text.appName)} Report</title>
      <style>
        :root {
          color-scheme: dark;
          --bg: #0b0b0b;
          --panel: #151515;
          --line: rgba(255,255,255,0.12);
          --text: #f2ede4;
          --muted: #b9b2a6;
          --accent: #d8c39f;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 40px;
          background: var(--bg);
          color: var(--text);
          font-family: Inter, system-ui, sans-serif;
          line-height: 1.7;
        }
        .stack { display: grid; gap: 20px; }
        .hero, .panel {
          border: 1px solid var(--line);
          background: var(--panel);
          border-radius: 20px;
          padding: 24px;
        }
        .hero h1, .panel h2, .panel h3 { margin-top: 0; }
        .eyebrow {
          color: var(--accent);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .24em;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin: 16px 0;
        }
        .metrics div {
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.03);
        }
        .metrics span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
        .metrics strong { display: block; margin-top: 4px; font-size: 20px; }
        .grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
        .muted { color: var(--muted); }
        ul { margin: 8px 0 0; padding-inline-start: 18px; }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
        }
        th, td {
          border-bottom: 1px solid var(--line);
          padding: 12px 14px;
          text-align: start;
          vertical-align: top;
        }
        th { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <div class="stack">
        <section class="hero">
          <div class="eyebrow">${escapeHtml(text.eyebrow)}</div>
          <h1>${escapeHtml(text.appName)} — ${escapeHtml(text.finalVerdict)}</h1>
          <p>${escapeHtml(firstRound.projectBrief.one_line_summary)}</p>
          <div class="metrics">
            <div><span>${escapeHtml(text.score)}</span><strong>${scoreText(verdict.final_score)}</strong></div>
            <div><span>${escapeHtml(text.confidence)}</span><strong>${verdict.confidence}%</strong></div>
            <div><span>${escapeHtml(text.stance)}</span><strong>${escapeHtml(verdictLabels[language][verdict.verdict])}</strong></div>
          </div>
          <p>${escapeHtml(verdict.committee_summary)}</p>
        </section>

        <section class="panel">
          <h2>${escapeHtml(text.projectBrief)}</h2>
          <div class="grid">
            <div><strong>${escapeHtml(text.projectName)}</strong><p>${escapeHtml(brief.project_name)}</p></div>
            <div><strong>${escapeHtml(text.idea)}</strong><p>${escapeHtml(brief.one_line_summary)}</p></div>
            <div><strong>${escapeHtml(text.problem)}</strong><p>${escapeHtml(brief.problem)}</p></div>
            <div><strong>${escapeHtml(text.solution)}</strong><p>${escapeHtml(brief.solution)}</p></div>
          </div>
          <div class="grid">
            <div><strong>Target customer</strong><p>${escapeHtml(brief.target_customer)}</p></div>
            <div><strong>Business model</strong><p>${escapeHtml(brief.business_model)}</p></div>
            <div><strong>Differentiation</strong><p>${escapeHtml(brief.differentiation)}</p></div>
            <div><strong>Traction</strong><p>${escapeHtml(brief.evidence_or_traction)}</p></div>
          </div>
        </section>

        <section class="panel">
          <h2>${escapeHtml(text.firstReview)}</h2>
          <div class="stack">${reviewCards}</div>
        </section>

        <section class="panel">
          <h2>${escapeHtml(text.linkedResponses)}</h2>
          ${renderLinkedRebuttal(language, rebuttalResult.linked_rebuttal)}
        </section>

        <section class="panel">
          <h2>${escapeHtml(text.comparison)}</h2>
          ${renderComparison(language, rebuttalResult.comparison)}
        </section>

        <section class="panel">
          <h2>${escapeHtml(text.finalVerdict)}</h2>
          <p><strong>${escapeHtml(text.strongestPoint)}:</strong> ${escapeHtml(verdict.biggest_strength)}</p>
          <p><strong>${escapeHtml(text.biggestRisk)}:</strong> ${escapeHtml(verdict.biggest_risk)}</p>
          <h3>${escapeHtml(text.improvedAfterRebuttal)}</h3>
          ${renderList(verdict.what_improved_after_rebuttal)}
          <h3>${escapeHtml(text.stillUnproven)}</h3>
          ${renderList(verdict.what_still_feels_unproven)}
          <h3>${escapeHtml(text.nextSteps)}</h3>
          ${renderList(verdict.actionable_tips)}
        </section>

        <section class="panel">
          <h2>${escapeHtml(text.rebuttal)}</h2>
          <div class="stack">${reevalCards}</div>
        </section>
      </div>
    </body>
  </html>`;
}

export function downloadFinalReport({
  language,
  firstRound,
  rebuttalResult,
}: {
  language: Language;
  firstRound: FirstReview;
  rebuttalResult: ReevaluateResult;
}) {
  const html = buildFinalReportHtml({ language, firstRound, rebuttalResult });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${copy[language].reportFileName}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function initialDraft() {
  return {
    inputMode: "free" as InputMode,
    rebuttalMode: "free" as RebuttalMode,
    preferredLanguage: "en" as Language,
    useMock: false,
    selectedAgents: [...agentOrder],
    freeText: "",
    transcriptText: "",
    structured: { ...defaultStructuredInput },
    structuredRebuttal: Object.fromEntries(
      agentOrder.map(agent => [agent, [...defaultStructuredRebuttal[agent]]]),
    ) as Record<AgentKey, { objection: string; response: string }[]>,
    freeRebuttal: "",
    firstRound: null as FirstReview | null,
    rebuttalResult: null as ReevaluateResult | null,
  };
}

export function emptyLinkedResponses() {
  return agentOrder.reduce(
    (acc, agent) => {
      acc[agent] = [];
      return acc;
    },
    {} as Record<AgentKey, { objection: string; response: string }[]>,
  );
}
