import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import {
  agentKeySchema,
  agentLabels,
  agentOrder,
  agentReviewSchema,
  comparisonRowSchema,
  directionSchema,
  finalVerdictSchema,
  firstReviewSchema,
  linkedRebuttalItemSchema,
  projectBriefSchema,
  reevaluateInputSchema,
  reevaluateResultSchema,
  reevaluationSchema,
  rebuttalInputSchema,
  rebuttalQualitySchema,
  startReviewInputSchema,
  stanceSchema,
  structuredFounderInputSchema,
  type AgentKey,
  type AgentReview,
  type ComparisonRow,
  type FinalVerdict,
  type FirstReview,
  type Language,
  type LinkedRebuttalItem,
  type ProjectBrief,
  type ReevaluateInput,
  type ReevaluateResult,
  type Reevaluation,
  type RebuttalInput,
  type StartReviewInput,
  type StructuredFounderInput,
} from "../shared/rejectMeFirst";

const arabicRegex = /[\u0600-\u06FF]/;

const extractorPrompt = {
  en: `You are a startup briefing analyst inside a product called Reject Me First.
Convert founder material into one clean structured project brief.
Rules:
- Merge overlapping information.
- Keep facts grounded in the input.
- Do not invent traction, revenue, customers, or proof.
- If something is missing, mark it as unknown.
- Preserve uncertainty instead of guessing.
- Return short JSON-ready field values.
- Output English only.`,
  ar: `أنت محلل Project Brief داخل منتج Reject Me First.
حوّل مدخلات المؤسس إلى Project Brief موحّد ونظيف.
القواعد:
- ادمج المعلومات المتكررة.
- التزم بما هو موجود في المدخلات فقط.
- لا تخترع traction أو عملاء أو إثباتًا غير مذكور.
- إذا كانت المعلومة ناقصة فاكتب unknown أو غير معروف بوضوح.
- حافظ على عدم اليقين بدل التخمين.
- أعد قيماً قصيرة وجاهزة للواجهة.
- أخرج العربية فقط.`,
};

const agentPrompts: Record<Language, Record<AgentKey, string>> = {
  en: {
    investor: `You are the Investor Agent in Reject Me First.
Evaluate like a realistic early-stage investor.
Be logical, concise, and fair.
Do not force objections. Do not invent problems. Do not over-analyze.
If the idea is strong or clear, say so directly.
Prefer fewer, higher-quality insights.
Return short UI-ready JSON only.`,
    customer: `You are the Customer Agent in Reject Me First.
Evaluate like a realistic customer deciding whether the offer matters.
Be logical, concise, and fair.
Do not force objections. Do not invent problems. Do not over-analyze.
If the idea is clear and valuable, say so directly.
Prefer fewer, higher-quality insights.
Return short UI-ready JSON only.`,
    technical: `You are the Technical Agent in Reject Me First.
Evaluate feasibility, implementation risk, technical clarity, and operational realism.
Be logical, concise, and fair.
Do not force objections. Do not invent problems. Do not over-analyze.
If the plan is technically straightforward or well-scoped, say so directly.
Prefer fewer, higher-quality insights.
Return short UI-ready JSON only.`,
  },
  ar: {
    investor: `أنت وكيل المستثمر داخل Reject Me First.
قيّم الفكرة كمستثمر مبكر بطريقة واقعية.
كن منطقيًا ومختصرًا وعادلًا.
لا تفرض اعتراضات. لا تخترع مشاكل. لا تبالغ في التحليل.
إذا كانت الفكرة قوية أو واضحة فقل ذلك مباشرة.
فضّل عدداً أقل من الملاحظات لكن بجودة أعلى.
أعد JSON قصيرًا وجاهزًا للواجهة فقط.`,
    customer: `أنت وكيل العميل داخل Reject Me First.
قيّم الفكرة كعميل واقعي يقرر هل العرض مهم فعلًا أم لا.
كن منطقيًا ومختصرًا وعادلًا.
لا تفرض اعتراضات. لا تخترع مشاكل. لا تبالغ في التحليل.
إذا كانت القيمة واضحة فقل ذلك مباشرة.
فضّل عدداً أقل من الملاحظات لكن بجودة أعلى.
أعد JSON قصيرًا وجاهزًا للواجهة فقط.`,
    technical: `أنت الوكيل التقني داخل Reject Me First.
قيّم القابلية التقنية للتنفيذ والمخاطر الفنية ووضوح التنفيذ وواقعية التشغيل.
كن منطقيًا ومختصرًا وعادلًا.
لا تفرض اعتراضات. لا تخترع مشاكل. لا تبالغ في التحليل.
إذا كانت الخطة التقنية مباشرة أو واضحة النطاق فقل ذلك مباشرة.
فضّل عدداً أقل من الملاحظات لكن بجودة أعلى.
أعد JSON قصيرًا وجاهزًا للواجهة فقط.`,
  },
};

const rebuttalPrompt = {
  en: `You structure founder rebuttals in Reject Me First.
Link founder responses to committee objections.
If rebuttal is free text, map it to the most relevant objection without inventing new facts.
Return concise JSON only.`,
  ar: `أنت مسؤول عن تنظيم رد المؤسس داخل Reject Me First.
اربط الردود باعتراضات اللجنة.
إذا كان الرد نصًا حرًا فقم بربطه بأقرب اعتراض مناسب دون اختراع معلومات جديدة.
أعد JSON مختصرًا فقط.`,
};

