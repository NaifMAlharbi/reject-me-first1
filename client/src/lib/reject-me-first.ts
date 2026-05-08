import {
  agentOrder,
  defaultStructuredInput,
  defaultStructuredRebuttal,
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
    // Agentic features
    questionsTitle: "The Committee Has Questions",
    questionsSubtitle: "Before evaluating, the agents identified gaps in your brief. Answer their questions to get a more accurate and data-driven review.",
    questionsSkip: "Skip & evaluate without answers",
    questionsSubmit: "Submit answers & run evaluation",
    questionsLoading: "Agents are analyzing your brief...",
    questionsEmpty: "The agents have enough information. Proceeding to evaluation.",
    agentAsks: "asks",
    agentReason: "Why this matters",
    yourAnswer: "Your answer (optional)",
    agenticBadge: "🔍 Research-enhanced",
    agenticTooltip: "Agents searched the web for real market data to ground their evaluations.",
    searchesUsed: "web searches used",
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
    // Agentic features
    questionsTitle: "اللجنة لديها أسئلة",
    questionsSubtitle: "قبل التقييم، حدد الوكلاء ثغرات في ملخصك. أجب على أسئلتهم للحصول على مراجعة أدق ومبنية على بيانات حقيقية.",
    questionsSkip: "تخطّ وقيّم بدون إجابات",
    questionsSubmit: "أرسل الإجابات وابدأ التقييم",
    questionsLoading: "الوكلاء يحللون ملخصك...",
    questionsEmpty: "الوكلاء لديهم معلومات كافية. جارٍ الانتقال للتقييم.",
    agentAsks: "يسأل",
    agentReason: "لماذا هذا مهم",
    yourAnswer: "إجابتك (اختياري)",
    agenticBadge: "🔍 مُعزَّز بالبحث",
    agenticTooltip: "الوكلاء بحثوا في الإنترنت عن بيانات سوق حقيقية لتعزيز تقييماتهم.",
    searchesUsed: "عمليات بحث مستخدمة",
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
  const isAr = language === "ar";

  const scoreColor = (s: number) => s >= 7 ? "#22c55e" : s >= 5 ? "#eab308" : "#ef4444";
  const deltaPrefix = (d: number) => d > 0 ? "+" : "";

  const comparisonRows = rebuttalResult.comparison
    .map(row => `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td>${scoreText(row.score_before)}</td>
        <td style="color:${scoreColor(row.score_after)};font-weight:600">${scoreText(row.score_after)}</td>
        <td style="color:${row.score_delta > 0 ? "#22c55e" : row.score_delta < 0 ? "#ef4444" : "#888"}">${deltaPrefix(row.score_delta)}${scoreText(row.score_delta)}</td>
        <td>${escapeHtml(stanceLabels[language][row.stance_after])}</td>
      </tr>`)
    .join("");

  const numberedList = (items: string[]) =>
    items.map((item, i) => `<li><span class="num">${i + 1}</span>${escapeHtml(item)}</li>`).join("");

  const bulletList = (items: string[]) =>
    items.map(item => `<li>${escapeHtml(item)}</li>`).join("");

  const dateStr = new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!doctype html>
<html lang="${language}" dir="${direction}">
<head>
<meta charset="UTF-8"/>
<title>${escapeHtml(brief.project_name)} — ${escapeHtml(text.finalVerdict)}</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap");
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Inter","Noto Sans Arabic",system-ui,sans-serif;color:#1a1a1a;line-height:1.6;padding:0;background:#fff}
.page{max-width:720px;margin:0 auto;padding:40px 32px}
/* Header */
.header{border-bottom:2px solid #e5e5e5;padding-bottom:20px;margin-bottom:24px}
.header .brand{font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#888;margin-bottom:4px}
.header h1{font-size:22px;font-weight:700;color:#111;margin:0 0 4px}
.header .meta{font-size:12px;color:#888}
/* Verdict hero */
.verdict-box{background:#f8f8f8;border-radius:12px;padding:20px 24px;margin-bottom:24px;display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.score-ring{width:80px;height:80px;position:relative;flex-shrink:0}
.score-ring svg{width:80px;height:80px;transform:rotate(-90deg)}
.score-ring circle{fill:none;stroke-width:5}
.score-ring .bg{stroke:#e5e5e5}
.score-ring .fg{stroke-linecap:round;transition:stroke-dashoffset .5s}
.score-val{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.score-val strong{font-size:22px;font-weight:700;line-height:1}
.score-val small{font-size:10px;color:#888}
.verdict-info{flex:1;min-width:200px}
.verdict-label{display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;padding:3px 10px;border-radius:20px;margin-bottom:6px}
.verdict-info p{font-size:13px;color:#444;margin:0}
/* Section */
.section{margin-bottom:22px}
.section h2{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#333;border-bottom:1px solid #e5e5e5;padding-bottom:6px;margin-bottom:12px}
/* Two-col grid */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.two-col .col{background:#f8f8f8;border-radius:10px;padding:14px 16px}
.two-col .col-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
.two-col .col p{font-size:13px;color:#333;margin:0}
.col-green .col-label{color:#16a34a}
.col-red .col-label{color:#dc2626}
/* Table */
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:6px}
th{text-align:start;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#888;padding:8px 10px;border-bottom:2px solid #e5e5e5}
td{padding:8px 10px;border-bottom:1px solid #f0f0f0}
tr:last-child td{border-bottom:none}
/* Lists */
ol,ul{padding-inline-start:0;list-style:none}
ol li,ul li{font-size:13px;color:#333;padding:4px 0;display:flex;align-items:baseline;gap:8px}
ul li::before{content:"•";color:#888;flex-shrink:0;font-size:14px}
.num{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#7c3aed;color:#fff;font-size:10px;font-weight:700;flex-shrink:0}
/* Brief grid */
.brief-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;font-size:13px}
.brief-grid dt{font-weight:600;color:#555}
.brief-grid dd{color:#333;margin:0 0 6px}
/* Footer */
.footer{border-top:1px solid #e5e5e5;padding-top:12px;margin-top:24px;font-size:11px;color:#aaa;text-align:center}
/* Print */
@media print{
  body{padding:0}
  .page{padding:24px 20px}
  .verdict-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .two-col .col{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .num{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
@page{margin:12mm 10mm;size:A4}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">Reject Me First</div>
    <h1>${escapeHtml(brief.project_name)}</h1>
    <div class="meta">${escapeHtml(brief.one_line_summary)} · ${dateStr}</div>
  </div>

  <div class="verdict-box">
    ${(() => {
      const r = 34;
      const circ = 2 * Math.PI * r;
      const pct = Math.min(100, Math.max(0, verdict.final_score * 10));
      const offset = circ - (pct / 100) * circ;
      return `<div class="score-ring">
        <svg viewBox="0 0 80 80"><circle class="bg" cx="40" cy="40" r="${r}"/><circle class="fg" cx="40" cy="40" r="${r}" stroke="${scoreColor(verdict.final_score)}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/></svg>
        <div class="score-val"><strong>${scoreText(verdict.final_score)}</strong><small>/10</small></div>
      </div>`;
    })()}
    <div class="verdict-info">
      <div class="verdict-label" style="background:${scoreColor(verdict.final_score)}20;color:${scoreColor(verdict.final_score)}">${escapeHtml(verdictLabels[language][verdict.verdict])}</div>
      <p>${escapeHtml(verdict.committee_summary)}</p>
    </div>
  </div>

  <div class="two-col">
    <div class="col col-green"><div class="col-label">${escapeHtml(text.strongestPoint)}</div><p>${escapeHtml(verdict.biggest_strength)}</p></div>
    <div class="col col-red"><div class="col-label">${escapeHtml(text.biggestRisk)}</div><p>${escapeHtml(verdict.biggest_risk)}</p></div>
  </div>

  <div class="section">
    <h2>${escapeHtml(text.comparison)}</h2>
    <table>
      <thead><tr>
        <th>${isAr ? "الوكيل" : "Agent"}</th>
        <th>${isAr ? "قبل" : "Before"}</th>
        <th>${isAr ? "بعد" : "After"}</th>
        <th>${isAr ? "التغيير" : "Change"}</th>
        <th>${escapeHtml(text.stance)}</th>
      </tr></thead>
      <tbody>${comparisonRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>${escapeHtml(text.stillUnproven)}</h2>
    <ul>${bulletList(verdict.what_still_feels_unproven)}</ul>
  </div>

  <div class="section">
    <h2>${escapeHtml(text.nextSteps)}</h2>
    <ol>${numberedList(verdict.actionable_tips)}</ol>
  </div>

  <div class="section">
    <h2>${escapeHtml(text.projectBrief)}</h2>
    <dl class="brief-grid">
      <dt>${escapeHtml(text.problem)}</dt><dd>${escapeHtml(brief.problem)}</dd>
      <dt>${escapeHtml(text.solution)}</dt><dd>${escapeHtml(brief.solution)}</dd>
      <dt>${isAr ? "العميل المستهدف" : "Target customer"}</dt><dd>${escapeHtml(brief.target_customer)}</dd>
      <dt>${isAr ? "نموذج العمل" : "Business model"}</dt><dd>${escapeHtml(brief.business_model)}</dd>
    </dl>
  </div>

  <div class="footer">Reject Me First · ${dateStr}</div>
</div>
<script>window.onload=function(){window.print()}</script>
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
  const win = window.open("", "_blank");
  if (!win) {
    // Fallback: download as HTML if popup is blocked
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${copy[language].reportFileName}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return;
  }
  win.document.write(html);
  win.document.close();
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
    // Agentic state
    agentQuestions: [] as { agent: string; label: string; question: string; reason: string }[],
    answeredQuestions: [] as { agent: string; question: string; answer: string }[],
    questionsGenerated: false,
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
