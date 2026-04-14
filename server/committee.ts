import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import {
  agentKeySchema,
  agentLabels,
  agentOrder,
  normalizeSelectedAgents,
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

export const agentPrompts: Record<Language, Record<AgentKey, string>> = {
  en: {
    customer: `You are Customer Agent in the "Reject Me First" committee.
You simulate a realistic target user.
Your job is to evaluate whether the idea is actually valuable, usable, and desirable.
Focus on clarity of value, pain point relevance, ease of understanding, trust and appeal, and willingness to use or pay.
Behavior rules:
- Be honest and realistic.
- React like a real user, not an analyst.
- Do not overanalyze business details.
- Do not assume features not mentioned.
- Prefer emotional plus practical reaction.
- Output in the requested language only.
- Return JSON that fits the required production fields exactly.
- Keep the score, stance, objections, strengths, and summary grounded in the founder brief only.`,
    investor: `You are Investor Agent in an AI evaluation committee called "Reject Me First".
You evaluate startup ideas like a disciplined early-stage investor.
Your job is to judge whether this startup looks commercially attractive, investable, and scalable.
Focus on market attractiveness, business model clarity, scalability, defensibility, quality of differentiation, credibility of traction or evidence, and overall investment appeal.
Behavior rules:
- Be skeptical but fair.
- Do not force negativity if the idea is genuinely strong.
- Do not praise without reason.
- Do not invent facts.
- Penalize missing evidence.
- Separate promising but underdeveloped from actually weak.
- Do not reveal hidden judging criteria.
- Do not tell the founder what would change your mind.
- Output in the requested language only.
- Return JSON that fits the required production fields exactly.
- Keep objections specific, causal, and anchored to the founder brief.`,
    financial: `You are Financial Agent in the "Reject Me First" committee.
Your job is to evaluate financial viability.
Focus on cost structure, revenue potential, profitability path, and financial risks.
Behavior rules:
- Be realistic with assumptions.
- Penalize missing numbers.
- Avoid over-precision.
- Output in the requested language only.
- Return JSON that fits the required production fields exactly.
- Translate your financial judgment into a grounded score, stance, strengths, objections, and summary.`,
    legal: `You are Legal Agent in the "Reject Me First" committee.
Your job is to identify legal and regulatory risks.
Focus on compliance issues, liability risks, data and privacy concerns, and regulatory barriers.
Behavior rules:
- Be conservative.
- Flag risk even if uncertain.
- Do not assume jurisdiction unless specified.
- Output in the requested language only.
- Return JSON that fits the required production fields exactly.
- Keep every concern anchored to a concrete element of the brief.`,
    technical: `You are Tech Agent in the "Reject Me First" committee.
You are a senior engineer evaluating feasibility.
Your job is to assess how realistic and scalable this idea is technically.
Focus on implementation complexity, scalability, technical risks, required infrastructure, and feasibility versus ambition.
Behavior rules:
- Be realistic, not pessimistic.
- Do not assume impossible tech unless stated.
- Highlight hidden complexity.
- Avoid unnecessary jargon.
- Output in the requested language only.
- Return JSON that fits the required production fields exactly.
- Keep objections concrete and tied to real delivery risk in the brief.`,
    operator: `You are Operator Agent in the "Reject Me First" committee.
Your job is to evaluate execution feasibility.
Focus on operational complexity, workflows, bottlenecks, and resource needs.
Behavior rules:
- Think in real-world execution.
- Avoid theory.
- Highlight where things break.
- Output in the requested language only.
- Return JSON that fits the required production fields exactly.
- Judge whether a small team could run this reliably in practice.`,
    marketing: `You are Marketing Agent in the "Reject Me First" committee.
Your job is to evaluate market positioning and growth potential.
Focus on target audience clarity, differentiation, messaging strength, and growth channels.
Behavior rules:
- Be sharp on positioning.
- Avoid generic marketing advice.
- Highlight weak messaging.
- Output in the requested language only.
- Return JSON that fits the required production fields exactly.
- Turn positioning and growth quality into grounded strengths, objections, score, and summary.`,
  },
  ar: {
    customer: `أنت وكيل العميل داخل لجنة "Reject Me First".
تحاكي مستخدمًا مستهدفًا واقعيًا.
مهمتك هي تقييم ما إذا كانت الفكرة ذات قيمة فعلية وقابلة للاستخدام ومرغوبة.
ركّز على وضوح القيمة، ارتباطها بالألم، سهولة الفهم، الثقة والجاذبية، والاستعداد للاستخدام أو الدفع.
قواعد السلوك:
- كن صادقًا وواقعيًا.
- تفاعل كمستخدم حقيقي لا كمحلل.
- لا تبالغ في تحليل تفاصيل البزنس.
- لا تفترض مزايا غير مذكورة.
- فضّل التفاعل العاطفي والعملي معًا.
- أخرج باللغة المطلوبة فقط.
- أعد JSON مطابقًا تمامًا لحقول الإنتاج المطلوبة.
- اربط الدرجة والاعتراضات ونقاط القوة بملخص المؤسس فقط.`,
    investor: `أنت وكيل المستثمر داخل لجنة تقييم اسمها "Reject Me First".
تقيّم الأفكار الناشئة كمستثمر منضبط في المراحل المبكرة.
مهمتك هي الحكم على ما إذا كان المشروع جذابًا تجاريًا وقابلًا للاستثمار وقابلًا للتوسع.
ركّز على جاذبية السوق، وضوح نموذج العمل، القابلية للتوسع، القدرة الدفاعية، جودة التميّز، مصداقية التراكم أو الإثبات، والجاذبية الاستثمارية العامة.
قواعد السلوك:
- كن متشككًا لكن عادلًا.
- لا تفرض السلبية إذا كانت الفكرة قوية فعلًا.
- لا تمدح بلا سبب.
- لا تخترع حقائق.
- عاقب غياب الأدلة.
- فرّق بين فكرة واعدة لكنها غير مكتملة وبين فكرة ضعيفة فعلًا.
- لا تكشف معايير الحكم الخفية.
- لا تقل للمؤسس ما الذي سيغيّر رأيك.
- أخرج باللغة المطلوبة فقط.
- أعد JSON مطابقًا تمامًا لحقول الإنتاج المطلوبة.
- اجعل الاعتراضات محددة وسببية ومرتبطة بملخص المشروع.`,
    financial: `أنت الوكيل المالي داخل لجنة "Reject Me First".
مهمتك هي تقييم الجدوى المالية.
ركّز على هيكل التكاليف، إمكانات الإيراد، مسار الربحية، والمخاطر المالية.
قواعد السلوك:
- كن واقعيًا في الافتراضات.
- عاقب غياب الأرقام.
- تجنّب الدقة الزائدة المصطنعة.
- أخرج باللغة المطلوبة فقط.
- أعد JSON مطابقًا تمامًا لحقول الإنتاج المطلوبة.
- حوّل الحكم المالي إلى درجة وموقف واعتراضات ونقاط قوة مرتبطة بالمدخلات.`,
    legal: `أنت الوكيل القانوني داخل لجنة "Reject Me First".
مهمتك هي تحديد المخاطر القانونية والتنظيمية.
ركّز على قضايا الامتثال، مخاطر المسؤولية، مخاوف البيانات والخصوصية، والعوائق التنظيمية.
قواعد السلوك:
- كن محافظًا.
- ارفع الإشارة إلى الخطر حتى لو كان غير محسوم تمامًا.
- لا تفترض ولاية قضائية ما لم تُذكر.
- أخرج باللغة المطلوبة فقط.
- أعد JSON مطابقًا تمامًا لحقول الإنتاج المطلوبة.
- اربط كل ملاحظة بخطر ملموس داخل ملخص المشروع.`,
    technical: `أنت الوكيل التقني داخل لجنة "Reject Me First".
أنت مهندس خبير يقيّم الجدوى.
مهمتك هي تقييم مدى واقعية الفكرة وقابليتها للتوسع تقنيًا.
ركّز على تعقيد التنفيذ، القابلية للتوسع، المخاطر التقنية، البنية التحتية المطلوبة، والتوازن بين الطموح والجدوى.
قواعد السلوك:
- كن واقعيًا لا متشائمًا.
- لا تفترض تقنية مستحيلة ما لم تُذكر.
- أبرز التعقيد الخفي.
- تجنّب المصطلحات غير الضرورية.
- أخرج باللغة المطلوبة فقط.
- أعد JSON مطابقًا تمامًا لحقول الإنتاج المطلوبة.
- اجعل الاعتراضات تقنية وملموسة ومرتبطة بمخاطر التسليم الفعلية.`,
    operator: `أنت الوكيل التشغيلي داخل لجنة "Reject Me First".
مهمتك هي تقييم جدوى التنفيذ التشغيلي.
ركّز على التعقيد التشغيلي، سير العمل، نقاط الاختناق، واحتياجات الموارد.
قواعد السلوك:
- فكّر بمنطق التنفيذ الواقعي.
- تجنّب التنظير.
- أبرز أين قد تتعطل الأمور.
- أخرج باللغة المطلوبة فقط.
- أعد JSON مطابقًا تمامًا لحقول الإنتاج المطلوبة.
- قيّم ما إذا كان فريق صغير يستطيع تشغيل هذا المنتج باستقرار.`,
    marketing: `أنت الوكيل التسويقي داخل لجنة "Reject Me First".
مهمتك هي تقييم التموضع السوقي وإمكانات النمو.
ركّز على وضوح الجمهور المستهدف، التميّز، قوة الرسالة، وقنوات النمو.
قواعد السلوك:
- كن حادًا في تقييم التموضع.
- تجنّب النصائح التسويقية العامة.
- أبرز ضعف الرسائل التسويقية.
- أخرج باللغة المطلوبة فقط.
- أعد JSON مطابقًا تمامًا لحقول الإنتاج المطلوبة.
- حوّل جودة التموضع والنمو إلى اعتراضات ونقاط قوة ودرجة واضحة.`,
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

export const reevaluatePrompts: Record<Language, Record<AgentKey, string>> = {
  en: {
    customer: `You are Customer Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original customer concerns.
Do not rescore the whole startup from scratch.
Increase the score only if the rebuttal makes the value, trust, urgency, or adoption path more believable for a real user.
Keep remaining concerns concrete and user-centered.
Return concise JSON only.`,
    investor: `You are Investor Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original investor concerns.
Do not rescore the whole startup from scratch.
Increase the score only if the rebuttal adds proof, specificity, or a more credible commercial path.
Keep remaining concerns concrete and investment-relevant.
Return concise JSON only.`,
    financial: `You are Financial Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original financial concerns.
Do not rescore the whole startup from scratch.
Increase the score only if the rebuttal improves clarity around costs, revenue logic, margins, or path to profitability.
Keep remaining concerns concrete and financially grounded.
Return concise JSON only.`,
    legal: `You are Legal Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original legal and regulatory concerns.
Do not rescore the whole startup from scratch.
Increase the score only if the rebuttal reduces compliance, liability, privacy, or regulatory uncertainty.
Keep remaining concerns concrete and risk-aware.
Return concise JSON only.`,
    technical: `You are Tech Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original technical concerns.
Do not rescore the whole startup from scratch.
Increase the score only if the rebuttal reduces delivery ambiguity, infrastructure risk, or hidden complexity.
Keep remaining concerns concrete and practical.
Return concise JSON only.`,
    operator: `You are Operator Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original execution concerns.
Do not rescore the whole startup from scratch.
Increase the score only if the rebuttal makes workflows, resourcing, or bottleneck handling more credible.
Keep remaining concerns concrete and operational.
Return concise JSON only.`,
    marketing: `You are Marketing Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original positioning and growth concerns.
Do not rescore the whole startup from scratch.
Increase the score only if the rebuttal makes the audience, message, channel, or differentiation story more credible.
Keep remaining concerns concrete and market-facing.
Return concise JSON only.`,
  },
  ar: {
    customer: `أنت وكيل العميل في الجولة الثانية.
احكم فقط هل رد المؤسس عالج اعتراضات العميل الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر.
ارفع الدرجة فقط إذا جعل الرد القيمة أو الثقة أو الإلحاح أو مسار التبني أكثر تصديقًا لمستخدم حقيقي.
اجعل المخاوف المتبقية محددة ومن منظور العميل.
أعد JSON مختصرًا فقط.`,
    investor: `أنت وكيل المستثمر في الجولة الثانية.
احكم فقط هل رد المؤسس عالج اعتراضات المستثمر الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر.
ارفع الدرجة فقط إذا أضاف الرد إثباتًا أو تحديدًا أو مسارًا تجاريًا أكثر مصداقية.
اجعل المخاوف المتبقية محددة ومرتبطة بقرار الاستثمار.
أعد JSON مختصرًا فقط.`,
    financial: `أنت الوكيل المالي في الجولة الثانية.
احكم فقط هل رد المؤسس عالج الاعتراضات المالية الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر.
ارفع الدرجة فقط إذا حسّن الرد وضوح التكاليف أو منطق الإيرادات أو الهوامش أو مسار الربحية.
اجعل المخاوف المتبقية محددة ومرتبطة بالجدوى المالية.
أعد JSON مختصرًا فقط.`,
    legal: `أنت الوكيل القانوني في الجولة الثانية.
احكم فقط هل رد المؤسس عالج الاعتراضات القانونية والتنظيمية الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر.
ارفع الدرجة فقط إذا خفّض الرد عدم اليقين في الامتثال أو المسؤولية أو الخصوصية أو التنظيم.
اجعل المخاوف المتبقية محددة ومرتبطة بالمخاطر القانونية.
أعد JSON مختصرًا فقط.`,
    technical: `أنت الوكيل التقني في الجولة الثانية.
احكم فقط هل رد المؤسس عالج الاعتراضات التقنية الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر.
ارفع الدرجة فقط إذا خفّض الرد غموض التنفيذ أو مخاطر البنية التحتية أو التعقيد الخفي.
اجعل المخاوف المتبقية محددة وعملية.
أعد JSON مختصرًا فقط.`,
    operator: `أنت الوكيل التشغيلي في الجولة الثانية.
احكم فقط هل رد المؤسس عالج اعتراضات التنفيذ والتشغيل الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر.
ارفع الدرجة فقط إذا جعل الرد سير العمل أو الموارد أو معالجة نقاط الاختناق أكثر مصداقية.
اجعل المخاوف المتبقية محددة ومنظورة تشغيليًا.
أعد JSON مختصرًا فقط.`,
    marketing: `أنت الوكيل التسويقي في الجولة الثانية.
احكم فقط هل رد المؤسس عالج اعتراضات التموضع والنمو الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر.
ارفع الدرجة فقط إذا جعل الرد الجمهور أو الرسالة أو القنوات أو التميّز أكثر إقناعًا.
اجعل المخاوف المتبقية محددة ومنظورة سوقيًا.
أعد JSON مختصرًا فقط.`,
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

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) return fenced;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text.trim();
}

function parseJsonContent<T>(content: unknown): T {
  const text = extractJsonObject(joinTextContent(content));
  if (!text) {
    throw new Error("Structured model returned empty content.");
  }
  return JSON.parse(text) as T;
}

function summarizeInputStrength(input: StartReviewInput) {
  const merged = mergeFounderInput(input);
  const normalized = merged.replace(/\s+/g, " ").trim();
  const meaningfulCharacters = normalized.replace(/[^A-Za-z\u0600-\u06FF]+/g, "");
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const wordTokens = normalized.match(/[A-Za-z\u0600-\u06FF]{2,}/g) ?? [];
  const uniqueWordCount = new Set(wordTokens.map(token => token.toLowerCase())).size;
  const uniqueCharacterCount = new Set(meaningfulCharacters.toLowerCase().split("")).size;
  const collapsed = normalized.replace(/\s+/g, "");
  const repeatedCharacterSpam = /^([A-Za-z\u0600-\u06FF])\1{3,}$/.test(collapsed);
  const structured = structuredFounderInputSchema.parse(input.structured ?? {});
  const filledStructuredFields = Object.values(structured).reduce((count, value) => {
    if (typeof value === "string") return count + (value.trim() ? 1 : 0);
    if (Array.isArray(value)) return count + value.filter(item => `${item.title} ${item.content}`.trim()).length;
    return count;
  }, 0);
  const coreNarrativeFieldCount = [structured.idea, structured.problem, structured.solution].filter(value => value.trim()).length;

  return {
    merged,
    normalized,
    meaningfulCharacterCount: meaningfulCharacters.length,
    wordCount,
    uniqueWordCount,
    uniqueCharacterCount,
    repeatedCharacterSpam,
    filledStructuredFields,
    coreNarrativeFieldCount,
  };
}

export function getInputQualityIssue(input: StartReviewInput, language?: Language) {
  const detectedLanguage = language ?? inferLanguage(input);
  const strength = summarizeInputStrength(input);
  const tooShort = strength.meaningfulCharacterCount < 18;
  const tooFewWords = strength.wordCount < 4;
  const tooFewStructuredFields = strength.filledStructuredFields < 2;
  const tooFewCoreNarrativeFields = strength.coreNarrativeFieldCount < 2 && strength.wordCount < 18;
  const repetitiveJunk = strength.repeatedCharacterSpam || (strength.meaningfulCharacterCount < 32 && strength.uniqueCharacterCount < 4) || (strength.wordCount < 8 && strength.uniqueWordCount < 3);

  if ((tooShort && tooFewWords) || (tooShort && tooFewStructuredFields) || repetitiveJunk || tooFewCoreNarrativeFields) {
    return detectedLanguage === "ar"
      ? "المدخل غير كافٍ للتقييم الجاد. اكتب وصفًا واضحًا يتضمن الفكرة، المشكلة، الحل، والفئة المستهدفة بدل الكلمات القصيرة أو العشوائية."
      : "The submission is not detailed enough for a serious evaluation. Please describe the idea, problem, solution, and target user instead of short or random text.";
  }

  return null;
}

async function requestStructuredContent(system: string, user: string) {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new Error("Internal LLM returned empty content.");
  }

  return content;
}

async function callStructuredModel<T>({
  system,
  user,
}: {
  system: string;
  user: string;
}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const rawContent = await requestStructuredContent(
        system,
        attempt === 0
          ? user
          : `${user}\n\nReturn valid JSON only. Do not add markdown fences, commentary, or extra prose outside the JSON object.`,
      );
      return parseJsonContent<T>(rawContent);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Structured model request failed.");
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

const reviewGenericFragments: Record<Language, string[]> = {
  en: [
    "needs clearer",
    "needs more validation",
    "not fully explicit",
    "easy to understand",
    "relevant if",
    "feasible for an mvp",
    "described at a high level",
  ],
  ar: [
    "يحتاج تحديدًا أوضح",
    "يحتاج إثباتًا أوضح",
    "مفهومة",
    "مبدئي",
    "قابلة للتنفيذ",
    "عالي المستوى",
    "غير مثبت",
  ],
};

const commonKeywordStopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "your",
  "their",
  "they",
  "have",
  "will",
  "need",
  "needs",
  "more",
  "than",
  "about",
  "because",
  "على",
  "من",
  "الى",
  "إلى",
  "في",
  "عن",
  "مع",
  "هذا",
  "هذه",
  "ذلك",
  "لكن",
  "لأن",
  "التي",
  "الذي",
  "هناك",
  "عند",
  "بعد",
  "قبل",
  "ضمن",
  "فقط",
]);

function getBriefKeywords(brief: ProjectBrief) {
  const source = [
    brief.project_name,
    brief.one_line_summary,
    brief.problem,
    brief.solution,
    brief.target_customer,
    brief.customer_pain,
    brief.business_model,
    brief.industry,
    brief.differentiation,
    brief.distribution_strategy,
    brief.evidence_or_traction,
    ...brief.key_assumptions,
    ...brief.known_risks,
    ...brief.unknowns,
  ]
    .join(" ")
    .toLowerCase();

  const tokens = source.match(/[a-z\u0600-\u06ff]{3,}/g) ?? [];
  return Array.from(new Set(tokens.filter(token => token.length >= 4 && !commonKeywordStopWords.has(token)))).slice(0, 48);
}

function lineTouchesBrief(line: string, keywords: string[]) {
  const normalized = line.toLowerCase();
  return keywords.some(keyword => normalized.includes(keyword));
}

function reviewNeedsSpecificity(review: AgentReview, brief: ProjectBrief, language: Language) {
  const keywords = getBriefKeywords(brief);
  const objectionAnchors = review.top_objections.filter(objection => lineTouchesBrief(objection, keywords)).length;
  const strengthAnchors = review.strengths.filter(strength => lineTouchesBrief(strength, keywords)).length;
  const allLines = [...review.top_objections, ...review.strengths, review.key_insight, review.summary].map(line => line.toLowerCase());
  const genericHits = allLines.filter(line => reviewGenericFragments[language].some(fragment => line.includes(fragment))).length;
  const unknownHits = allLines.filter(line => line.includes(language === "ar" ? "غير معروف" : "unknown")).length;
  const shortObjections = review.top_objections.filter(objection => objection.trim().length < 36).length;

  return (
    objectionAnchors < Math.min(2, review.top_objections.length) ||
    strengthAnchors < Math.min(1, review.strengths.length) ||
    genericHits >= 3 ||
    unknownHits >= 2 ||
    shortObjections >= 2
  );
}

function factBoundReview(review: AgentReview, brief: ProjectBrief, agent: AgentKey, language: Language): AgentReview {
  const projectName = safeText(brief.project_name, language === "ar" ? "المشروع" : "the product");
  const problem = snippet(safeText(brief.problem, unknown(language)), 90);
  const solution = snippet(safeText(brief.solution, unknown(language)), 90);
  const customer = snippet(safeText(brief.target_customer, unknown(language)), 72);
  const pain = snippet(safeText(brief.customer_pain, unknown(language)), 88);
  const distribution = snippet(safeText(brief.distribution_strategy, unknown(language)), 84);
  const traction = snippet(safeText(brief.evidence_or_traction, unknown(language)), 84);
  const businessModel = snippet(safeText(brief.business_model, unknown(language)), 72);
  const differentiation = snippet(safeText(brief.differentiation, unknown(language)), 80);
  const firstUnknown = snippet(brief.unknowns.find(Boolean) ?? unknown(language), 72);
  const firstRisk = snippet(brief.known_risks.find(Boolean) ?? unknown(language), 72);

  const objectionTemplates: Record<Language, Record<AgentKey, string[]>> = {
    en: {
      customer: [
        `A buyer still has to connect ${solution} to the real pain of ${pain}, or the offer risks sounding helpful but not urgent.`,
        `Adoption friction remains tied to whether ${customer} will change existing behavior without clearer proof beyond ${traction}.`,
        `The value story is promising, but users may still hesitate if ${differentiation} does not feel meaningfully better than current habits.`,
      ],
      investor: [
        `Proof still leans on ${traction}, so the investment case depends on whether that signal can convert into repeatable demand.`,
        `Distribution still centers on ${distribution}, which leaves scale risk high if founder-led motion does not compound.`,
        `${businessModel} is directionally useful, but the case still hinges on whether ${customer} will pay before the wedge broadens.`,
      ],
      financial: [
        `The economics still hinge on whether ${businessModel} can cover delivery reality rather than just support the pitch narrative.`,
        `Revenue confidence still depends on converting ${traction} into paying behavior from ${customer}, not just interest.`,
        `The margin story remains exposed if ${distribution} keeps acquisition expensive or too manual to repeat.`,
      ],
      legal: [
        `Legal exposure is still hard to underwrite because ${firstRisk} could create obligations that the current brief does not fully price in.`,
        `Serving ${customer} may trigger compliance expectations that are not yet explicit in how ${solution} will operate.`,
        `Risk remains elevated until the team clarifies how sensitive data, claims, or liability will be handled beyond the current outline.`,
      ],
      technical: [
        `The MVP promise still depends on shipping ${solution} without hidden scope around ${firstUnknown}, which raises delivery risk.`,
        `Operational complexity is still unclear because ${firstRisk}, so a small team may struggle to keep the first release reliable.`,
        `The technical wedge is plausible, but the path from ${problem} to a shippable product still needs disciplined sequencing for a small team.`,
      ],
      operator: [
        `Execution still depends on whether the workflow behind ${solution} can run consistently without the founders manually patching every exception.`,
        `The operating model remains fragile if ${distribution} creates unpredictable handoffs, service effort, or onboarding load.`,
        `Day-to-day delivery risk is still high until the team makes the first bottleneck clearer for ${customer}.`,
      ],
      marketing: [
        `Growth still depends on whether ${customer} instantly understand why ${differentiation} matters, and that message is not yet fully sharp.`,
        `Channel confidence remains limited because ${distribution} sounds directional rather than like a repeatable go-to-market engine.`,
        `The story risks blending into the market unless ${solution} is framed with clearer contrast against existing habits and alternatives.`,
      ],
    },
    ar: {
      customer: [
        `ما يزال العميل بحاجة إلى ربط ${solution} مباشرةً بالألم الحقيقي وهو ${pain}، وإلا قد يبدو العرض مفيدًا لكنه غير عاجل.`,
        `يبقى احتكاك التبني مرتبطًا بمدى استعداد ${customer} لتغيير السلوك الحالي من دون دليل أوضح يتجاوز ${traction}.`,
        `قصة القيمة واعدة، لكن التردد سيبقى قائمًا إذا لم يشعر المستخدم أن ${differentiation} أفضل بوضوح من العادة الحالية.`,
      ],
      investor: [
        `ما يزال الإثبات معتمدًا على ${traction}، لذلك تبقى الحالة الاستثمارية مرتبطة بقدرة هذا المؤشر على التحول إلى طلب متكرر.`,
        `ما تزال قناة الوصول تعتمد على ${distribution}، وهذا يرفع مخاطر التوسع إذا لم تتحول الجهود المؤسسية إلى قناة قابلة للتكرار.`,
        `يبدو ${businessModel} منطقيًا مبدئيًا، لكن الحالة ما تزال مرتبطة بإثبات أن ${customer} سيدفع قبل اتساع الوتد الأولي.`,
      ],
      financial: [
        `ما تزال اقتصاديات المشروع مرتبطة بقدرة ${businessModel} على تغطية واقع التنفيذ لا مجرد دعم القصة في العرض.`,
        `الثقة في الإيراد ما تزال معلقة على تحويل ${traction} إلى سلوك دفع فعلي من ${customer} لا مجرد اهتمام.`,
        `قصة الهامش تبقى مكشوفة إذا ظل ${distribution} يفرض تكلفة اكتساب مرتفعة أو جهدًا يدويًا يصعب تكراره.`,
      ],
      legal: [
        `يبقى التعرض القانوني صعب التقييم لأن ${firstRisk} قد يخلق التزامات لا يعالجها الملخص الحالي بما يكفي.`,
        `خدمة ${customer} قد تفرض متطلبات امتثال لم تُشرح بعد بوضوح في طريقة تشغيل ${solution}.`,
        `تبقى المخاطر مرتفعة حتى يوضح الفريق كيفية التعامل مع البيانات الحساسة أو الادعاءات أو المسؤولية بشكل أدق من الصياغة الحالية.`,
      ],
      technical: [
        `وعد الـ MVP ما يزال مرتبطًا بإمكانية شحن ${solution} من دون توسع خفي مرتبط بـ ${firstUnknown}، وهذا يرفع مخاطر التنفيذ.`,
        `ما يزال التعقيد التشغيلي غير محسوم بسبب ${firstRisk}، وقد يضغط ذلك على فريق صغير عند تشغيل النسخة الأولى.`,
        `الفكرة التقنية ممكنة مبدئيًا، لكن تحويل ${problem} إلى منتج قابل للشحن ما يزال يحتاج ترتيب نطاق أكثر انضباطًا للفريق الصغير.`,
      ],
      operator: [
        `ما يزال التنفيذ اليومي مرتبطًا بقدرة سير العمل خلف ${solution} على الاستمرار من دون تدخل يدوي مستمر من المؤسسين.`,
        `النموذج التشغيلي يبقى هشًا إذا كان ${distribution} يخلق تسليمات متقطعة أو عبئًا عاليًا في الخدمة أو التهيئة.`,
        `تبقى مخاطر التشغيل اليومية مرتفعة حتى يوضح الفريق أول نقطة اختناق فعلية لدى ${customer}.`,
      ],
      marketing: [
        `ما يزال النمو مرتبطًا بمدى فهم ${customer} مباشرةً لماذا ${differentiation} مهم، وهذه الرسالة لم تصبح حادة بالكامل بعد.`,
        `الثقة في القنوات ما تزال محدودة لأن ${distribution} يبدو اتجاهًا عامًا أكثر من كونه محرك وصول قابلًا للتكرار.`,
        `قد تذوب القصة في السوق إذا لم يُعرض ${solution} بتباين أوضح أمام العادات الحالية والبدائل الموجودة.`,
      ],
    },
  };

  const strengthTemplates: Record<Language, Record<AgentKey, string[]>> = {
    en: {
      customer: [
        `The offer is easy to grasp because it connects ${solution} to ${pain}.`,
        `${differentiation} gives the product a concrete angle instead of a vague all-in-one promise.`,
      ],
      investor: [
        `${projectName} is not abstract: it targets ${customer} and ties the pitch to ${problem}.`,
        `There is at least some signal in ${traction}, which gives the team a starting point beyond pure idea-stage claims.`,
      ],
      financial: [
        `${businessModel} gives the pitch a monetization path instead of leaving revenue completely unstated.`,
        `${traction} provides at least a starting signal that can be stress-tested commercially.`,
      ],
      legal: [
        `The brief is specific enough about ${customer} and ${solution} to identify the likely compliance surface early.`,
        `The team does not hide risk entirely; mentioning ${firstRisk} gives legal review a real starting point.`,
      ],
      technical: [
        `The first version has a defined wedge around ${solution}, which is more buildable than a broad platform claim.`,
        `The brief surfaces risks like ${firstRisk}, which is more honest and usable than pretending delivery is trivial.`,
      ],
      operator: [
        `There is a visible operating workflow around ${solution}, which is better than a purely conceptual product promise.`,
        `${distribution} suggests the team has at least considered how execution reaches the first user base.`,
      ],
      marketing: [
        `${projectName} clearly names ${customer}, which gives the positioning a real audience instead of a generic market.`,
        `${differentiation} gives the story something concrete to emphasize in acquisition messaging.`,
      ],
    },
    ar: {
      customer: [
        `العرض سهل الفهم لأنه يربط ${solution} مباشرةً بـ ${pain}.`,
        `يمنح ${differentiation} المنتج زاوية واضحة بدل وعد واسع وغير محدد.`,
      ],
      investor: [
        `${projectName} ليس طرحًا عامًا؛ فهو يستهدف ${customer} ويربط الفكرة مباشرةً بـ ${problem}.`,
        `يوجد حد أدنى من الإشارة في ${traction}، وهذا يمنح الفريق نقطة انطلاق تتجاوز مرحلة الفكرة المجردة.`,
      ],
      financial: [
        `يوجد منطق ربحي أولي ظاهر في ${businessModel} بدل غياب كامل لمسار الإيراد.`,
        `وجود إشارة مثل ${traction} يمنح الحالة المالية نقطة بداية أفضل من طرح بلا أي مؤشرات.`,
      ],
      legal: [
        `المجال والعميل المستهدف واضحان بما يكفي لرؤية مواضع الامتثال الأساسية حول ${customer}.`,
        `ذكر مخاطر مثل ${firstRisk} يساعد على تقييم التعرض القانوني بدل تجاهله بالكامل.`,
      ],
      technical: [
        `النسخة الأولى تبدو محددة حول ${solution}، وهذا أسهل بناءً من وعد منصّة واسعة منذ البداية.`,
        `الملخص يذكر مخاطر مثل ${firstRisk} بدل الادعاء أن التنفيذ بسيط بالكامل، وهذه نقطة نضج مفيدة.`,
      ],
      operator: [
        `يوجد مسار عمل أولي يمكن تخيله حول ${solution} بدل فكرة بلا طريقة تشغيل واضحة.`,
        `وضوح ${distribution} يعطي التشغيل نقطة بداية عملية بدل اعتماد كامل على التخمين.`,
      ],
      marketing: [
        `الفكرة تستهدف ${customer} بشكل ظاهر، وهذا أفضل من رسالة عامة إلى الجميع.`,
        `يمنح ${differentiation} الفريق مادة حقيقية لبناء تموضع وتسويق أوضح.`,
      ],
    },
  };

  const summaryTemplates: Record<Language, Record<AgentKey, string>> = {
    en: {
      customer: `${projectName} addresses a real pain, but adoption still depends on whether ${customer} feel the urgency in ${pain} strongly enough to switch behavior.`,
      investor: `${projectName} has a credible wedge, but the case still turns on whether ${traction} and ${distribution} can become repeatable growth rather than one-off signal.`,
      financial: `${projectName} may have revenue potential, but the financial case still depends on whether ${businessModel} can hold up against real delivery costs and repeatable demand.`,
      legal: `${projectName} may be operable, but legal confidence still depends on how ${firstRisk} and any exposure around ${customer} are handled in practice.`,
      technical: `${projectName} looks feasible as an MVP, but execution discipline still matters because ${firstUnknown} and ${firstRisk} could expand the build unexpectedly.`,
      operator: `${projectName} has an executable shape, but real-world operations still depend on whether ${distribution} and the core workflow stay manageable for a small team.`,
      marketing: `${projectName} has a visible positioning angle, but growth still depends on whether ${customer} immediately understand why ${differentiation} matters.`,
    },
    ar: {
      customer: `${projectName} يعالج ألمًا حقيقيًا، لكن التبني ما يزال مرهونًا بشعور ${customer} بأن ${pain} مؤلم بما يكفي لتغيير السلوك.`,
      investor: `${projectName} يملك وتدًا أوليًا معقولًا، لكن الحكم ما يزال مرتبطًا بتحويل ${traction} و ${distribution} إلى نمو متكرر لا إلى إشارة عابرة فقط.`,
      financial: `${projectName} قد يملك فرصة إيراد، لكن الحالة المالية ما تزال مرتبطة بقدرة ${businessModel} على الصمود أمام تكاليف التنفيذ والطلب المتكرر.`,
      legal: `${projectName} قد يكون قابلًا للتشغيل، لكن الثقة القانونية ما تزال مرتبطة بكيفية التعامل مع ${firstRisk} وأي تعرض مرتبط بـ ${customer} عمليًا.`,
      technical: `${projectName} يبدو ممكنًا كـ MVP، لكن الانضباط التنفيذي سيظل حاسمًا لأن ${firstUnknown} و ${firstRisk} قد يوسّعان البناء بشكل غير متوقع.`,
      operator: `${projectName} يملك شكلًا تشغيليًا أوليًا، لكن نجاح التنفيذ اليومي ما يزال مرتبطًا بقدرة الفريق على ضبط ${distribution} وسير العمل الأساسي.`,
      marketing: `${projectName} يملك زاوية تموضع ظاهرة، لكن النمو ما يزال مرتبطًا بمدى فهم ${customer} مباشرةً لماذا ${differentiation} مهم فعلًا.`,
    },
  };

  return agentReviewSchema.parse({
    ...review,
    agent,
    label: agentLabels[language][agent],
    key_insight: lineTouchesBrief(review.key_insight, getBriefKeywords(brief))
      ? review.key_insight
      : strengthTemplates[language][agent][0],
    top_objections: objectionTemplates[language][agent].map(item => snippet(item, 176)).slice(0, 3),
    strengths: strengthTemplates[language][agent].map(item => snippet(item, 136)).slice(0, 2),
    summary: snippet(summaryTemplates[language][agent], 216),
  });
}

function buildAgentReviewPrompt(
  brief: ProjectBrief,
  agent: AgentKey,
  language: Language,
  previousDraft?: AgentReview,
) {
  const evidenceLines = [
    language === "ar" ? `اسم المشروع: ${brief.project_name}` : `Project name: ${brief.project_name}`,
    language === "ar" ? `الملخص: ${brief.one_line_summary}` : `One-line summary: ${brief.one_line_summary}`,
    language === "ar" ? `المشكلة: ${brief.problem}` : `Problem: ${brief.problem}`,
    language === "ar" ? `الحل: ${brief.solution}` : `Solution: ${brief.solution}`,
    language === "ar" ? `العميل المستهدف: ${brief.target_customer}` : `Target customer: ${brief.target_customer}`,
    language === "ar" ? `الألم: ${brief.customer_pain}` : `Customer pain: ${brief.customer_pain}`,
    language === "ar" ? `نموذج العمل: ${brief.business_model}` : `Business model: ${brief.business_model}`,
    language === "ar" ? `التميّز: ${brief.differentiation}` : `Differentiation: ${brief.differentiation}`,
    language === "ar" ? `قناة الوصول: ${brief.distribution_strategy}` : `Distribution strategy: ${brief.distribution_strategy}`,
    language === "ar" ? `الإثبات أو التراكم: ${brief.evidence_or_traction}` : `Evidence or traction: ${brief.evidence_or_traction}`,
    language === "ar"
      ? `افتراضات رئيسية: ${brief.key_assumptions.join(" | ")}`
      : `Key assumptions: ${brief.key_assumptions.join(" | ")}`,
    language === "ar"
      ? `مخاطر معروفة: ${brief.known_risks.join(" | ")}`
      : `Known risks: ${brief.known_risks.join(" | ")}`,
    language === "ar" ? `أمور غير معروفة: ${brief.unknowns.join(" | ")}` : `Unknowns: ${brief.unknowns.join(" | ")}`,
  ].join("\n");

  if (language === "ar") {
    return `${previousDraft ? "المسودة السابقة كانت عامة أكثر من اللازم. أعد كتابتها لتصبح أكثر ارتباطًا بالمشروع نفسه.\n" : ""}قيّم هذا الـ Project Brief بصرامة عادلة، والتزم تمامًا بشخصية وكيل ${agentLabels.ar[agent]}.

حقائق المشروع:
${evidenceLines}

قواعد إلزامية:
- كل اعتراض في top_objections يجب أن يذكر عنصرًا محددًا من الحقائق أعلاه ثم يشرح أثره السببي.
- امنع الصياغات العامة مثل: يحتاج مزيدًا من التوضيح، غير مثبت، يحتاج تحققًا أكبر، إلا إذا ذكرت ماذا تقصد بالضبط.
- اجعل الاعتراضات قصيرة لكن ملموسة، وكأنها ملاحظة من لجنة استثمار حقيقية.
- اكتب strengths على أساس ما هو موجود فعلًا، وليس مجاملة عامة.
- إذا كانت الفكرة قوية في نقطة معينة فاذكرها مباشرة من دون افتعال سلبية.
- اجعل summary حكمًا نهائيًا موجزًا من سطر أو سطرين.
- أعد الحقول التالية فقط: agent, label, score, confidence, stance, key_insight, top_objections, strengths, summary.`;
  }

  return `${previousDraft ? "The previous draft was too generic. Rewrite it so the reasoning is tied to this startup rather than generic startup advice.\n" : ""}Evaluate this project brief rigorously and stay fully in the role of the ${agentLabels.en[agent]}.

Project facts:
${evidenceLines}

Hard rules:
- Every item in top_objections must mention a specific weak point from the facts above and explain why it matters.
- Each objection must explicitly reuse at least one concrete noun or phrase from the facts above such as the customer, channel, traction, workflow, or risk.
- Do not write filler like: needs more clarity, needs more validation, unclear demand, technically risky, or unknown unless you immediately name the exact thing that is weak.
- Keep objections short but concrete, like a real investment committee note.
- Make strengths factual and earned, not polite filler.
- If one area is genuinely strong, say it directly without invented negativity.
- Make summary a crisp one- or two-sentence verdict.
- Return only these fields: agent, label, score, confidence, stance, key_insight, top_objections, strengths, summary.`;
}

function mockReviewForAgent(brief: ProjectBrief, agent: AgentKey, language: Language): AgentReview {
  const signal = briefStrengthSignals(brief);
  const baseScores: Record<AgentKey, number> = {
    customer: 6.1,
    investor: 5.8,
    financial: 5.6,
    legal: 5.4,
    technical: 5.9,
    operator: 5.7,
    marketing: 5.8,
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
      customer: [
        `Customer pain needs sharper proof: ${snippet(brief.customer_pain, 100)}`,
        `Who adopts first is not fully explicit: ${snippet(brief.target_customer, 100)}`,
        `Buying trigger still depends on ${snippet(brief.unknowns[0] ?? "real urgency", 100)}`,
      ],
      investor: [
        `Proof is still limited: ${snippet(brief.evidence_or_traction, 100)}`,
        `Distribution needs to be more concrete: ${snippet(brief.distribution_strategy, 100)}`,
        `Commercial durability depends on ${snippet(brief.key_assumptions[0] ?? "key assumptions being true", 100)}`,
      ],
      financial: [
        `Revenue logic still needs harder proof: ${snippet(brief.business_model, 100)}`,
        `Cost structure is still underexplained relative to delivery scope: ${snippet(brief.solution, 100)}`,
        `Financial upside still depends on ${snippet(brief.key_assumptions[0] ?? "core pricing assumptions holding", 100)}`,
      ],
      legal: [
        `Compliance exposure is still underspecified: ${snippet(brief.known_risks[0] ?? brief.solution, 100)}`,
        `Liability handling is not yet explicit for ${snippet(brief.target_customer, 100)}`,
        `Data and privacy risk still depend on ${snippet(brief.unknowns[0] ?? "how sensitive information is handled", 100)}`,
      ],
      technical: [
        `Implementation scope needs clearer sequencing.`,
        `Technical delivery depends on ${snippet(brief.key_assumptions[0] ?? "key operational assumptions", 100)}`,
        `Scalability remains unproven without clearer system detail.`,
      ],
      operator: [
        `Operational workflow still needs tighter definition: ${snippet(brief.solution, 100)}`,
        `Execution reliability still depends on ${snippet(brief.key_assumptions[0] ?? "consistent process discipline", 100)}`,
        `The first bottleneck is still unclear for ${snippet(brief.target_customer, 100)}`,
      ],
      marketing: [
        `Positioning is still not sharp enough against alternatives: ${snippet(brief.differentiation, 100)}`,
        `Growth channels need stronger specificity: ${snippet(brief.distribution_strategy, 100)}`,
        `The message still depends on whether ${snippet(brief.target_customer, 100)} immediately recognize the urgency.`,
      ],
    },
    ar: {
      customer: [
        `ألم العميل يحتاج إثباتًا أوضح: ${snippet(brief.customer_pain, 100)}`,
        `الفئة الأولى التي ستتبنى الحل ليست محددة بالكامل: ${snippet(brief.target_customer, 100)}`,
        `دافع الشراء ما يزال مرتبطًا بـ ${snippet(brief.unknowns[0] ?? "درجة الإلحاح الفعلية", 100)}`,
      ],
      investor: [
        `الإثبات ما يزال محدودًا: ${snippet(brief.evidence_or_traction, 100)}`,
        `قناة الوصول تحتاج تحديدًا أوضح: ${snippet(brief.distribution_strategy, 100)}`,
        `صلابة النموذج تعتمد على ${snippet(brief.key_assumptions[0] ?? "صحة الافتراضات الأساسية", 100)}`,
      ],
      financial: [
        `منطق الإيراد ما يزال بحاجة إلى إثبات أقوى: ${snippet(brief.business_model, 100)}`,
        `هيكل التكاليف غير مشروح بما يكفي مقارنة بنطاق الحل: ${snippet(brief.solution, 100)}`,
        `العائد المالي ما يزال مرتبطًا بـ ${snippet(brief.key_assumptions[0] ?? "صحة افتراضات التسعير الأساسية", 100)}`,
      ],
      legal: [
        `التعرض القانوني ما يزال غير محدد بما يكفي: ${snippet(brief.known_risks[0] ?? brief.solution, 100)}`,
        `معالجة المسؤولية ليست واضحة بعد بالنسبة إلى ${snippet(brief.target_customer, 100)}`,
        `مخاطر البيانات والخصوصية ما تزال مرتبطة بـ ${snippet(brief.unknowns[0] ?? "كيفية التعامل مع المعلومات الحساسة", 100)}`,
      ],
      technical: [
        `نطاق التنفيذ يحتاج ترتيبًا أوضح للمراحل.`,
        `الجدوى التقنية تعتمد على ${snippet(brief.key_assumptions[0] ?? "افتراضات تشغيلية أساسية", 100)}`,
        `قابلية التوسع غير مثبتة من دون تفاصيل تقنية أوضح.`,
      ],
      operator: [
        `سير العمل التشغيلي ما يزال بحاجة إلى تعريف أدق: ${snippet(brief.solution, 100)}`,
        `استقرار التنفيذ يعتمد على ${snippet(brief.key_assumptions[0] ?? "الانضباط في العملية التشغيلية", 100)}`,
        `أول نقطة اختناق ما تزال غير واضحة بالنسبة إلى ${snippet(brief.target_customer, 100)}`,
      ],
      marketing: [
        `التموضع ما يزال غير حاد بما يكفي أمام البدائل: ${snippet(brief.differentiation, 100)}`,
        `قنوات النمو تحتاج تحديدًا أقوى: ${snippet(brief.distribution_strategy, 100)}`,
        `الرسالة ما تزال مرتبطة بمدى إدراك ${snippet(brief.target_customer, 100)} للإلحاح فورًا.`,
      ],
    },
  };

  const strengthsByAgent: Record<Language, Record<AgentKey, string[]>> = {
    en: {
      customer: [
        `The problem statement is easy to understand.`,
        `The solution maps to a recognizable user need.`,
      ],
      investor: [
        `The business case is clear enough to assess quickly.`,
        `The differentiation is at least directionally visible.`,
      ],
      financial: [
        `There is at least a visible path to monetization in the current pitch.`,
        `The commercial model can be evaluated without guessing the entire business.`,
      ],
      legal: [
        `The core offer is understandable enough to identify the main legal surface area.`,
        `The brief exposes the likely compliance touchpoints instead of hiding them completely.`,
      ],
      technical: [
        `The concept appears technically feasible at MVP scope.`,
        `The product boundary is narrow enough to prototype.`,
      ],
      operator: [
        `The workflow is concrete enough to reason about day-to-day execution.`,
        `The initial operating scope looks bounded rather than sprawling.`,
      ],
      marketing: [
        `There is a visible audience and positioning angle to work with.`,
        `The differentiation can be translated into a market-facing story.`,
      ],
    },
    ar: {
      customer: [
        `صياغة المشكلة سهلة الفهم.`,
        `الحل مرتبط بحاجة مستخدم واضحة نسبيًا.`,
      ],
      investor: [
        `الحالة التجارية مفهومة بما يكفي للتقييم السريع.`,
        `التميّز ظاهر على الأقل بشكل مبدئي.`,
      ],
      financial: [
        `يوجد مسار ظاهر مبدئيًا لتحقيق الإيراد في الطرح الحالي.`,
        `يمكن تقييم النموذج التجاري من دون الاضطرار لتخمين كل تفاصيل الشركة.`,
      ],
      legal: [
        `العرض الأساسي واضح بما يكفي لرؤية السطح القانوني الرئيسي.`,
        `الملخص يكشف نقاط الامتثال المتوقعة بدل إخفائها بالكامل.`,
      ],
      technical: [
        `المفهوم يبدو قابلًا للتنفيذ تقنيًا ضمن نطاق MVP.`,
        `حدود المنتج ضيقة بما يكفي لبناء نموذج أولي.`,
      ],
      operator: [
        `سير العمل واضح بما يكفي للتفكير في التنفيذ اليومي.`,
        `النطاق التشغيلي الأولي يبدو محدودًا لا متشعبًا.`,
      ],
      marketing: [
        `هناك جمهور وزاوية تموضع ظاهرة يمكن البناء عليها.`,
        `يمكن تحويل التميّز الحالي إلى قصة تسويقية مفهومة.`,
      ],
    },
  };

  const keyInsightByAgent: Record<Language, Record<AgentKey, string>> = {
    en: {
      customer: signal.demandSignal
        ? `The user pain sounds real; adoption clarity matters more than more features.`
        : `The offer is understandable, but user urgency is not fully proven yet.`,
      investor: signal.hasEvidence
        ? `The case is plausible; the main question is how repeatable acquisition becomes.`
        : `The idea is understandable, but investment confidence still depends on stronger proof.`,
      financial: signal.hasBusinessModel
        ? `The revenue story exists, but the real question is whether margins and payback can hold in practice.`
        : `The financial case is directionally understandable, but the unit economics are still thinly specified.`,
      legal: signal.hasEvidence
        ? `The concept could move forward, but legal exposure depends on how compliance and liability are handled early.`
        : `The legal surface area is still underexplained, especially where data, claims, or responsibility could create risk.`,
      technical: signal.technicalSignal
        ? `The build looks feasible; the real question is execution discipline, not novelty.`
        : `The concept is buildable, but technical delivery is still described at a high level.`,
      operator: signal.hasDistribution
        ? `There is an execution path, but day-to-day workflow reliability still decides whether this can actually run smoothly.`
        : `The operating model is understandable, but resourcing and process bottlenecks are still underspecified.`,
      marketing: signal.hasDistribution
        ? `The go-to-market story has shape, but message sharpness and audience focus still determine whether growth compounds.`
        : `The positioning is directionally visible, but the audience and channel story still needs sharper definition.`,
    },
    ar: {
      customer: signal.demandSignal
        ? `ألم المستخدم يبدو حقيقيًا، والأهم الآن وضوح التبني لا زيادة المزايا.`
        : `العرض مفهوم، لكن إلحاح المستخدم لم يُثبت بالكامل بعد.`,
      investor: signal.hasEvidence
        ? `الحالة مقنعة مبدئيًا، لكن السؤال الأهم هو قابلية تكرار الاكتساب.`
        : `الفكرة مفهومة، لكن ثقة المستثمر ما تزال مرتبطة بإثبات أقوى.`,
      financial: signal.hasBusinessModel
        ? `هناك منطق مبدئي للإيراد، لكن السؤال الحقيقي هو قدرة الهوامش والاسترداد على الصمود عمليًا.`
        : `الحالة المالية مفهومة اتجاهيًا، لكن اقتصاديات الوحدة ما تزال غير محددة بما يكفي.`,
      legal: signal.hasEvidence
        ? `يمكن للفكرة أن تتحرك، لكن التعرض القانوني يعتمد على ضبط الامتثال والمسؤولية من البداية.`
        : `السطح القانوني للمشروع ما يزال غير مشروح بما يكفي، خصوصًا في البيانات والالتزامات والمخاطر المحتملة.`,
      technical: signal.technicalSignal
        ? `البناء يبدو ممكنًا، والسؤال الحقيقي هو انضباط التنفيذ لا غرابة الفكرة.`
        : `المفهوم قابل للبناء، لكن الوصف التقني ما يزال عالي المستوى.`,
      operator: signal.hasDistribution
        ? `هناك مسار تشغيلي مبدئي، لكن استقرار سير العمل اليومي هو ما سيحكم على قابلية التشغيل فعليًا.`
        : `النموذج التشغيلي مفهوم، لكن الموارد ونقاط الاختناق ما تزال غير محددة بما يكفي.`,
      marketing: signal.hasDistribution
        ? `قصة الوصول للسوق بدأت تتشكل، لكن حدة الرسالة وتركيز الجمهور ما يزالان العامل الحاسم للنمو.`
        : `التموضع ظاهر مبدئيًا، لكن قصة الجمهور والقنوات ما تزال بحاجة إلى تحديد أوضح.`,
    },
  };

  const summaryByAgent: Record<Language, Record<AgentKey, string>> = {
    en: {
      customer: `Relevant if the target user is correct, but urgency and adoption path need tighter evidence.`,
      investor: `Clear enough for interest, but conviction depends on proof, channels, and repeatability.`,
      financial: `Commercially interesting on the surface, but financial credibility still depends on clearer economics.`,
      legal: `Potentially workable, but legal and compliance exposure still needs more explicit handling.`,
      technical: `Feasible for an MVP, though architecture and delivery assumptions still need validation.`,
      operator: `Operationally possible, but smooth execution still depends on clearer workflows and resource assumptions.`,
      marketing: `There is a positioning angle here, but growth confidence depends on sharper messaging and channel fit.`,
    },
    ar: {
      customer: `قد تكون ذات صلة إذا كانت الفئة المستهدفة صحيحة، لكن الإلحاح ومسار التبني يحتاجان أدلة أوضح.`,
      investor: `الفكرة واضحة بما يكفي للاهتمام، لكن القناعة تحتاج إثباتًا وقنوات وصول وتكرارية أوضح.`,
      financial: `تجاريًا تبدو مثيرة للاهتمام مبدئيًا، لكن المصداقية المالية ما تزال تحتاج اقتصاديات أوضح.`,
      legal: `قد تكون قابلة للتنفيذ، لكن التعرض القانوني والامتثال ما يزالان بحاجة إلى معالجة أوضح.`,
      technical: `قابلة للتنفيذ كنطاق MVP، لكن الافتراضات التقنية والتنفيذية ما تزال بحاجة للتحقق.`,
      operator: `تشغيليًا تبدو ممكنة، لكن سلاسة التنفيذ ما تزال مرتبطة بوضوح سير العمل والموارد.`,
      marketing: `هناك زاوية تموضع ممكنة، لكن الثقة في النمو تحتاج رسالة أوضح وملاءمة أفضل للقنوات.`,
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
  const initial = await callStructuredModel<AgentReview>({
    system: agentPrompts[language][agent],
    user: buildAgentReviewPrompt(brief, agent, language),
  });

  let review = agentReviewSchema.parse({ ...initial, agent, label: agentLabels[language][agent] });

  if (reviewNeedsSpecificity(review, brief, language)) {
    const refined = await callStructuredModel<AgentReview>({
      system: agentPrompts[language][agent],
      user: `${buildAgentReviewPrompt(brief, agent, language, review)}\n\n${language === "ar" ? "المسودة السابقة:" : "Previous draft:"}\n${JSON.stringify(review, null, 2)}`,
    });

    review = agentReviewSchema.parse({ ...refined, agent, label: agentLabels[language][agent] });
  }

  if (reviewNeedsSpecificity(review, brief, language)) {
    review = factBoundReview(review, brief, agent, language);
  }

  return review;
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
  const selectedAgents = normalizeSelectedAgents(parsed.selectedAgents);

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
    selectedAgents.map(async agent => {
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

const demoCases: Record<Language, {
  title: string;
  input: StartReviewInput;
  rebuttal: RebuttalInput;
}> = {
  en: {
    title: "AI meeting assistant for SMEs",
    input: {
      language: "en",
      freeText: "",
      transcriptText: "",
      pdfText: "",
      extraFragments: [],
      selectedAgents: [...agentOrder],
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
  },
  ar: {
    title: "مساعد اجتماعات بالذكاء الاصطناعي للشركات الصغيرة",
    input: {
      language: "ar",
      freeText: "",
      transcriptText: "",
      pdfText: "",
      extraFragments: [],
      selectedAgents: [...agentOrder],
      useMock: true,
      structured: {
        projectName: "بريف بريدج",
        idea: "مساعد ذكاء اصطناعي يحول ملاحظات الاجتماعات غير المرتبة إلى مهام وملخصات ورسائل متابعة للفرق الصغيرة.",
        problem: "الفرق الصغيرة تضيع منها القرارات والمهام بعد الاجتماعات خصوصًا عندما لا توجد جهة واضحة توثق ما تم الاتفاق عليه.",
        solution: "يلتقط مدخلات الاجتماع ويستخرج القرارات ويحولها إلى مهام ويرسل ملخص متابعة في مسار عمل واحد.",
        additionalInfo: "التركيز الأولي على الوكالات والفرق الصغيرة عن بعد التي تستخدم Zoom وGoogle Workspace.",
        sections: [
          { title: "نموذج العمل", content: "اشتراك SaaS شهري يُسعر لكل مساحة عمل." },
          { title: "التميّز", content: "استخراج أوضح لعناصر التنفيذ في الاجتماعات المختلطة بين العربية والإنجليزية." },
          { title: "التوزيع", content: "مبيعات يقودها المؤسس مع محتوى تسويقي وقنوات شركاء." },
          { title: "الدليل", content: "تجارب مبكرة مع خمسة فرق واستخدام أسبوعي متكرر." },
        ],
      },
    },
    rebuttal: {
      freeText: "لدينا بالفعل خمسة فرق تجريبية تستخدم المسار أسبوعيًا، وأول المشترين المستهدفين هم الوكالات التي تدير عددًا كبيرًا من اجتماعات العملاء. النسخة الأولى تركز فقط على الملخصات وعناصر التنفيذ وربط مساحة العمل، لذلك النطاق التقني مقصود ومحدود.",
    },
  },
};

export function getDemoCase(language: Language) {
  return demoCases[language] ?? demoCases.en;
}

export const demoCase = getDemoCase("en");