const reevaluatePrompts: Record<Language, Record<AgentKey, string>> = {
  en: {
    investor: `You are the Investor Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves investor concerns.
Stay realistic, concise, and fair.
Return short JSON only.`,
    customer: `You are the Customer Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves customer concerns.
Stay realistic, concise, and fair.
Return short JSON only.`,
    technical: `You are the Technical Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves technical concerns.
Stay realistic, concise, and fair.
Return short JSON only.`,
  },
  ar: {
    investor: `أنت وكيل المستثمر في الجولة الثانية.
احكم فقط هل رد المؤسس عالج اعتراضات المستثمر بشكل فعلي أم لا.
كن واقعيًا ومختصرًا وعادلًا.
أعد JSON قصيرًا فقط.`,
    customer: `أنت وكيل العميل في الجولة الثانية.
احكم فقط هل رد المؤسس عالج اعتراضات العميل بشكل فعلي أم لا.
كن واقعيًا ومختصرًا وعادلًا.
أعد JSON قصيرًا فقط.`,
    technical: `أنت الوكيل التقني في الجولة الثانية.
احكم فقط هل رد المؤسس عالج الاعتراضات التقنية بشكل فعلي أم لا.
كن واقعيًا ومختصرًا وعادلًا.
أعد JSON قصيرًا فقط.`,
  },
};

const judgePrompts = {
  en: `You are the Judge Agent in Reject Me First.
Combine the committee's first-round view and second-round updates.
Be realistic, concise, and fair.
Do not manufacture negativity.
If the project improved meaningfully, say so directly.
Return short JSON only.`,
  ar: `أنت وكيل الحكم النهائي داخل Reject Me First.
اجمع رأي اللجنة في الجولة الأولى مع التحديثات بعد الرد.
كن واقعيًا ومختصرًا وعادلًا.
لا تصنع سلبية غير موجودة.
إذا تحسن المشروع بوضوح فقل ذلك مباشرة.
أعد JSON قصيرًا فقط.`,
};

function getDirection(language: Language) {
  return directionSchema.parse(language === "ar" ? "rtl" : "ltr");
}

export function detectLanguage(input: string): Language {
  return arabicRegex.test(input) ? "ar" : "en";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(10, Number(score.toFixed(1))));
}

function stanceFromScore(score: number) {
  if (score >= 8.2) return stanceSchema.parse("strong");
  if (score >= 6.8) return stanceSchema.parse("promising");
  if (score >= 5.4) return stanceSchema.parse("unsure");
  if (score >= 4.1) return stanceSchema.parse("skeptical");
  return stanceSchema.parse("weak");
}

function verdictFromScore(score: number) {
  if (score >= 8.2) return "strong" as const;
  if (score >= 6.8) return "promising" as const;
  if (score >= 5.4) return "needs_work" as const;
  if (score >= 4.1) return "risky" as const;
  return "weak" as const;
}

function safeText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function unknown(language: Language) {
  return language === "ar" ? "غير معروف" : "unknown";
}

function joinTextContent(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(part =>
        typeof part === "string"
          ? part
          : typeof part === "object" && part && "type" in part && (part as { type?: string }).type === "text"
            ? String((part as { text?: string }).text ?? "")
            : "",
      )
      .join("\n")
      .trim();
  }
  return "";
}

function parseJsonContent<T>(content: unknown): T {
  const text = joinTextContent(content);
  return JSON.parse(text) as T;
}

function summarizeInputStrength(input: StartReviewInput) {
  const merged = mergeFounderInput(input);
  const normalized = merged.replace(/\s+/g, " ").trim();
  const meaningfulCharacters = normalized.replace(/[^A-Za-z\u0600-\u06FF]+/g, "");
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const filledStructuredFields = Object.values(structuredFounderInputSchema.parse(input.structured ?? {})).reduce((count, value) => {
    if (typeof value === "string") return count + (value.trim() ? 1 : 0);
    if (Array.isArray(value)) return count + value.filter(item => `${item.title} ${item.content}`.trim()).length;
    return count;
  }, 0);

  return {
    merged,
    normalized,
    meaningfulCharacterCount: meaningfulCharacters.length,
    wordCount,
    filledStructuredFields,
  };
}

export function getInputQualityIssue(input: StartReviewInput, language?: Language) {
  const detectedLanguage = language ?? inferLanguage(input);
  const strength = summarizeInputStrength(input);
  const tooShort = strength.meaningfulCharacterCount < 18;
  const tooFewWords = strength.wordCount < 4;
  const tooFewStructuredFields = strength.filledStructuredFields < 2;

  if ((tooShort && tooFewWords) || (tooShort && tooFewStructuredFields)) {
    return detectedLanguage === "ar"
      ? "المدخل قصير جدًا للتقييم. اكتب وصفًا أوضح يتضمن المشكلة والحل والفئة المستهدفة على الأقل."
      : "The submission is too short to evaluate. Please add a clearer description with at least the problem, solution, and target user.";
  }

  return null;
}

