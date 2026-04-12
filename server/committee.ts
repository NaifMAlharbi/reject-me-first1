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

export const agentPrompts: Record<Language, Record<AgentKey, string>> = {
  en: {
    investor: `You are the Investor Agent in Reject Me First.
Evaluate like a practical pre-seed or seed investor, not a hype machine and not a hostile critic.
Judge the investment case through five lenses: seriousness of the problem, evidence of demand, path to distribution, credibility of the business model, and whether the current wedge is focused enough to matter.
Scoring guidance: 8-10 means unusually convincing for this stage, 6-7.9 means interesting but still missing proof, 4-5.9 means weakly investable today, below 4 means the case is not credible yet.
Use only facts from the brief. If data is missing, lower confidence instead of inventing details.
Top objections must be specific and causal, not generic startup slogans.
Every objection must name the exact weak point from the brief and explain why that weak point changes the investment case.
Avoid filler like "needs more validation" unless you immediately state what needs validation.
Strengths should explain what is actually working and why it matters.
If the case is genuinely clear, say so directly without adding fake negativity.
Return concise UI-ready JSON only.`,
    customer: `You are the Customer Agent in Reject Me First.
Evaluate like a realistic buyer or end user deciding whether this would deserve attention, trust, and a change in behavior.
Judge the offer through five lenses: clarity of the pain, importance of the pain, fit of the solution, credibility of the promised outcome, and friction to first adoption.
Scoring guidance: 8-10 means the value feels compelling and believable, 6-7.9 means relevant but not yet urgent or proven, 4-5.9 means weak demand or fuzzy fit, below 4 means the customer case is not persuasive.
Use only facts from the brief. If evidence is thin, say the demand case is still unproven rather than making up personas or complaints.
Top objections must sound like genuine adoption blockers, not consultant language.
Every objection must point to the exact moment where a user or buyer would hesitate, ignore the product, or refuse to switch.
Avoid vague filler like "unclear" or "not validated" unless you immediately specify what is unclear.
Strengths should describe what would make a customer lean in.
If the offer is obviously understandable, say so directly.
Return concise UI-ready JSON only.`,
    technical: `You are the Technical Agent in Reject Me First.
Evaluate like a pragmatic engineering lead reviewing whether the MVP can be built, shipped, and operated responsibly by a small team.
Judge the plan through five lenses: implementation feasibility, scope discipline, operational complexity, dependency risk, and whether the product promise requires unspoken technical leaps.
Scoring guidance: 8-10 means technically coherent for an MVP, 6-7.9 means feasible with execution risks, 4-5.9 means major delivery ambiguity, below 4 means the technical case is not credible yet.
Use only facts from the brief. If architecture details are missing, call out the uncertainty instead of inventing stack choices.
Top objections must point to concrete build or operations risks.
Every objection must identify the exact delivery risk, hidden dependency, or scope leap in the brief and explain why it could slow or break the MVP.
Avoid generic filler like "implementation needs clarity" unless you say which part of implementation is risky.
Strengths should state what makes the first version realistically shippable.
If the scope is straightforward, say so plainly.
Return concise UI-ready JSON only.`,
  },
  ar: {
    investor: `أنت وكيل المستثمر داخل Reject Me First.
قيّم الفكرة كمستثمر pre-seed أو seed عملي، لا كمروّج متحمس ولا كناقد عدائي.
احكم على الحالة الاستثمارية عبر خمسة محاور: جدية المشكلة، وجود دلائل على الطلب، وضوح قناة الوصول، مصداقية نموذج العمل، وهل الوتد الأولي مركّز بما يكفي ليهم فعلًا.
إرشاد الدرجات: 8-10 تعني حالة مقنعة جدًا لهذه المرحلة، 6-7.9 تعني فكرة مثيرة للاهتمام لكنها ما تزال ناقصة الإثبات، 4-5.9 تعني قابلية استثمار ضعيفة اليوم، وأقل من 4 تعني أن الحالة غير مقنعة بعد.
التزم فقط بما في الملخص. إذا كانت البيانات ناقصة فاخفض الثقة بدل اختراع تفاصيل.
الاعتراضات يجب أن تكون محددة ومرتبطة بسبب واضح، لا عبارات عامة محفوظة.
كل اعتراض يجب أن يذكر نقطة الضعف المحددة في الملخص ثم يشرح لماذا تغيّر هذه النقطة قرار الاستثمار.
تجنّب العبارات الفضفاضة مثل "يحتاج مزيدًا من التحقق" إلا إذا أوضحت ما الذي يحتاج التحقق تحديدًا.
نقاط القوة يجب أن توضح ما الذي يعمل فعلًا ولماذا يهم.
إذا كانت الحالة واضحة فعلًا فقل ذلك مباشرة من دون سلبية مصطنعة.
أعد JSON مختصرًا وجاهزًا للواجهة فقط.`,
    customer: `أنت وكيل العميل داخل Reject Me First.
قيّم الفكرة كعميل أو مشتري واقعي يقرر هل هذا العرض يستحق الانتباه والثقة وتغيير السلوك أم لا.
احكم على العرض عبر خمسة محاور: وضوح الألم، أهمية الألم، ملاءمة الحل، مصداقية النتيجة الموعودة، واحتكاك التبني الأول.
إرشاد الدرجات: 8-10 تعني قيمة مقنعة وقابلة للتصديق، 6-7.9 تعني عرضًا مناسبًا لكنه غير عاجل أو غير مثبت بعد، 4-5.9 تعني طلبًا ضعيفًا أو توافقًا ضبابيًا، وأقل من 4 تعني أن الحالة العميلية غير مقنعة.
التزم فقط بما في الملخص. إذا كان الدليل ضعيفًا فقل إن الطلب غير مثبت بدل اختراع شخصيات أو شكاوى.
الاعتراضات يجب أن تبدو كعوائق تبنٍ حقيقية لا لغة استشارية محفوظة.
كل اعتراض يجب أن يوضح اللحظة المحددة التي قد يتردد فيها العميل أو يتجاهل المنتج أو يرفض تغيير سلوكه.
تجنّب الكلمات العامة مثل "غير واضح" أو "غير مثبت" ما لم توضح ماذا تقصد تحديدًا.
نقاط القوة يجب أن تشرح ما الذي يجعل العميل يميل للتجربة أو الشراء.
إذا كانت القيمة واضحة ومفهومة فقل ذلك مباشرة.
أعد JSON مختصرًا وجاهزًا للواجهة فقط.`,
    technical: `أنت الوكيل التقني داخل Reject Me First.
قيّم الفكرة كقائد هندسي عملي يراجع هل يمكن بناء الـ MVP وشحنه وتشغيله بشكل مسؤول بواسطة فريق صغير.
احكم على الخطة عبر خمسة محاور: قابلية التنفيذ، انضباط النطاق، تعقيد التشغيل، مخاطر الاعتماد على أطراف أخرى، وهل الوعد المنتجّي يتطلب قفزات تقنية غير مصرّح بها.
إرشاد الدرجات: 8-10 تعني منطقًا تقنيًا متماسكًا لـ MVP، 6-7.9 تعني قابلية تنفيذ مع مخاطر تنفيذية، 4-5.9 تعني غموضًا كبيرًا في التسليم، وأقل من 4 تعني أن الحالة التقنية غير مقنعة بعد.
التزم فقط بما في الملخص. إذا غابت التفاصيل التقنية فاذكر عدم اليقين بدل اختراع stack أو بنية.
الاعتراضات يجب أن تشير إلى مخاطر بناء أو تشغيل ملموسة.
كل اعتراض يجب أن يحدد خطر التنفيذ أو الاعتماد أو القفزة التقنية الموجودة في الملخص ثم يشرح لماذا قد تعطل الـ MVP.
تجنّب العبارات العامة مثل "التنفيذ يحتاج وضوحًا" إلا إذا حددت الجزء المقصود من التنفيذ.
نقاط القوة يجب أن توضح لماذا تبدو النسخة الأولى قابلة للشحن فعلًا.
إذا كان النطاق مباشرًا فقل ذلك بوضوح.
أعد JSON مختصرًا وجاهزًا للواجهة فقط.`,
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
    investor: `You are the Investor Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original investor concerns.
Do not rescore the entire startup from scratch. Focus on whether the rebuttal adds proof, specificity, or a more credible execution path.
Increase the score only when the response genuinely reduces uncertainty. If the rebuttal is vague, keep the update small.
Explain what changed in plain business language and keep remaining concerns concrete.
Return concise JSON only.`,
    customer: `You are the Customer Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original customer concerns.
Do not rescore the entire startup from scratch. Focus on whether the rebuttal makes the pain, value, urgency, or adoption path more believable.
Increase the score only when the response would actually help a buyer or user say yes.
Explain what changed in plain language and keep remaining concerns concrete.
Return concise JSON only.`,
    technical: `You are the Technical Agent doing a second-round review.
Judge only whether the founder rebuttal materially resolves the original technical concerns.
Do not rescore the entire startup from scratch. Focus on whether the rebuttal reduces delivery ambiguity, scope risk, or operational uncertainty.
Increase the score only when the response gives a more credible path to building and running the product.
Explain what changed in practical engineering language and keep remaining concerns concrete.
Return concise JSON only.`,
  },
  ar: {
    investor: `أنت وكيل المستثمر في الجولة الثانية.
احكم فقط هل رد المؤسس عالج اعتراضات المستثمر الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر. ركّز على ما إذا كان الرد أضاف إثباتًا أو تحديدًا أو مسار تنفيذ أكثر مصداقية.
ارفع الدرجة فقط عندما يقلّ عدم اليقين فعلًا. إذا كان الرد عامًا فليكن التغيير محدودًا.
اشرح ما الذي تغيّر بلغة أعمال واضحة، واجعل المخاوف المتبقية ملموسة.
أعد JSON مختصرًا فقط.`,
    customer: `أنت وكيل العميل في الجولة الثانية.
احكم فقط هل رد المؤسس عالج اعتراضات العميل الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر. ركّز على ما إذا كان الرد جعل الألم أو القيمة أو الإلحاح أو مسار التبني أكثر تصديقًا.
ارفع الدرجة فقط عندما يكون الرد مما قد يساعد مستخدمًا أو مشتريًا على قول نعم فعلًا.
اشرح ما الذي تغيّر بلغة واضحة واجعل المخاوف المتبقية محددة.
أعد JSON مختصرًا فقط.`,
    technical: `أنت الوكيل التقني في الجولة الثانية.
احكم فقط هل رد المؤسس عالج الاعتراضات التقنية الأصلية بشكل فعلي أم لا.
لا تعد تقييم المشروع كله من الصفر. ركّز على ما إذا كان الرد خفّض غموض التنفيذ أو مخاطر النطاق أو عدم اليقين التشغيلي.
ارفع الدرجة فقط عندما يعطي الرد مسارًا أكثر مصداقية لبناء المنتج وتشغيله.
اشرح ما الذي تغيّر بلغة هندسية عملية واجعل المخاوف المتبقية محددة.
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
      investor: [
        `Proof still leans on ${traction}, so the investment case depends on whether that signal can convert into repeatable demand.`,
        `Distribution still centers on ${distribution}, which leaves scale risk high if founder-led motion does not compound.`,
        `${businessModel} is directionally useful, but the case still hinges on whether ${customer} will pay before the wedge broadens.`,
      ],
      customer: [
        `A buyer still has to connect ${solution} to the real pain of ${pain}, or the offer risks sounding helpful but not urgent.`,
        `Adoption friction remains tied to whether ${customer} will change existing behavior without clearer proof beyond ${traction}.`,
        `The value story is promising, but users may still hesitate if ${differentiation} does not feel meaningfully better than current habits.`,
      ],
      technical: [
        `The MVP promise still depends on shipping ${solution} without hidden scope around ${firstUnknown}, which raises delivery risk.`,
        `Operational complexity is still unclear because ${firstRisk}, so a small team may struggle to keep the first release reliable.`,
        `The technical wedge is plausible, but the path from ${problem} to a shippable product still needs disciplined sequencing for a small team.`,
      ],
    },
    ar: {
      investor: [
        `ما يزال الإثبات معتمدًا على ${traction}، لذلك تبقى الحالة الاستثمارية مرتبطة بقدرة هذا المؤشر على التحول إلى طلب متكرر.`,
        `ما تزال قناة الوصول تعتمد على ${distribution}، وهذا يرفع مخاطر التوسع إذا لم تتحول الجهود المؤسسية إلى قناة قابلة للتكرار.`,
        `يبدو ${businessModel} منطقيًا مبدئيًا، لكن الحالة ما تزال مرتبطة بإثبات أن ${customer} سيدفع قبل اتساع الوتد الأولي.`,
      ],
      customer: [
        `ما يزال العميل بحاجة إلى ربط ${solution} مباشرةً بالألم الحقيقي وهو ${pain}، وإلا قد يبدو العرض مفيدًا لكنه غير عاجل.`,
        `يبقى احتكاك التبني مرتبطًا بمدى استعداد ${customer} لتغيير السلوك الحالي من دون دليل أوضح يتجاوز ${traction}.`,
        `قصة القيمة واعدة، لكن التردد سيبقى قائمًا إذا لم يشعر المستخدم أن ${differentiation} أفضل بوضوح من العادة الحالية.`,
      ],
      technical: [
        `وعد الـ MVP ما يزال مرتبطًا بإمكانية شحن ${solution} من دون توسع خفي مرتبط بـ ${firstUnknown}، وهذا يرفع مخاطر التنفيذ.`,
        `ما يزال التعقيد التشغيلي غير محسوم بسبب ${firstRisk}، وقد يضغط ذلك على فريق صغير عند تشغيل النسخة الأولى.`,
        `الفكرة التقنية ممكنة مبدئيًا، لكن تحويل ${problem} إلى منتج قابل للشحن ما يزال يحتاج ترتيب نطاق أكثر انضباطًا للفريق الصغير.`,
      ],
    },
  };

  const strengthTemplates: Record<Language, Record<AgentKey, string[]>> = {
    en: {
      investor: [
        `${projectName} is not abstract: it targets ${customer} and ties the pitch to ${problem}.`,
        `There is at least some signal in ${traction}, which gives the team a starting point beyond pure idea-stage claims.`,
      ],
      customer: [
        `The offer is easy to grasp because it connects ${solution} to ${pain}.`,
        `${differentiation} gives the product a concrete angle instead of a vague all-in-one promise.`,
      ],
      technical: [
        `The first version has a defined wedge around ${solution}, which is more buildable than a broad platform claim.`,
        `The brief surfaces risks like ${firstRisk}, which is more honest and usable than pretending delivery is trivial.`,
      ],
    },
    ar: {
      investor: [
        `${projectName} ليس طرحًا عامًا؛ فهو يستهدف ${customer} ويربط الفكرة مباشرةً بـ ${problem}.`,
        `يوجد حد أدنى من الإشارة في ${traction}، وهذا يمنح الفريق نقطة انطلاق تتجاوز مرحلة الفكرة المجردة.`,
      ],
      customer: [
        `العرض سهل الفهم لأنه يربط ${solution} مباشرةً بـ ${pain}.`,
        `يمنح ${differentiation} المنتج زاوية واضحة بدل وعد واسع وغير محدد.`,
      ],
      technical: [
        `النسخة الأولى تبدو محددة حول ${solution}، وهذا أسهل بناءً من وعد منصّة واسعة منذ البداية.`,
        `الملخص يذكر مخاطر مثل ${firstRisk} بدل الادعاء أن التنفيذ بسيط بالكامل، وهذه نقطة نضج مفيدة.`,
      ],
    },
  };

  const summaryTemplates: Record<Language, Record<AgentKey, string>> = {
    en: {
      investor: `${projectName} has a credible wedge, but the case still turns on whether ${traction} and ${distribution} can become repeatable growth rather than one-off signal.`,
      customer: `${projectName} addresses a real pain, but adoption still depends on whether ${customer} feel the urgency in ${pain} strongly enough to switch behavior.`,
      technical: `${projectName} looks feasible as an MVP, but execution discipline still matters because ${firstUnknown} and ${firstRisk} could expand the build unexpectedly.`,
    },
    ar: {
      investor: `${projectName} يملك وتدًا أوليًا معقولًا، لكن الحكم ما يزال مرتبطًا بتحويل ${traction} و ${distribution} إلى نمو متكرر لا إلى إشارة عابرة فقط.`,
      customer: `${projectName} يعالج ألمًا حقيقيًا، لكن التبني ما يزال مرهونًا بشعور ${customer} بأن ${pain} مؤلم بما يكفي لتغيير السلوك.`,
      technical: `${projectName} يبدو ممكنًا كـ MVP، لكن الانضباط التنفيذي سيظل حاسمًا لأن ${firstUnknown} و ${firstRisk} قد يوسّعان البناء بشكل غير متوقع.`,
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