async function callStructuredModel<T>({
  system,
  user,
}: {
  system: string;
  user: string;
}): Promise<T> {
  if (ENV.openAiApiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}: ${await response.text()}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return parseJsonContent<T>(payload.choices?.[0]?.message?.content ?? "{}");
  }

  const response = await invokeLLM({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  return parseJsonContent<T>(response.choices[0]?.message.content);
}

function formatStructuredInput(structured?: StructuredFounderInput) {
  const parsed = structuredFounderInputSchema.parse(structured ?? {});
  const sections = parsed.sections
    .map(section => `${section.title}: ${section.content}`)
    .join("\n");

  return [
    parsed.projectName ? `Project name: ${parsed.projectName}` : "",
    parsed.idea ? `Idea: ${parsed.idea}` : "",
    parsed.problem ? `Problem: ${parsed.problem}` : "",
    parsed.solution ? `Solution: ${parsed.solution}` : "",
    parsed.additionalInfo ? `Additional info: ${parsed.additionalInfo}` : "",
    sections ? `Extra sections:\n${sections}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function mergeFounderInput(input: StartReviewInput) {
  const parsed = startReviewInputSchema.parse(input);
  const structuredText = formatStructuredInput(parsed.structured);

  return [
    parsed.freeText,
    structuredText,
    parsed.transcriptText ? `Voice transcript:\n${parsed.transcriptText}` : "",
    parsed.pdfText ? `PDF extracted text:\n${parsed.pdfText}` : "",
    ...parsed.extraFragments,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function inferLanguage(input: StartReviewInput) {
  if (input.language) return input.language;
  return detectLanguage(mergeFounderInput(input));
}

function trimArray(items: string[], fallback: string, max: number) {
  const unique = items.map(item => item.trim()).filter(Boolean);
  if (unique.length === 0) return [fallback].slice(0, max);
  return Array.from(new Set(unique)).slice(0, max);
}

function snippet(text: string, max = 140) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

function fallbackBrief(input: StartReviewInput, language: Language): ProjectBrief {
  const parsed = startReviewInputSchema.parse(input);
  const structured = structuredFounderInputSchema.parse(parsed.structured ?? {});
  const merged = mergeFounderInput(parsed);
  const unknownValue = unknown(language);
  const firstSentence = snippet(merged.split(/[.!؟\n]/).find(Boolean)?.trim() ?? "", 150);
  const projectName =
    safeText(structured.projectName, "") ||
    safeText(firstSentence.replace(/^project name[:\-]?/i, "").trim(), "") ||
    (language === "ar" ? "مشروع جديد" : "New project");
  const idea = safeText(structured.idea, firstSentence || unknownValue);
  const problem = safeText(structured.problem, unknownValue);
  const solution = safeText(structured.solution, unknownValue);
  const additionalInfo = safeText(structured.additionalInfo, unknownValue);

  const assumptions = trimArray(
    structured.sections
      .filter(section => /assumption|افتراض|risk|مخاطر|market|سوق|price|pricing|team|tech|تقني/i.test(section.title))
      .map(section => snippet(section.content, 160)),
    unknownValue,
    3,
  );

  const knownRisks = trimArray(
    [
      !structured.problem && language === "ar" ? "المشكلة ما تزال غير محددة بدقة." : "",
      !structured.solution && language === "ar" ? "الحل غير موضح بما يكفي." : "",
      !structured.problem && language === "en" ? "Problem clarity is still limited." : "",
      !structured.solution && language === "en" ? "Solution clarity is still limited." : "",
      structured.sections.find(section => /risk|مخاطر/i.test(section.title))?.content ?? "",
    ].map(item => snippet(item, 160)),
    unknownValue,
    3,
  );

  const unknowns = trimArray(
    [
      language === "ar" ? "حجم السوق غير مثبت." : "Market size is unproven.",
      language === "ar" ? "الطلب الحقيقي يحتاج أدلة أقوى." : "Real demand still needs stronger proof.",
      !parsed.pdfText && !parsed.transcriptText
        ? language === "ar"
          ? "لا توجد مواد داعمة إضافية حتى الآن."
          : "No extra supporting material yet."
        : "",
    ].map(item => snippet(item, 160)),
    unknownValue,
    3,
  );

  return projectBriefSchema.parse({
    project_name: projectName,
    one_line_summary: snippet(idea || firstSentence || unknownValue, 200),
    problem: snippet(problem, 680),
    solution: snippet(solution, 680),
    target_customer: snippet(
      structured.sections.find(section => /customer|client|user|عميل|مستخدم/i.test(section.title))?.content || unknownValue,
      280,
    ),
    customer_pain: snippet(problem, 280),
    business_model: snippet(
      structured.sections.find(section => /business|revenue|pricing|monetiz|نموذج|تسعير|إيراد/i.test(section.title))
        ?.content || additionalInfo,
      220,
    ),
    market_type: /government|public sector|وزارة|حكومي/i.test(merged)
      ? "B2G"
      : /business|team|company|companies|enterprise|saas|b2b|شركة|شركات/i.test(merged)
        ? "B2B"
        : /consumer|parents|students|individual|users|app|b2c|مستخدم|أفراد|طلاب/i.test(merged)
          ? "B2C"
          : "unknown",
    industry: snippet(
      structured.sections.find(section => /industry|sector|market|قطاع|صناعة/i.test(section.title))?.content || unknownValue,
      150,
    ),
    differentiation: snippet(
      structured.sections.find(section => /edge|different|advantage|ميزة|تفوق|تمييز/i.test(section.title))?.content ||
        solution ||
        unknownValue,
      300,
    ),
    distribution_strategy: snippet(
      structured.sections.find(section => /distribution|go to market|sales|channel|توزيع|تسويق|مبيعات/i.test(section.title))
        ?.content || additionalInfo,
      220,
    ),
    evidence_or_traction: snippet(
      structured.sections.find(section => /traction|evidence|pilot|users|sales|proof|إثبات|تجربة|مستخدمين|مبيعات/i.test(section.title))
        ?.content || unknownValue,
      260,
    ),
    key_assumptions: assumptions,
    known_risks: knownRisks,
    unknowns,
  });
}

async function generateBriefWithLLM(input: StartReviewInput, language: Language) {
  const raw = mergeFounderInput(input);
  const parsed = await callStructuredModel<ProjectBrief>({
    system: extractorPrompt[language],
    user: language === "ar" ? `المواد الخام:\n${raw}` : `Raw founder material:\n${raw}`,
  });

  return projectBriefSchema.parse(parsed);
}

function briefStrengthSignals(brief: ProjectBrief) {
  const text = Object.values(brief)
    .flatMap(value => (Array.isArray(value) ? value : [value]))
    .join(" ")
    .toLowerCase();

  return {
    hasEvidence: !/unknown|غير معروف/.test(brief.evidence_or_traction.toLowerCase()),
    hasDistribution: !/unknown|غير معروف/.test(brief.distribution_strategy.toLowerCase()),
    hasDifferentiation: !/unknown|غير معروف/.test(brief.differentiation.toLowerCase()),
    hasBusinessModel: !/unknown|غير معروف/.test(brief.business_model.toLowerCase()),
    technicalSignal: /api|model|workflow|integration|automation|technical|platform|تقني|تكامل|أتمتة/.test(text),
    demandSignal: /pain|problem|urgent|cost|manual|delay|friction|مشكلة|تكلفة|تأخير|معاناة/.test(text),
  };
}

function mockReviewForAgent(brief: ProjectBrief, agent: AgentKey, language: Language): AgentReview {
  const signal = briefStrengthSignals(brief);
  const baseScores: Record<AgentKey, number> = {
    investor: 5.8,
    customer: 6.1,
    technical: 5.9,
  };

  let score = baseScores[agent];
  if (signal.hasEvidence) score += 0.9;
  if (signal.hasDistribution) score += agent === "customer" ? 0.8 : 0.5;
  if (signal.hasDifferentiation) score += 0.5;
  if (signal.hasBusinessModel) score += agent === "investor" ? 0.8 : 0.3;
  if (signal.technicalSignal) score += agent === "technical" ? 0.7 : 0.2;
  if (signal.demandSignal) score += agent === "customer" ? 0.6 : 0.3;
  if (brief.unknowns.length >= 3) score -= 0.4;
  if (brief.known_risks.length >= 3) score -= 0.3;
  score = clampScore(score);

  const label = agentLabels[language][agent];
  const objectionsByAgent: Record<Language, Record<AgentKey, string[]>> = {
    en: {
      investor: [
        `Proof is still limited: ${snippet(brief.evidence_or_traction, 100)}`,
        `Distribution needs to be more concrete: ${snippet(brief.distribution_strategy, 100)}`,
        `Commercial durability depends on ${snippet(brief.key_assumptions[0] ?? "key assumptions being true", 100)}`,
      ],
      customer: [
        `Customer pain needs sharper proof: ${snippet(brief.customer_pain, 100)}`,
        `Who adopts first is not fully explicit: ${snippet(brief.target_customer, 100)}`,
        `Buying trigger still depends on ${snippet(brief.unknowns[0] ?? "real urgency", 100)}`,
      ],
      technical: [
        `Implementation scope needs clearer sequencing.`,
        `Technical delivery depends on ${snippet(brief.key_assumptions[0] ?? "key operational assumptions", 100)}`,
        `Scalability remains unproven without clearer system detail.`,
      ],
    },
    ar: {
      investor: [
        `الإثبات ما يزال محدودًا: ${snippet(brief.evidence_or_traction, 100)}`,
        `قناة الوصول تحتاج تحديدًا أوضح: ${snippet(brief.distribution_strategy, 100)}`,
        `صلابة النموذج تعتمد على ${snippet(brief.key_assumptions[0] ?? "صحة الافتراضات الأساسية", 100)}`,
      ],
      customer: [
        `ألم العميل يحتاج إثباتًا أوضح: ${snippet(brief.customer_pain, 100)}`,
        `الفئة الأولى التي ستتبنى الحل ليست محددة بالكامل: ${snippet(brief.target_customer, 100)}`,
        `دافع الشراء ما يزال مرتبطًا بـ ${snippet(brief.unknowns[0] ?? "درجة الإلحاح الفعلية", 100)}`,
      ],
      technical: [
        `نطاق التنفيذ يحتاج ترتيبًا أوضح للمراحل.`,
        `الجدوى التقنية تعتمد على ${snippet(brief.key_assumptions[0] ?? "افتراضات تشغيلية أساسية", 100)}`,
        `قابلية التوسع غير مثبتة من دون تفاصيل تقنية أوضح.`,
      ],
    },
  };

  const strengthsByAgent: Record<Language, Record<AgentKey, string[]>> = {
    en: {
      investor: [
        `The business case is clear enough to assess quickly.`,
        `The differentiation is at least directionally visible.`,
      ],
      customer: [
        `The problem statement is easy to understand.`,
        `The solution maps to a recognizable user need.`,
      ],
      technical: [
        `The concept appears technically feasible at MVP scope.`,
        `The product boundary is narrow enough to prototype.`,
      ],
    },
    ar: {
      investor: [
        `الحالة التجارية مفهومة بما يكفي للتقييم السريع.`,
        `التميّز ظاهر على الأقل بشكل مبدئي.`,
      ],
      customer: [
        `صياغة المشكلة سهلة الفهم.`,
        `الحل مرتبط بحاجة مستخدم واضحة نسبيًا.`,
      ],
      technical: [
        `المفهوم يبدو قابلًا للتنفيذ تقنيًا ضمن نطاق MVP.`,
        `حدود المنتج ضيقة بما يكفي لبناء نموذج أولي.`,
      ],
    },
  };

  const keyInsightByAgent: Record<Language, Record<AgentKey, string>> = {
    en: {
      investor: signal.hasEvidence
        ? `The case is plausible; the main question is how repeatable acquisition becomes.`
        : `The idea is understandable, but investment confidence still depends on stronger proof.`,
      customer: signal.demandSignal
        ? `The user pain sounds real; adoption clarity matters more than more features.`
        : `The offer is understandable, but user urgency is not fully proven yet.`,
      technical: signal.technicalSignal
        ? `The build looks feasible; the real question is execution discipline, not novelty.`
        : `The concept is buildable, but technical delivery is still described at a high level.`,
    },
    ar: {
      investor: signal.hasEvidence
        ? `الحالة مقنعة مبدئيًا، لكن السؤال الأهم هو قابلية تكرار الاكتساب.`
        : `الفكرة مفهومة، لكن ثقة المستثمر ما تزال مرتبطة بإثبات أقوى.`,
      customer: signal.demandSignal
        ? `ألم المستخدم يبدو حقيقيًا، والأهم الآن وضوح التبني لا زيادة المزايا.`
        : `العرض مفهوم، لكن إلحاح المستخدم لم يُثبت بالكامل بعد.`,
      technical: signal.technicalSignal
        ? `البناء يبدو ممكنًا، والسؤال الحقيقي هو انضباط التنفيذ لا غرابة الفكرة.`
        : `المفهوم قابل للبناء، لكن الوصف التقني ما يزال عالي المستوى.`,
    },
  };

  const summaryByAgent: Record<Language, Record<AgentKey, string>> = {
    en: {
      investor: `Clear enough for interest, but conviction depends on proof, channels, and repeatability.`,
      customer: `Relevant if the target user is correct, but urgency and adoption path need tighter evidence.`,
      technical: `Feasible for an MVP, though architecture and delivery assumptions still need validation.`,
    },
    ar: {
      investor: `الفكرة واضحة بما يكفي للاهتمام، لكن القناعة تحتاج إثباتًا وقنوات وصول وتكرارية أوضح.`,
      customer: `قد تكون ذات صلة إذا كانت الفئة المستهدفة صحيحة، لكن الإلحاح ومسار التبني يحتاجان أدلة أوضح.`,
      technical: `قابلة للتنفيذ كنطاق MVP، لكن الافتراضات التقنية والتنفيذية ما تزال بحاجة للتحقق.`,
    },
  };

  return agentReviewSchema.parse({
    agent,
    label,
    score,
    confidence: Math.min(96, Math.max(61, Math.round(score * 10 + (signal.hasEvidence ? 6 : 0)))),
    stance: stanceFromScore(score),
    key_insight: keyInsightByAgent[language][agent],
    top_objections: objectionsByAgent[language][agent].slice(0, 3),
    strengths: strengthsByAgent[language][agent].slice(0, 2),
    summary: summaryByAgent[language][agent],
  });
}

async function generateAgentReviewWithLLM(
  brief: ProjectBrief,
  agent: AgentKey,
  language: Language,
): Promise<AgentReview> {
  const parsed = await callStructuredModel<AgentReview>({
    system: agentPrompts[language][agent],
    user:
      language === "ar"
        ? `قيّم هذا الـ Project Brief:\n${JSON.stringify(brief, null, 2)}\nأعد الحقول التالية فقط: agent, label, score, confidence, stance, key_insight, top_objections, strengths, summary`
        : `Evaluate this project brief:\n${JSON.stringify(brief, null, 2)}\nReturn only these fields: agent, label, score, confidence, stance, key_insight, top_objections, strengths, summary`,
  });

  return agentReviewSchema.parse({ ...parsed, agent, label: agentLabels[language][agent] });
}

function getLiveMode(useMock: boolean) {
  return useMock ? "mock" : "live" as const;
}

export async function startReview(input: StartReviewInput): Promise<FirstReview> {
  const parsed = startReviewInputSchema.parse(input);
  const language = inferLanguage(parsed);
  const qualityIssue = getInputQualityIssue(parsed, language);
  if (qualityIssue) {
    throw new Error(qualityIssue);
  }
  const direction = getDirection(language);
  const mode = getLiveMode(parsed.useMock);

  let projectBrief: ProjectBrief;
  if (parsed.useMock) {
    projectBrief = fallbackBrief(parsed, language);
  } else {
    try {
      projectBrief = await generateBriefWithLLM(parsed, language);
    } catch {
      projectBrief = fallbackBrief(parsed, language);
    }
  }

  const reviews = await Promise.all(
    agentOrder.map(async agent => {
      if (parsed.useMock) return mockReviewForAgent(projectBrief, agent, language);
      try {
        return await generateAgentReviewWithLLM(projectBrief, agent, language);
      } catch {
        return mockReviewForAgent(projectBrief, agent, language);
      }
    }),
  );

  return firstReviewSchema.parse({
    language,
    direction,
    mode,
    projectBrief,
    reviews,
  });
}

function getStructuredRebuttalItems(rebuttal: RebuttalInput): LinkedRebuttalItem[] {
  const parsed = rebuttalInputSchema.parse(rebuttal);
  const structured = parsed.structured;
  if (!structured) return [];

  return [
    ...structured.investor.map(item => ({ agent: "investor" as const, ...item })),
    ...structured.customer.map(item => ({ agent: "customer" as const, ...item })),
    ...structured.technical.map(item => ({ agent: "technical" as const, ...item })),
  ].map(item => linkedRebuttalItemSchema.parse(item));
}

function mockLinkFreeTextRebuttal(
  rebuttal: RebuttalInput,
  firstReview: AgentReview[],
  language: Language,
): LinkedRebuttalItem[] {
  const text = rebuttal.freeText?.trim();
  if (!text) return [];
  const parts = text
    .split(/\n+|[.!؟]+/)
    .map(part => part.trim())
    .filter(Boolean);

  const objections = firstReview.flatMap(review =>
    review.top_objections.map(objection => ({ agent: review.agent, objection })),
  );

  return objections.slice(0, Math.min(parts.length || 1, objections.length)).map((item, index) =>
    linkedRebuttalItemSchema.parse({
      agent: item.agent,
      objection: item.objection,
      response:
        parts[index] ||
        (language === "ar"
          ? "قدّم المؤسس توضيحًا إضافيًا لكنه ما يزال مختصرًا."
          : "The founder added clarification, but it remains brief."),
    }),
  );
}

async function structureRebuttalWithLLM(
  rebuttal: RebuttalInput,
  firstReview: AgentReview[],
  language: Language,
) {
  const parsed = await callStructuredModel<{ linked_rebuttal?: LinkedRebuttalItem[]; items?: LinkedRebuttalItem[]; data?: LinkedRebuttalItem[] }>({
    system: rebuttalPrompt[language],
    user:
      language === "ar"
        ? `اعتراضات اللجنة:\n${JSON.stringify(firstReview, null, 2)}\nرد المؤسس:\n${JSON.stringify(rebuttal, null, 2)}\nأعد JSON من الحقول: agent, objection, response`
        : `Committee objections:\n${JSON.stringify(firstReview, null, 2)}\nFounder rebuttal:\n${JSON.stringify(rebuttal, null, 2)}\nReturn JSON items with fields: agent, objection, response`,
  });

  const items = parsed.linked_rebuttal ?? parsed.items ?? parsed.data ?? [];
  return items.map(item => linkedRebuttalItemSchema.parse(item));
}

export async function normalizeLinkedRebuttal(
  rebuttal: RebuttalInput,
  firstReview: AgentReview[],
  language: Language,
  useMock: boolean,
) {
  const structuredItems = getStructuredRebuttalItems(rebuttal);
  if (structuredItems.length > 0) return structuredItems;
  if (useMock) return mockLinkFreeTextRebuttal(rebuttal, firstReview, language);

  try {
    const llmItems = await structureRebuttalWithLLM(rebuttal, firstReview, language);
    return llmItems.length > 0
      ? llmItems
      : mockLinkFreeTextRebuttal(rebuttal, firstReview, language);
  } catch {
    return mockLinkFreeTextRebuttal(rebuttal, firstReview, language);
  }
}

function rebuttalQualityFromItems(items: LinkedRebuttalItem[]) {
  const totalLength = items.reduce((sum, item) => sum + item.response.length, 0);
  if (items.length >= 2 && totalLength >= 180) return rebuttalQualitySchema.parse("strong");
  if (items.length >= 1 && totalLength >= 60) return rebuttalQualitySchema.parse("partial");
  return rebuttalQualitySchema.parse("weak");
}

function mockReevaluationForAgent(
  review: AgentReview,
  linkedItems: LinkedRebuttalItem[],
  language: Language,
): Reevaluation {
  const quality = rebuttalQualityFromItems(linkedItems);
  const delta = quality === "strong" ? 0.9 : quality === "partial" ? 0.4 : 0.1;
  const updatedScore = clampScore(review.score + delta);
  const label = agentLabels[language][review.agent];
  const whatChanged =
    linkedItems.length > 0
      ? language === "ar"
        ? `الرد أضاف توضيحًا مباشرًا لبعض الاعتراضات الأساسية.`
        : `The rebuttal directly clarified part of the main concerns.`
      : language === "ar"
        ? `الرد لم يغيّر الصورة كثيرًا حتى الآن.`
        : `The rebuttal does not materially change the picture yet.`;

  const remaining =
    linkedItems.length >= 2
      ? review.top_objections.slice(1, 3)
      : review.top_objections.slice(0, 2);

  return reevaluationSchema.parse({
    agent: review.agent,
    label,
    updated_score: updatedScore,
    score_delta: clampScore(updatedScore - review.score),
    updated_stance: stanceFromScore(updatedScore),
    rebuttal_quality: quality,
    key_insight:
      linkedItems.length > 0
        ? language === "ar"
          ? `الرد حسن الوضوح، لكن الحكم النهائي ما يزال مرتبطًا بالتنفيذ.`
          : `The rebuttal improves clarity, but the verdict still depends on execution.`
        : language === "ar"
          ? `من دون رد مرتبط بوضوح، يبقى الحكم قريبًا من الجولة الأولى.`
          : `Without a clearly linked rebuttal, the view stays close to round one.`,
    what_changed: whatChanged,
    remaining_concerns: remaining,
  });
}
async function generateReevaluationWithLLM(
  review: AgentReview,
  linkedItems: LinkedRebuttalItem[],
  brief: ProjectBrief,
  language: Language,
) {
  const parsed = await callStructuredModel<Reevaluation>({
    system: reevaluatePrompts[language][review.agent],
    user:
      language === "ar"
        ? `الـ Project Brief:\n${JSON.stringify(brief, null, 2)}\nالمراجعة الأولى:\n${JSON.stringify(review, null, 2)}\nالردود المرتبطة:\n${JSON.stringify(linkedItems, null, 2)}\nأعد الحقول فقط: agent, label, updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns`
        : `Project brief:\n${JSON.stringify(brief, null, 2)}\nFirst review:\n${JSON.stringify(review, null, 2)}\nLinked rebuttal:\n${JSON.stringify(linkedItems, null, 2)}\nReturn only these fields: agent, label, updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns`,
  });

  return reevaluationSchema.parse({
 ...parsed, agent: review.agent, label: agentLabels[language][review.agent] });
}

export function buildComparisonRows(reviews: AgentReview[], secondRound: Reevaluation[]): ComparisonRow[] {
  return reviews.map(review => {
    const update = secondRound.find(item => item.agent === review.agent);
    return comparisonRowSchema.parse({
      agent: review.agent,
      label: review.label,
      score_before: review.score,
      score_after: update?.updated_score ?? review.score,
      score_delta: Number(((update?.updated_score ?? review.score) - review.score).toFixed(1)),
      stance_before: review.stance,
      stance_after: update?.updated_stance ?? review.stance,
      improved: (update?.updated_score ?? review.score) > review.score,
    });
  });
}

function mockFinalVerdict(
  brief: ProjectBrief,
  comparison: ComparisonRow[],
  secondRound: Reevaluation[],
  language: Language,
): FinalVerdict {
  const avg = secondRound.reduce((sum, item) => sum + item.updated_score, 0) / secondRound.length;
  const finalScore = clampScore(avg);
  const improved = comparison.filter(row => row.improved);
  const remaining = secondRound.flatMap(item => item.remaining_concerns).slice(0, 3);

  return finalVerdictSchema.parse({
    final_score: finalScore,
    confidence: Math.min(95, Math.max(60, Math.round(finalScore * 10))),
    verdict: verdictFromScore(finalScore),
    biggest_risk: remaining[0] || brief.known_risks[0] || (language === "ar" ? "ما يزال الطلب الفعلي غير مثبت بالكامل." : "Real demand is still not fully proven."),
    biggest_strength:
      brief.differentiation !== unknown(language)
        ? snippet(brief.differentiation, 170)
        : language === "ar"
          ? "الفكرة واضحة ويمكن فهمها بسرعة."
          : "The idea is clear enough to understand quickly.",
    what_improved_after_rebuttal:
      improved.length > 0
        ? improved
            .map(item =>
              language === "ar"
                ? `${item.label} رفع تقييمه بمقدار ${item.score_delta.toFixed(1)}.`
                : `${item.label} improved by ${item.score_delta.toFixed(1)}.`,
            )
            .slice(0, 3)
        : [language === "ar" ? "الرد حسّن الوضوح أكثر من تغيير الحكم جذريًا." : "The rebuttal improved clarity more than it changed the overall verdict."],
    what_still_feels_unproven: trimArray(remaining, language === "ar" ? "ما تزال بعض الافتراضات بحاجة لإثبات." : "Some core assumptions still need proof.", 3),
    committee_summary:
      language === "ar"
        ? `الصورة العامة ${finalScore >= 6.8 ? "واعدة" : finalScore >= 5.4 ? "قابلة للتحسن" : "ما تزال هشة"}، والقرار يعتمد على تحويل الوضوح إلى إثبات عملي.`
        : `The overall case is ${finalScore >= 6.8 ? "promising" : finalScore >= 5.4 ? "improvable" : "still fragile"}, and the outcome now depends on turning clarity into proof.`,
    actionable_tips:
      language === "ar"
        ? [
            "حوّل أهم اعتراض إلى تجربة أو دليل قصير يمكن التحقق منه.",
            "حدّد قناة الوصول الأولى بدقة بدل التوسع في أكثر من مسار.",
            "بسّط النطاق التقني إلى تسلسل تنفيذ واضح للنسخة الأولى.",
          ]
        : [
            "Turn the main objection into a short test or proof point.",
            "Define the first acquisition channel more precisely instead of spreading wider.",
            "Reduce the technical scope into a clearer MVP execution sequence.",
          ],
  });
}

async function generateFinalVerdictWithLLM(
  brief: ProjectBrief,
  reviews: AgentReview[],
  secondRound: Reevaluation[],
  language: Language,
) {
  const parsed = await callStructuredModel<FinalVerdict>({
    system: judgePrompts[language],
    user:
      language === "ar"
        ? `الـ Project Brief:\n${JSON.stringify(brief, null, 2)}\nالجولة الأولى:\n${JSON.stringify(reviews, null, 2)}\nالجولة الثانية:\n${JSON.stringify(secondRound, null, 2)}\nأعد فقط: final_score, confidence, verdict, biggest_risk, biggest_strength, what_improved_after_rebuttal, what_still_feels_unproven, committee_summary, actionable_tips`
        : `Project brief:\n${JSON.stringify(brief, null, 2)}\nFirst round:\n${JSON.stringify(reviews, null, 2)}\nSecond round:\n${JSON.stringify(secondRound, null, 2)}\nReturn only: final_score, confidence, verdict, biggest_risk, biggest_strength, what_improved_after_rebuttal, what_still_feels_unproven, committee_summary, actionable_tips`,
  });

  return finalVerdictSchema.parse(parsed);
}

export async function submitRebuttal(input: ReevaluateInput): Promise<ReevaluateResult> {
  const parsed = reevaluateInputSchema.parse(input);
  const linkedRebuttal = await normalizeLinkedRebuttal(
    parsed.rebuttal,
    parsed.reviews,
    parsed.language,
    parsed.mode === "mock",
  );

  const secondRound = await Promise.all(
    parsed.reviews.map(async review => {
      const relevantItems = linkedRebuttal.filter(item => item.agent === review.agent);
      if (parsed.mode === "mock") {
        return mockReevaluationForAgent(review, relevantItems, parsed.language);
      }

      try {
        return await generateReevaluationWithLLM(review, relevantItems, parsed.projectBrief, parsed.language);
      } catch {
        return mockReevaluationForAgent(review, relevantItems, parsed.language);
      }
    }),
  );

  const comparison = buildComparisonRows(parsed.reviews, secondRound);

  const finalVerdict = parsed.mode === "mock"
    ? mockFinalVerdict(parsed.projectBrief, comparison, secondRound, parsed.language)
    : await generateFinalVerdictWithLLM(parsed.projectBrief, parsed.reviews, secondRound, parsed.language).catch(() =>
        mockFinalVerdict(parsed.projectBrief, comparison, secondRound, parsed.language),
      );

  return reevaluateResultSchema.parse({
    language: parsed.language,
    direction: parsed.direction,
    mode: parsed.mode,
    linked_rebuttal: linkedRebuttal,
    second_round: secondRound,
    comparison,
    final_verdict: finalVerdict,
  });
}

export const demoCase = {
  title: "AI meeting assistant for SMEs",
  input: {
    language: "en",
    freeText: "",
    transcriptText: "",
    pdfText: "",
    extraFragments: [],
    useMock: true,
    structured: {
      projectName: "BriefBridge",
      idea: "An AI assistant that turns messy meeting notes into tasks, summaries, and follow-up drafts for small teams.",
      problem: "Small teams lose decisions and action items after meetings, especially when no one owns documentation.",
      solution: "Capture meeting input, extract decisions, assign tasks, and send follow-up summaries in one workflow.",
      additionalInfo: "Initial focus is agencies and small remote teams using Zoom and Google Workspace.",
      sections: [
        { title: "Business model", content: "Monthly SaaS subscription priced per workspace." },
        { title: "Differentiation", content: "Cleaner action-item extraction for mixed Arabic and English meetings." },
        { title: "Distribution", content: "Founder-led sales plus content and partner channels." },
        { title: "Evidence", content: "Early pilots with five teams and repeated weekly usage." },
      ],
    },
  },
  rebuttal: {
    freeText: "We already have five pilot teams using the workflow weekly, and the first buyers are agencies that run many client meetings. The MVP only covers summaries, action items, and workspace sync, so technical scope is intentionally narrow.",
  },
} satisfies {
  title: string;
  input: StartReviewInput;
  rebuttal: RebuttalInput;
};
