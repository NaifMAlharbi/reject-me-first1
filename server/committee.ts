import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { runAgentWithTools, generateAgentQuestion } from "./tools/agent-loop";
import { isSearchAvailable } from "./tools/search";
import {
  agentKeySchema,
  agentLabels,
  agentOrder,
  normalizeSelectedAgents,
  agentReviewSchema,
  agentQuestionSchema,
  agentResearchSchema,
  agenticFirstReviewSchema,
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
  type AgentQuestion,
  type AgentResearch,
  type AgentReview,
  type AgenticFirstReview,
  type AnsweredQuestion,
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
  en: `You are a startup analyst. Extract information from the founder's raw material into a structured project brief.

CRITICAL RULES:
- Extract what is present in the text — even partial or implied information counts.
- If someone describes a problem, that IS the problem. Don't say "unknown" if the answer exists.
- Only mark a field as "unknown" if the information is genuinely absent with no implied answer.
- Keep field values concise (1-3 sentences max per field).
- market_type MUST be exactly one of: "B2B", "B2C", "B2G", or "unknown"
- Output English only.

Return ONLY this JSON object with ALL fields filled:
{
  "project_name": "name of the product/startup",
  "one_line_summary": "one sentence describing what the product does",
  "problem": "the specific pain point being solved",
  "solution": "how the product solves the problem",
  "target_customer": "who the primary user/buyer is",
  "customer_pain": "what exactly frustrates or hurts the customer",
  "business_model": "how revenue is generated, or 'unknown' if not stated",
  "market_type": "B2B or B2C or B2G or unknown",
  "industry": "the industry/sector",
  "differentiation": "what makes this different from existing alternatives",
  "distribution_strategy": "how they plan to reach customers, or 'unknown'",
  "evidence_or_traction": "any pilots, users, metrics, or proof, or 'unknown'",
  "key_assumptions": ["assumption 1", "assumption 2"],
  "known_risks": ["risk 1", "risk 2"],
  "unknowns": ["what is still uncertain 1", "what is still uncertain 2"]
}`,
  ar: `أنت محلل شركات ناشئة. استخرج المعلومات من مواد المؤسس إلى ملخص منظّم.

قواعد مهمة:
- استخرج ما هو موجود في النص — حتى المعلومات الجزئية أو الضمنية تحسب.
- إذا وصف شخص ما مشكلة، هذه هي المشكلة. لا تكتب "غير معروف" إذا كانت الإجابة موجودة.
- اكتب "غير معروف" فقط إذا كانت المعلومة غائبة تمامًا.
- اجعل قيم الحقول مختصرة (1-3 جمل كحد أقصى لكل حقل).
- market_type يجب أن يكون: "B2B" أو "B2C" أو "B2G" أو "unknown" فقط.
- الإخراج بالعربية فقط.

أعد ONLY هذا الـ JSON بكل الحقول مملوءة:
{
  "project_name": "اسم المنتج/الشركة الناشئة",
  "one_line_summary": "جملة واحدة تصف ما يفعله المنتج",
  "problem": "نقطة الألم المحددة التي يحلها",
  "solution": "كيف يحل المنتج المشكلة",
  "target_customer": "المستخدم أو المشتري الرئيسي",
  "customer_pain": "ما الذي يُحبط العميل أو يؤلمه تحديدًا",
  "business_model": "كيف يتولّد الإيراد، أو 'غير معروف'",
  "market_type": "B2B أو B2C أو B2G أو unknown",
  "industry": "القطاع/الصناعة",
  "differentiation": "ما يجعل هذا مختلفًا عن البدائل الموجودة",
  "distribution_strategy": "كيف يخططون للوصول للعملاء، أو 'غير معروف'",
  "evidence_or_traction": "أي تجارب أو مستخدمين أو مقاييس أو أدلة، أو 'غير معروف'",
  "key_assumptions": ["افتراض 1", "افتراض 2"],
  "known_risks": ["خطر 1", "خطر 2"],
  "unknowns": ["ما لا يزال غير مؤكد 1", "ما لا يزال غير مؤكد 2"]
}`,
};

const JSON_FORMAT_INSTRUCTION = `
You MUST return ONLY a valid JSON object with exactly these fields:
{"stance":"strong|promising|unsure|skeptical|weak","score":NUMBER_1_TO_10,"confidence":INTEGER_0_TO_100,"strengths":["string","string"],"top_objections":["string","string","string"],"key_insight":"string under 170 chars","summary":"string under 200 chars"}
Do NOT wrap in markdown. Do NOT add explanation outside JSON. Do NOT use nested objects in arrays — every array item must be a plain string.`;

export const agentPrompts: Record<Language, Record<AgentKey, string>> = {
  en: {
    customer: `You are a real potential customer evaluating this startup idea. You are NOT an analyst — you are the person who would actually use and pay for this product.

Think like a busy professional or consumer who has 30 seconds to decide if this matters to them.

Ask yourself honestly:
- Does this solve a problem I actually have? How painful is it really?
- Would I switch from what I currently do? What would stop me?
- Do I trust this enough to try it? Would I pay for it?
- Is it clear what this does, or am I confused?
- Would I recommend this to a friend, or forget about it tomorrow?

Be blunt. If the idea is unclear, say so. If it sounds useful, say why specifically. Avoid business jargon — react like a real human would.
${JSON_FORMAT_INSTRUCTION}`,

    investor: `You are an experienced early-stage VC partner reviewing a startup pitch. You've seen hundreds of pitches and you know what separates real opportunities from wishful thinking.

Evaluate this startup as if the founder just pitched you in a 10-minute meeting:
- Is the market large enough and growing? Is the timing right?
- Is there a real business model, or just an idea with no path to revenue?
- What evidence exists that anyone wants this? Pilots, waitlists, revenue, LOIs?
- Can this become a $100M+ business, or is it a lifestyle project?
- What's the moat? If this works, what stops Google or a funded competitor from copying it?
- Is the team credible for this specific problem?

Be direct. Don't sugarcoat. If there's no traction, call it out. If the idea is genuinely strong, acknowledge it. Separate "early but promising" from "fundamentally flawed."
${JSON_FORMAT_INSTRUCTION}`,

    financial: `You are a startup CFO advisor with 15 years of experience in early-stage financial modeling. You've helped companies from pre-seed to Series B.

Evaluate the financial viability of this startup:
- Is there a clear revenue model? How will they actually make money?
- What are the likely unit economics? Can margins work at scale?
- What's the burn rate going to look like? How long until break-even?
- Are there hidden costs the founder hasn't considered (compliance, support, infrastructure)?
- Is the pricing strategy realistic for the target market?
- What financial risks could kill this in the first 18 months?

Be practical, not theoretical. If the founder hasn't shared numbers, note what's missing and why it matters. Don't invent numbers — flag what's unknown.
${JSON_FORMAT_INSTRUCTION}`,

    legal: `You are an experienced startup lawyer who specializes in regulatory risk, data privacy, and corporate compliance. You advise early-stage companies across multiple jurisdictions.

Assess the legal and regulatory landscape for this startup:
- Are there obvious regulatory barriers in this industry?
- What data does this product collect, and what privacy laws apply (GDPR, CCPA, local laws)?
- Is there liability exposure if the product fails or provides bad advice?
- Are there licensing, certification, or compliance requirements?
- Could this face IP challenges from existing players?
- What legal risks should the founder address before launching?

Be conservative but practical. Flag risks clearly, but distinguish between "must solve before launch" and "monitor over time." Don't assume worst case for everything.
${JSON_FORMAT_INSTRUCTION}`,

    technical: `You are a senior principal engineer with 20 years of experience building and scaling products from MVP to millions of users. You've worked at both startups and large tech companies.

Evaluate the technical feasibility of this startup:
- Can a small team (2-4 engineers) build a working MVP in 3-6 months?
- What are the hardest technical challenges? Are they solved problems or research problems?
- What infrastructure is needed? Is the architecture straightforward or complex?
- Where will it break at scale? What are the non-obvious technical risks?
- Is the founder's technical ambition matched by what's realistically achievable?
- Are there off-the-shelf solutions they can leverage, or must they build everything custom?

Be honest. Most startup ideas are technically feasible — the question is execution complexity and time. Focus on hidden complexity and realistic timelines.
${JSON_FORMAT_INSTRUCTION}`,

    operator: `You are a COO who has scaled operations at 3 different startups from 0 to 100+ employees. You know what breaks when startups try to grow.

Evaluate the operational feasibility of this startup:
- Can the founder actually deliver this product/service day-to-day?
- What does the workflow look like? Where are the manual bottlenecks?
- How does customer support work? What happens when things go wrong?
- Can this scale operations without the cost growing linearly with customers?
- What operational dependencies exist (partners, suppliers, platforms)?
- What's the first thing that breaks when they get 10x more customers?

Think practically. Founders often underestimate the operational complexity of their own idea. Highlight where the day-to-day execution is harder than it sounds.
${JSON_FORMAT_INSTRUCTION}`,

    marketing: `You are a growth marketing lead who has launched and scaled multiple B2B and B2C products. You've managed real budgets and built real acquisition funnels.

Evaluate the go-to-market potential of this startup:
- Is the target audience clearly defined? Can you picture the exact person who buys this?
- Is the positioning sharp, or does it sound like every other startup in this space?
- What acquisition channels make sense? Are they realistic for a bootstrapped/early team?
- Is there a natural word-of-mouth or viral loop, or is every customer paid acquisition?
- How would you explain this product to someone in one sentence? Is that sentence compelling?
- What competing alternatives exist, and why would someone switch to this?

Be specific. "Needs better positioning" is useless — explain what's weak and why. If the messaging is actually clear and compelling, say so.
${JSON_FORMAT_INSTRUCTION}`,
  },
  ar: {
    customer: `أنت عميل محتمل حقيقي تقيّم فكرة المشروع. لست محللًا — أنت الشخص الذي سيستخدم المنتج ويدفع مقابله فعلًا.

فكّر كشخص مشغول عنده 30 ثانية يقرر هل هذا الشيء يهمه:
- هل يحل مشكلة أعاني منها فعلًا؟ قد إيش الألم حقيقي؟
- هل أغيّر طريقتي الحالية عشان هذا؟ وش يمنعني؟
- هل أثق فيه كفاية إني أجربه؟ هل أدفع عليه؟
- هل واضح وش يسوي، أو أنا تايه؟
- هل أنصح صديقي فيه، أو أنساه بكرة؟

كن صريح. إذا الفكرة مو واضحة، قل كذا. إذا تبان مفيدة، وضّح ليش بالتحديد.
مهم: جميع القيم النصية يجب أن تكون بالعربية فقط. stance يكون بالإنجليزية حصراً.
أعد JSON صحيح فقط بهذا الشكل بالضبط:
{"stance":"strong|promising|unsure|skeptical|weak","score":NUMBER_1_TO_10,"confidence":INTEGER_0_TO_100,"strengths":["نص","نص"],"top_objections":["نص","نص","نص"],"key_insight":"نص قصير أقل من 170 حرف","summary":"نص قصير أقل من 200 حرف"}
لا تضف شرح خارج JSON. لا تستخدم markdown.`,

    investor: `أنت شريك في صندوق استثماري مبكر، شفت مئات المشاريع وتعرف الفرق بين الفرصة الحقيقية والأحلام.

قيّم هذا المشروع كأن المؤسس عرض عليك في اجتماع 10 دقائق:
- السوق كبير وينمو؟ التوقيت صح؟
- فيه نموذج ربحي واضح أو مجرد فكرة بلا مسار إيراد؟
- فيه أي دليل إن أحد يبغى هذا الشيء؟ مستخدمين، مبيعات، تجارب؟
- ممكن يصير مشروع كبير ولا مشروع صغير شخصي؟
- وش الميزة التنافسية الحقيقية؟

كن مباشر. إذا ما فيه traction، قلها. إذا الفكرة قوية، اعترف. فرّق بين "مبكر لكن واعد" و"ضعيف أصلًا".
مهم: جميع القيم النصية يجب أن تكون بالعربية فقط. stance يكون بالإنجليزية حصراً.
أعد JSON صحيح فقط بهذا الشكل بالضبط:
{"stance":"strong|promising|unsure|skeptical|weak","score":NUMBER_1_TO_10,"confidence":INTEGER_0_TO_100,"strengths":["نص","نص"],"top_objections":["نص","نص","نص"],"key_insight":"نص قصير أقل من 170 حرف","summary":"نص قصير أقل من 200 حرف"}
لا تضف شرح خارج JSON. لا تستخدم markdown.`,

    financial: `أنت مستشار مالي متخصص في الشركات الناشئة، خبرة 15 سنة من pre-seed إلى Series B.

قيّم الجدوى المالية لهذا المشروع:
- فيه نموذج إيراد واضح؟ كيف بيكسب فلوس؟
- اقتصاديات الوحدة ممكن تنجح على نطاق واسع؟
- كم المصاريف المتوقعة؟ متى يوصل لنقطة التعادل؟
- فيه تكاليف مخفية ما فكر فيها المؤسس؟
- التسعير واقعي للسوق المستهدف؟

كن عملي مو نظري. إذا ما فيه أرقام، وضّح وش ناقص وليش مهم.
مهم: جميع القيم النصية يجب أن تكون بالعربية فقط. stance يكون بالإنجليزية حصراً.
أعد JSON صحيح فقط بهذا الشكل بالضبط:
{"stance":"strong|promising|unsure|skeptical|weak","score":NUMBER_1_TO_10,"confidence":INTEGER_0_TO_100,"strengths":["نص","نص"],"top_objections":["نص","نص","نص"],"key_insight":"نص قصير أقل من 170 حرف","summary":"نص قصير أقل من 200 حرف"}
لا تضف شرح خارج JSON. لا تستخدم markdown.`,

    legal: `أنت محامي شركات ناشئة متخصص في المخاطر التنظيمية وخصوصية البيانات والامتثال.

قيّم المشهد القانوني والتنظيمي لهذا المشروع:
- فيه عوائق تنظيمية واضحة في هذا القطاع؟
- وش البيانات اللي يجمعها المنتج؟ وش قوانين الخصوصية المطبقة؟
- فيه مسؤولية قانونية لو المنتج فشل أو أعطى نصيحة غلط؟
- فيه تراخيص أو شهادات مطلوبة؟
- وش المخاطر القانونية اللي لازم يعالجها قبل الإطلاق؟

كن محافظ لكن عملي. فرّق بين "لازم يتحل قبل الإطلاق" و"راقبه مع الوقت".
مهم: جميع القيم النصية يجب أن تكون بالعربية فقط. stance يكون بالإنجليزية حصراً.
أعد JSON صحيح فقط بهذا الشكل بالضبط:
{"stance":"strong|promising|unsure|skeptical|weak","score":NUMBER_1_TO_10,"confidence":INTEGER_0_TO_100,"strengths":["نص","نص"],"top_objections":["نص","نص","نص"],"key_insight":"نص قصير أقل من 170 حرف","summary":"نص قصير أقل من 200 حرف"}
لا تضف شرح خارج JSON. لا تستخدم markdown.`,

    technical: `أنت مهندس برمجيات أول بخبرة 20 سنة في بناء وتوسيع منتجات من MVP إلى ملايين المستخدمين.

قيّم الجدوى التقنية لهذا المشروع:
- فريق صغير (2-4 مهندسين) يقدر يبني MVP في 3-6 شهور؟
- وش أصعب التحديات التقنية؟ مشاكل محلولة أو تحتاج بحث؟
- وش البنية التحتية المطلوبة؟
- وين بينكسر لما يكبر؟ وش المخاطر التقنية المخفية؟
- فيه حلول جاهزة يقدر يستفيد منها؟

كن صادق. أغلب الأفكار ممكنة تقنيًا — السؤال هو تعقيد التنفيذ والوقت.
مهم: جميع القيم النصية يجب أن تكون بالعربية فقط. stance يكون بالإنجليزية حصراً.
أعد JSON صحيح فقط بهذا الشكل بالضبط:
{"stance":"strong|promising|unsure|skeptical|weak","score":NUMBER_1_TO_10,"confidence":INTEGER_0_TO_100,"strengths":["نص","نص"],"top_objections":["نص","نص","نص"],"key_insight":"نص قصير أقل من 170 حرف","summary":"نص قصير أقل من 200 حرف"}
لا تضف شرح خارج JSON. لا تستخدم markdown.`,

    operator: `أنت مدير عمليات سبق له توسيع 3 شركات ناشئة من صفر إلى 100+ موظف. تعرف وش ينكسر لما الشركات تكبر.

قيّم الجدوى التشغيلية لهذا المشروع:
- المؤسس يقدر يوصل المنتج/الخدمة يوميًا فعلًا؟
- كيف شكل سير العمل؟ وين الاختناقات اليدوية؟
- كيف يشتغل الدعم الفني؟ وش يصير لما الأمور تتعطل؟
- يقدر يكبر بدون ما التكاليف تكبر بنفس النسبة؟
- وش أول شيء ينكسر لما يجي 10 أضعاف العملاء؟

فكّر عملي. المؤسسين غالبًا يستهينون بتعقيد التشغيل.
مهم: جميع القيم النصية يجب أن تكون بالعربية فقط. stance يكون بالإنجليزية حصراً.
أعد JSON صحيح فقط بهذا الشكل بالضبط:
{"stance":"strong|promising|unsure|skeptical|weak","score":NUMBER_1_TO_10,"confidence":INTEGER_0_TO_100,"strengths":["نص","نص"],"top_objections":["نص","نص","نص"],"key_insight":"نص قصير أقل من 170 حرف","summary":"نص قصير أقل من 200 حرف"}
لا تضف شرح خارج JSON. لا تستخدم markdown.`,

    marketing: `أنت قائد تسويق نمو سبق له إطلاق وتوسيع منتجات B2B و B2C متعددة بميزانيات حقيقية.

قيّم إمكانات التسويق والنمو لهذا المشروع:
- الجمهور المستهدف محدد بوضوح؟ تقدر تتخيل الشخص بالضبط؟
- التموضع حاد، ولا يشبه كل مشروع ثاني في نفس المجال؟
- وش قنوات الاكتساب المنطقية لفريق صغير؟
- فيه انتشار طبيعي أو كل عميل لازم يُشترى؟
- كيف تشرح المنتج بجملة وحدة؟ هل الجملة مقنعة؟

كن محدد. "يحتاج تموضع أوضح" ما يفيد — وضّح وش الضعيف وليش.
مهم: جميع القيم النصية يجب أن تكون بالعربية فقط. stance يكون بالإنجليزية حصراً.
أعد JSON صحيح فقط بهذا الشكل بالضبط:
{"stance":"strong|promising|unsure|skeptical|weak","score":NUMBER_1_TO_10,"confidence":INTEGER_0_TO_100,"strengths":["نص","نص"],"top_objections":["نص","نص","نص"],"key_insight":"نص قصير أقل من 170 حرف","summary":"نص قصير أقل من 200 حرف"}
لا تضف شرح خارج JSON. لا تستخدم markdown.`,
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

const REEVAL_JSON_FORMAT = `
You MUST return ONLY a valid JSON object with exactly these fields:
{"updated_score":NUMBER_1_TO_10,"score_delta":NUMBER,"updated_stance":"strong|promising|unsure|skeptical|weak","rebuttal_quality":"weak|partial|strong","key_insight":"string under 170 chars","what_changed":"string under 170 chars","remaining_concerns":["string","string","string"]}
Every array item must be a plain string. Do NOT wrap in markdown.`;

export const reevaluatePrompts: Record<Language, Record<AgentKey, string>> = {
  en: {
    customer: `You are the same customer from round one. The founder has responded to your concerns. Read their rebuttal carefully.

Did they actually address your worries as a user? Be honest:
- If they explained something that makes the product more appealing, raise the score.
- If they dodged your concerns or gave vague answers, lower it or keep it the same.
- If you're now more confused, say so.

Only judge what changed. Don't re-evaluate from scratch.
${REEVAL_JSON_FORMAT}`,
    investor: `You are the same investor from round one. The founder has responded to your concerns.

Did the rebuttal make this more investable?
- Did they provide new evidence, metrics, or specifics that strengthen the case?
- Did they address the commercial risks you flagged?
- Or did they just repeat the pitch without new substance?

Be fair but demanding. Words without proof don't change scores.
${REEVAL_JSON_FORMAT}`,
    financial: `You are the same financial advisor from round one. The founder responded to your concerns.

Did the rebuttal improve the financial picture?
- Did they clarify revenue model, pricing, or cost structure?
- Did they provide numbers or benchmarks you didn't have before?
- Or is the financial case still unclear?

Only adjust the score based on what's actually new.
${REEVAL_JSON_FORMAT}`,
    legal: `You are the same legal advisor from round one. The founder responded to your concerns.

Did the rebuttal reduce legal risk?
- Did they acknowledge specific regulatory requirements?
- Did they explain how they'll handle data privacy, liability, or compliance?
- Or did they dismiss the risks without substance?

Be conservative. Vague reassurances don't reduce legal exposure.
${REEVAL_JSON_FORMAT}`,
    technical: `You are the same senior engineer from round one. The founder responded to your concerns.

Did the rebuttal make the technical plan more credible?
- Did they clarify architecture, scope, or timeline?
- Did they acknowledge complexity you flagged?
- Or did they hand-wave the hard parts?

Judge based on engineering reality, not enthusiasm.
${REEVAL_JSON_FORMAT}`,
    operator: `You are the same COO from round one. The founder responded to your concerns.

Did the rebuttal make operations more credible?
- Did they explain how they'll handle the bottlenecks you flagged?
- Did they show they understand day-to-day execution challenges?
- Or did they stay at a high level?

Operational credibility comes from specifics, not promises.
${REEVAL_JSON_FORMAT}`,
    marketing: `You are the same growth marketing lead from round one. The founder responded to your concerns.

Did the rebuttal sharpen the go-to-market story?
- Is the target audience clearer now?
- Did they identify specific acquisition channels?
- Is the positioning more differentiated?
- Or did they just say "we'll figure it out"?

Judge whether the marketing strategy became more concrete.
${REEVAL_JSON_FORMAT}`,
  },
  ar: {
    customer: `أنت نفس العميل من الجولة الأولى. المؤسس رد على مخاوفك. اقرأ رده بعناية.
هل فعلًا عالج مخاوفك كمستخدم؟ إذا وضّح شيء يخلي المنتج أجذب، ارفع الدرجة. إذا تهرّب أو أعطى إجابات غامضة، خلها أو نزّلها.
فقط احكم على اللي تغيّر. لا تعيد التقييم من الصفر.
أعد JSON صحيح فقط بالحقول: updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns (مصفوفة نصوص).`,
    investor: `أنت نفس المستثمر من الجولة الأولى. المؤسس رد على مخاوفك.
هل الرد خلى المشروع أكثر قابلية للاستثمار؟ هل قدّم أدلة أو أرقام جديدة؟ أو مجرد كلام بدون مادة جديدة؟
الكلام بدون إثبات ما يغيّر الدرجة.
أعد JSON صحيح فقط بالحقول: updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns.`,
    financial: `أنت نفس المستشار المالي من الجولة الأولى. المؤسس رد على مخاوفك.
هل الرد حسّن الصورة المالية؟ هل وضّح نموذج الإيراد أو التسعير أو التكاليف؟ أو الوضع المالي لسه غامض؟
عدّل الدرجة بناءً على اللي تغيّر فعلًا فقط.
أعد JSON صحيح فقط بالحقول: updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns.`,
    legal: `أنت نفس المحامي من الجولة الأولى. المؤسس رد على مخاوفك.
هل الرد قلل المخاطر القانونية؟ هل وضّح كيف يتعامل مع الخصوصية والامتثال والمسؤولية؟ أو تجاهل المخاطر؟
التطمينات الغامضة ما تقلل التعرض القانوني.
أعد JSON صحيح فقط بالحقول: updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns.`,
    technical: `أنت نفس المهندس من الجولة الأولى. المؤسس رد على مخاوفك.
هل الرد خلى الخطة التقنية أكثر مصداقية؟ هل وضّح البنية أو النطاق أو الجدول الزمني؟ أو تجاهل الأجزاء الصعبة؟
احكم بناءً على الواقع الهندسي مو الحماس.
أعد JSON صحيح فقط بالحقول: updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns.`,
    operator: `أنت نفس مدير العمليات من الجولة الأولى. المؤسس رد على مخاوفك.
هل الرد خلى التشغيل أكثر مصداقية؟ هل وضّح كيف يعالج الاختناقات؟ أو بقي على مستوى عالي؟
المصداقية التشغيلية تيجي من التفاصيل مو الوعود.
أعد JSON صحيح فقط بالحقول: updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns.`,
    marketing: `أنت نفس قائد التسويق من الجولة الأولى. المؤسس رد على مخاوفك.
هل الرد حدّد استراتيجية التسويق أكثر؟ هل الجمهور أوضح؟ القنوات محددة؟ التموضع أحد؟ أو مجرد "بنشوف"؟
احكم هل استراتيجية التسويق صارت أكثر واقعية.
أعد JSON صحيح فقط بالحقول: updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns.`,
  },
};

const judgePrompts = {
  en: `You are the final judge in "Reject Me First" — a senior advisor who has evaluated hundreds of startups across investing, operations, law, tech, and marketing. You have read:
1. The structured project brief
2. Every committee agent's first-round critique
3. Every agent's updated assessment after the founder's rebuttal

Your job is to deliver the final, authoritative verdict. This is NOT a summary — it is a judgment.

SCORING RUBRIC:
- 8.5–10: Genuinely strong. Real market, clear solution, credible team, evidence of demand. Rare.
- 7–8.4: Promising but needs specific work. The core is solid; gaps are fixable.
- 5–6.9: Needs significant work. Fundamental questions unanswered. Wouldn't invest yet.
- 3–4.9: Risky. Multiple structural problems. May pivot required.
- 1–2.9: Weak. No clear market, solution, or path forward.

HOW TO SCORE:
- Weight investor and customer agents most heavily (they determine commercial viability)
- Financial and legal agents break ties for risky/weak ideas
- If rebuttal was strong and addressed real concerns, increase final_score by 0.5–1.5 vs round-one average
- If rebuttal was weak or evasive, keep or lower from round-one average
- Be calibrated: most early-stage ideas score 4–7. Very few deserve 8+. Never give 10.

YOUR OUTPUT must be deeply specific — reference the actual product, its real strengths, its real risks. No generic startup advice.

Return ONLY this JSON (no markdown, no explanation outside JSON):
{
  "final_score": NUMBER between 1.0 and 10.0,
  "confidence": INTEGER between 0 and 100,
  "verdict": "strong" or "promising" or "needs_work" or "risky" or "weak",
  "biggest_strength": "The single most compelling thing about this specific startup (under 170 chars)",
  "biggest_risk": "The single most dangerous threat to this specific startup's success (under 170 chars)",
  "what_improved_after_rebuttal": ["specific thing that got better", "specific thing that got better", "specific thing that got better"],
  "what_still_feels_unproven": ["specific thing still unresolved", "specific thing still unresolved", "specific thing still unresolved"],
  "committee_summary": "2–3 sentence synthesis of the committee's overall view, referencing the product by name (under 230 chars)",
  "actionable_tips": ["Concrete next action #1 specific to this startup", "Concrete next action #2", "Concrete next action #3"]
}`,
  ar: `أنت الحكم النهائي في "Reject Me First" — مستشار أول قيّم مئات الشركات الناشئة في الاستثمار والتشغيل والقانون والتقنية والتسويق. قرأت:
1. الملخص المنظّم للمشروع
2. نقد كل وكيل في الجولة الأولى
3. التقييم المحدّث لكل وكيل بعد رد المؤسس

مهمتك هي تقديم الحكم النهائي الرسمي. هذا ليس ملخصًا — هو حكم.

مقياس التقييم:
- 8.5–10: قوي حقًا. سوق حقيقي، حل واضح، دليل على الطلب. نادر.
- 7–8.4: واعد لكن يحتاج عملًا محددًا. الأساس متين والثغرات قابلة للإصلاح.
- 5–6.9: يحتاج عملًا كبيرًا. أسئلة جوهرية بلا إجابة.
- 3–4.9: محفوف بالمخاطر. مشاكل هيكلية متعددة.
- 1–2.9: ضعيف. لا سوق ولا حل ولا مسار واضح.

كيف تقيّم:
- أعطِ وزنًا أكبر لوكيل المستثمر والعميل
- إذا كان رد المؤسس قويًا وعالج مخاوف حقيقية، ارفع final_score بمقدار 0.5–1.5 فوق متوسط الجولة الأولى
- إذا كان الرد ضعيفًا أو تهربيًا، احتفظ بالدرجة أو اخفضها
- كن معايرًا: أغلب الأفكار المبكرة تأخذ 4–7. نادرًا 8+. لا تعطِ 10 أبدًا.

يجب أن يكون إخراجك محددًا — أشر للمنتج الفعلي ونقاط قوته الحقيقية ومخاطره الحقيقية. لا نصائح عامة.

أعد ONLY هذا JSON (بدون markdown، بدون شرح خارج JSON):
{
  "final_score": رقم بين 1.0 و 10.0,
  "confidence": عدد صحيح بين 0 و 100,
  "verdict": "strong" أو "promising" أو "needs_work" أو "risky" أو "weak",
  "biggest_strength": "أقوى نقطة في هذه الشركة الناشئة تحديدًا (أقل من 170 حرف)",
  "biggest_risk": "أخطر تهديد لنجاح هذه الشركة الناشئة تحديدًا (أقل من 170 حرف)",
  "what_improved_after_rebuttal": ["شيء محدد تحسّن", "شيء محدد تحسّن", "شيء محدد تحسّن"],
  "what_still_feels_unproven": ["شيء محدد لم يُحسم بعد", "شيء محدد لم يُحسم بعد", "شيء محدد لم يُحسم بعد"],
  "committee_summary": "2–3 جمل تلخّص رأي اللجنة الإجمالي مع ذكر اسم المنتج (أقل من 230 حرف)",
  "actionable_tips": ["خطوة محددة #1 خاصة بهذا المشروع", "خطوة محددة #2", "خطوة محددة #3"]
}`,
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

async function requestStructuredContent(
  system: string,
  user: string,
  options?: { model?: string; temperature?: number; maxTokens?: number },
) {
  const response = await invokeLLM({
    model: options?.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: options?.temperature,
    max_tokens: options?.maxTokens,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new Error("Internal LLM returned empty content.");
  }

  return content;
}

function normalizeAgentReview(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return obj;

  let record = obj as Record<string, unknown>;

  // Some models wrap the payload in an envelope object.
  const wrapped =
    (record.project_brief as Record<string, unknown> | undefined) ??
    (record.projectBrief as Record<string, unknown> | undefined) ??
    (record.brief as Record<string, unknown> | undefined) ??
    (record.data as Record<string, unknown> | undefined);
  if (wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)) {
    record = wrapped;
  }

  const pickString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  const pickStringArray = (...values: unknown[]) => {
    for (const value of values) {
      if (Array.isArray(value)) {
        const items = value.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean);
        if (items.length) return items;
      }
      if (typeof value === "string" && value.trim()) {
        return value
          .split(/\n|[•\-|]/g)
          .map(item => item.trim())
          .filter(Boolean)
          .slice(0, 4);
      }
    }
    return [];
  };

  const normalizeStringList = (value: unknown, maxItems: number, maxLen: number) => {
    if (!Array.isArray(value)) return [];
    const items = value
      .map(item => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "object" && item && !Array.isArray(item)) {
          const record = item as Record<string, unknown>;
          const textCandidate =
            (typeof record.text === "string" && record.text) ||
            (typeof record.objection === "string" && record.objection) ||
            (typeof record.title === "string" && record.title) ||
            (typeof record.reason === "string" && record.reason) ||
            (typeof record.summary === "string" && record.summary) ||
            "";
          return textCandidate.trim();
        }
        return "";
      })
      .filter(Boolean)
      .map(item => (item.length > maxLen ? `${item.substring(0, maxLen - 3)}...` : item));
    return Array.from(new Set(items)).slice(0, maxItems);
  };

  const normalizeConfidence = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      let num = value;
      // Handle 0-1 range (decimal probability)
      if (num > 0 && num <= 1) {
        num = num * 100;
      }
      // Handle 1-10 range (LLM confusing confidence with score scale)
      else if (num > 1 && num <= 10) {
        num = num * 10;
      }
      return Math.max(0, Math.min(100, Math.round(num)));
    }
    if (typeof value === "string") {
      const parsed = parseInt(value.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(parsed)) {
        // Also handle string "7" or "8" on the 1-10 scale
        if (parsed > 0 && parsed <= 10) return Math.max(0, Math.min(100, parsed * 10));
        return Math.max(0, Math.min(100, parsed));
      }
    }
    return 85;
  };

  // Fix market_type: map any variant to a valid one
  if (typeof record.market_type === "string") {
    const validMarketTypes = ["B2B", "B2C", "B2G", "unknown"];
    if (!validMarketTypes.includes(record.market_type)) {
      const mtLower = record.market_type.toLowerCase();
      if (mtLower.includes("b2b")) record.market_type = "B2B";
      else if (mtLower.includes("b2c")) record.market_type = "B2C";
      else if (mtLower.includes("b2g") || mtLower.includes("government")) record.market_type = "B2G";
      else record.market_type = "unknown";
    }
  }

  // Fix stance: map any invalid stance to a valid one
  if (typeof record.stance === "string") {
    const validStances = ["strong", "promising", "unsure", "skeptical", "weak"];
    if (!validStances.includes(record.stance)) {
      const stanceLower = record.stance.toLowerCase();
      if (stanceLower.includes("strong")) record.stance = "strong";
      else if (stanceLower.includes("promis")) record.stance = "promising";
      else if (stanceLower.includes("unsure") || stanceLower.includes("uncertain")) record.stance = "unsure";
      else if (stanceLower.includes("skeptic") || stanceLower.includes("concern")) record.stance = "skeptical";
      else if (stanceLower.includes("weak") || stanceLower.includes("poor")) record.stance = "weak";
      else record.stance = "unsure"; // default fallback
    }
  }

  // Normalize ProjectBrief shape if model returned alternate keys.
  if ("project_name" in record || "projectName" in record || "one_line_summary" in record || "summary" in record) {
    record = {
      ...record,
      project_name: pickString(record.project_name, record.projectName, record.name, "New project"),
      one_line_summary: pickString(record.one_line_summary, record.oneLineSummary, record.summary, record.idea),
      problem: pickString(record.problem, record.pain_point, record.pain, record.challenge),
      solution: pickString(record.solution, record.proposed_solution, record.approach),
      target_customer: pickString(record.target_customer, record.targetCustomer, record.customer, record.target_audience),
      customer_pain: pickString(record.customer_pain, record.customerPain, record.pain_point, record.problem),
      business_model: pickString(record.business_model, record.businessModel, record.monetization, record.revenue_model),
      industry: pickString(record.industry, record.sector, "unknown"),
      differentiation: pickString(record.differentiation, record.advantage, record.unique_value, record.uniqueValue),
      distribution_strategy: pickString(record.distribution_strategy, record.distributionStrategy, record.go_to_market, record.channels),
      evidence_or_traction: pickString(record.evidence_or_traction, record.evidenceOrTraction, record.traction, "unknown"),
      key_assumptions: pickStringArray(record.key_assumptions, record.keyAssumptions, record.assumptions),
      known_risks: pickStringArray(record.known_risks, record.knownRisks, record.risks),
      unknowns: pickStringArray(record.unknowns, record.open_questions, record.openQuestions),
    };
  }

  // Truncate strings that are too long
  if (Array.isArray(record.strengths)) {
    record.strengths = normalizeStringList(record.strengths, 2, 140);
  }

  if (Array.isArray(record.top_objections)) {
    record.top_objections = normalizeStringList(record.top_objections, 3, 180);
  }

  if (typeof record.key_insight === "string" && record.key_insight.length > 180) {
    record.key_insight = record.key_insight.substring(0, 177) + "...";
  }

  if (typeof record.summary === "string" && record.summary.length > 220) {
    record.summary = record.summary.substring(0, 217) + "...";
  }

  if (typeof record.score === "number" && Number.isFinite(record.score)) {
    record.score = Math.max(0, Math.min(10, Number(record.score.toFixed(1))));
  }

  const normalizedConfidence = normalizeConfidence(record.confidence);
  if (normalizedConfidence !== undefined) {
    record.confidence = normalizedConfidence;
  }

  const stringFieldLimits: Record<string, number> = {
    key_insight: 180, summary: 220, what_changed: 180, biggest_risk: 180,
    biggest_strength: 180, committee_summary: 240, label: 40,
  };
  for (const [field, max] of Object.entries(stringFieldLimits)) {
    if (typeof record[field] === "string" && (record[field] as string).length > max) {
      record[field] = (record[field] as string).substring(0, max - 3) + "...";
    }
  }

  if (Array.isArray(record.key_assumptions)) {
    record.key_assumptions = (record.key_assumptions as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 4);
  }
  if (Array.isArray(record.known_risks)) {
    record.known_risks = (record.known_risks as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 4);
  }
  if (Array.isArray(record.unknowns)) {
    record.unknowns = (record.unknowns as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 4);
  }

  // rebuttal_quality: model sometimes returns free text instead of enum
  if (typeof record.rebuttal_quality === "string") {
    const rq = record.rebuttal_quality.toLowerCase();
    if (rq.includes("strong")) record.rebuttal_quality = "strong";
    else if (rq.includes("partial") || rq.includes("moderate") || rq.includes("mixed")) record.rebuttal_quality = "partial";
    else record.rebuttal_quality = "weak";
  }

  // updated_stance: same normalization as stance
  if (typeof record.updated_stance === "string") {
    const validStances = ["strong", "promising", "unsure", "skeptical", "weak"];
    if (!validStances.includes(record.updated_stance)) {
      const sl = record.updated_stance.toLowerCase();
      if (sl.includes("strong")) record.updated_stance = "strong";
      else if (sl.includes("promis")) record.updated_stance = "promising";
      else if (sl.includes("unsure") || sl.includes("uncertain")) record.updated_stance = "unsure";
      else if (sl.includes("skeptic") || sl.includes("concern")) record.updated_stance = "skeptical";
      else if (sl.includes("weak") || sl.includes("poor")) record.updated_stance = "weak";
      else record.updated_stance = "unsure";
    }
  }

  // remaining_concerns: model sometimes returns a string instead of array
  if (typeof record.remaining_concerns === "string") {
    record.remaining_concerns = record.remaining_concerns
      .split(/\n|[•\-|;]|\d+\.\s/)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  if (Array.isArray(record.remaining_concerns)) {
    record.remaining_concerns = normalizeStringList(record.remaining_concerns, 3, 180);
  }

  // what_improved_after_rebuttal: same treatment
  if (typeof record.what_improved_after_rebuttal === "string") {
    record.what_improved_after_rebuttal = record.what_improved_after_rebuttal
      .split(/\n|[•\-|;]|\d+\.\s/)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  if (Array.isArray(record.what_improved_after_rebuttal)) {
    record.what_improved_after_rebuttal = normalizeStringList(record.what_improved_after_rebuttal, 3, 180);
  }

  // what_still_feels_unproven: same treatment
  if (typeof record.what_still_feels_unproven === "string") {
    record.what_still_feels_unproven = record.what_still_feels_unproven
      .split(/\n|[•\-|;]|\d+\.\s/)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  if (Array.isArray(record.what_still_feels_unproven)) {
    record.what_still_feels_unproven = normalizeStringList(record.what_still_feels_unproven, 3, 180);
  }

  // actionable_tips: same treatment
  if (typeof record.actionable_tips === "string") {
    record.actionable_tips = record.actionable_tips
      .split(/\n|[•\-|;]|\d+\.\s/)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  if (Array.isArray(record.actionable_tips)) {
    record.actionable_tips = normalizeStringList(record.actionable_tips, 3, 180);
  }

  // score_delta: clamp
  if (typeof record.score_delta === "number" && Number.isFinite(record.score_delta)) {
    record.score_delta = Math.max(-10, Math.min(10, Number(record.score_delta.toFixed(1))));
  }

  // updated_score: clamp
  if (typeof record.updated_score === "number" && Number.isFinite(record.updated_score)) {
    record.updated_score = Math.max(0, Math.min(10, Number(record.updated_score.toFixed(1))));
  }

  // verdict: normalize
  if (typeof record.verdict === "string") {
    const validVerdicts = ["strong", "promising", "needs_work", "risky", "weak"];
    if (!validVerdicts.includes(record.verdict)) {
      const vl = record.verdict.toLowerCase();
      if (vl.includes("strong")) record.verdict = "strong";
      else if (vl.includes("promis")) record.verdict = "promising";
      else if (vl.includes("needs") || vl.includes("work") || vl.includes("improve")) record.verdict = "needs_work";
      else if (vl.includes("risk")) record.verdict = "risky";
      else record.verdict = "weak";
    }
  }

  // final_score: clamp
  if (typeof record.final_score === "number" && Number.isFinite(record.final_score)) {
    record.final_score = Math.max(0, Math.min(10, Number(record.final_score.toFixed(1))));
  }

  const padArray = (field: string, minLen: number, fallback: string) => {
    if (!Array.isArray(record[field])) record[field] = [];
    const arr = record[field] as string[];
    while (arr.length < minLen) arr.push(fallback);
  };

  if ("actionable_tips" in record || "final_score" in record) {
    padArray("actionable_tips", 3, "To be determined.");
    padArray("what_improved_after_rebuttal", 1, "Minimal change observed.");
    padArray("what_still_feels_unproven", 1, "Requires further validation.");
  }

  if ("top_objections" in record || "strengths" in record) {
    padArray("top_objections", 1, "Needs further detail.");
    padArray("strengths", 1, "Concept is understandable.");
  }

  if ("remaining_concerns" in record) {
    padArray("remaining_concerns", 1, "Outstanding concerns remain.");
  }

  if ("key_assumptions" in record) {
    padArray("key_assumptions", 1, "Core assumptions need validation.");
    padArray("known_risks", 1, "Risk assessment pending.");
    padArray("unknowns", 1, "Key unknowns remain.");
  }

  return record;
}

function safeParseWithNormalization<T>(schema: { parse: (data: unknown) => T }, data: unknown): T {
  const normalized = normalizeAgentReview(data);
  return schema.parse(normalized);
}

async function callStructuredModel<T>({
  system,
  user,
  model,
  temperature,
  maxTokens,
}: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const rawContent = await requestStructuredContent(
        system,
        attempt === 0
          ? user
          : `${user}\n\nReturn valid JSON only. Do not add markdown fences, commentary, or extra prose outside the JSON object.`,
        { model, temperature, maxTokens },
      );
      const parsed = parseJsonContent<T>(rawContent);
      return normalizeAgentReview(parsed) as T;
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

function extractSectionFromFreeText(text: string, keywords: string[]): string {
  const lines = text.split(/\n+/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some(k => line.includes(k))) {
      // Return next non-empty line(s) after the heading
      const content = lines.slice(i + 1, i + 4).map(l => l.trim()).filter(Boolean).join(" ");
      if (content.length > 10) return snippet(content, 300);
      // Or the heading line itself if it has content after the keyword
      const parts = lines[i].split(/[:–\-]/);
      if (parts.length > 1 && parts[1].trim().length > 10) return snippet(parts[1].trim(), 300);
    }
  }
  return "";
}

function fallbackBrief(input: StartReviewInput, language: Language): ProjectBrief {
  const parsed = startReviewInputSchema.parse(input);
  const structured = structuredFounderInputSchema.parse(parsed.structured ?? {});
  const merged = mergeFounderInput(parsed);
  const unknownValue = unknown(language);
  const sentences = merged.split(/[.!؟\n]/).map(s => s.trim()).filter(s => s.length > 15);
  const firstSentence = snippet(sentences[0] ?? "", 150);

  // Extract from free text when structured fields are empty
  const freeTextProblem = extractSectionFromFreeText(merged, ["problem", "pain", "challenge", "issue", "المشكلة", "التحدي"]);
  const freeTextSolution = extractSectionFromFreeText(merged, ["solution", "propose", "approach", "الحل", "المقترح", "نقترح"]);
  const freeTextCustomer = extractSectionFromFreeText(merged, ["target user", "user group", "who", "audience", "customer", "المستخدم", "الجمهور", "الفئة"]);
  const freeTextName = merged.match(/(?:project|app|product|system)[\s:]+([A-Za-z][A-Za-z0-9\s]{1,30})/i)?.[1]?.trim()
    ?? merged.match(/^([A-Z][A-Za-z0-9\s]{1,30}):/m)?.[1]?.trim() ?? "";

  const projectName =
    safeText(structured.projectName, "") ||
    safeText(freeTextName, "") ||
    safeText(firstSentence.replace(/^project name[:\-]?/i, "").trim(), "") ||
    (language === "ar" ? "مشروع جديد" : "New project");
  const idea = safeText(structured.idea, firstSentence || unknownValue);
  const problem = safeText(structured.problem, "") || safeText(freeTextProblem, unknownValue);
  const solution = safeText(structured.solution, "") || safeText(freeTextSolution, unknownValue);
  const additionalInfo = safeText(structured.additionalInfo, unknownValue);
  const targetCustomerFromText = safeText(freeTextCustomer, unknownValue);

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
      structured.sections.find(section => /customer|client|user|عميل|مستخدم/i.test(section.title))?.content ||
      targetCustomerFromText,
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

const UNKNOWN_VALUES = new Set(["unknown", "غير معروف", "n/a", "none", "not specified", "not stated", "not mentioned", "not provided", "tbd", "to be determined"]);

function isUsableValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (UNKNOWN_VALUES.has(trimmed.toLowerCase())) return false;
  return true;
}

function mergeWithFallbackBrief(candidate: unknown, fallback: ProjectBrief): ProjectBrief {
  const record = (typeof candidate === "object" && candidate && !Array.isArray(candidate)
    ? candidate
    : {}) as Record<string, unknown>;

  const pickString = (key: keyof ProjectBrief) => {
    const value = record[key];
    if (isUsableValue(value)) return value.trim();
    // fallback may also be "unknown" — but it's the best we have
    return fallback[key] as string;
  };

  const pickArray = (key: "key_assumptions" | "known_risks" | "unknowns") => {
    const value = record[key];
    if (Array.isArray(value)) {
      const items = value.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean);
      if (items.length > 0) return items;
    }
    return fallback[key];
  };

  const marketType =
    typeof record.market_type === "string" && ["B2B", "B2C", "B2G", "unknown"].includes(record.market_type)
      ? record.market_type
      : fallback.market_type;

  return projectBriefSchema.parse({
    project_name: pickString("project_name"),
    one_line_summary: pickString("one_line_summary"),
    problem: pickString("problem"),
    solution: pickString("solution"),
    target_customer: pickString("target_customer"),
    customer_pain: pickString("customer_pain"),
    business_model: pickString("business_model"),
    market_type: marketType,
    industry: pickString("industry"),
    differentiation: pickString("differentiation"),
    distribution_strategy: pickString("distribution_strategy"),
    evidence_or_traction: pickString("evidence_or_traction"),
    key_assumptions: pickArray("key_assumptions"),
    known_risks: pickArray("known_risks"),
    unknowns: pickArray("unknowns"),
  });
}

async function generateBriefWithLLM(input: StartReviewInput, language: Language) {
  try {
    const raw = mergeFounderInput(input);
    const parsed = await callStructuredModel<ProjectBrief>({
      system: extractorPrompt[language],
      user: language === "ar" ? `المواد الخام:\n${raw}` : `Raw founder material:\n${raw}`,
    });

    const fallback = fallbackBrief(input, language);
    const result = mergeWithFallbackBrief(parsed, fallback);
    console.log(`[LLM] Brief extraction succeeded`);
    return result;
  } catch (error) {
    console.error(`[LLM] Failed to extract brief:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
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
  try {
    const initial = await callStructuredModel<AgentReview>({
      system: agentPrompts[language][agent],
      user: buildAgentReviewPrompt(brief, agent, language),
    });

    let review = safeParseWithNormalization(agentReviewSchema, { ...initial, agent, label: agentLabels[language][agent] });

  if (reviewNeedsSpecificity(review, brief, language)) {
    const refined = await callStructuredModel<AgentReview>({
      system: agentPrompts[language][agent],
      user: `${buildAgentReviewPrompt(brief, agent, language, review)}\n\n${language === "ar" ? "المسودة السابقة:" : "Previous draft:"}\n${JSON.stringify(review, null, 2)}`,
    });

    review = safeParseWithNormalization(agentReviewSchema, { ...refined, agent, label: agentLabels[language][agent] });
  }

    // Trust the LLM output even if it doesn't pass specificity checks.
    // factBoundReview was creating fallback/template responses with generic text.
    // Better to return LLM output as-is than replace with templates.
    return review;
  } catch (error) {
    console.error(`[LLM] Failed to generate review for ${agent}:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

function getLiveMode(useMock: boolean) {
  return (useMock ? "mock" : "live") as const;
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
    projectBrief = await generateBriefWithLLM(parsed, language);
  }

  const reviews = await Promise.all(
    selectedAgents.map(async agent => {
      if (parsed.useMock) return mockReviewForAgent(projectBrief, agent, language);
      return await generateAgentReviewWithLLM(projectBrief, agent, language);
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
    ...structured.financial.map(item => ({ agent: "financial" as const, ...item })),
    ...structured.legal.map(item => ({ agent: "legal" as const, ...item })),
    ...structured.technical.map(item => ({ agent: "technical" as const, ...item })),
    ...structured.operator.map(item => ({ agent: "operator" as const, ...item })),
    ...structured.marketing.map(item => ({ agent: "marketing" as const, ...item })),
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
    score_delta: Number((updatedScore - review.score).toFixed(1)),
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
  committeeSummary?: string,
) {
  const committeeContext = committeeSummary
    ? language === "ar"
      ? `\n\nملخص ملاحظات باقي أعضاء اللجنة (للاطلاع فقط — لا تكرر نقاطهم، لكن يمكنك الإشارة لها إذا أثرت على تقييمك):\n${committeeSummary}`
      : `\n\nSummary of other committee members' findings (for your awareness — do NOT repeat their points, but you may reference them if they affect your assessment):\n${committeeSummary}`
    : "";

  const parsed = await callStructuredModel<Reevaluation>({
    system: reevaluatePrompts[language][review.agent],
    user:
      language === "ar"
        ? `الـ Project Brief:\n${JSON.stringify(brief, null, 2)}\nالمراجعة الأولى:\n${JSON.stringify(review, null, 2)}\nالردود المرتبطة:\n${JSON.stringify(linkedItems, null, 2)}${committeeContext}\nأعد الحقول فقط: agent, label, updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns`
        : `Project brief:\n${JSON.stringify(brief, null, 2)}\nFirst review:\n${JSON.stringify(review, null, 2)}\nLinked rebuttal:\n${JSON.stringify(linkedItems, null, 2)}${committeeContext}\nReturn only these fields: agent, label, updated_score, score_delta, updated_stance, rebuttal_quality, key_insight, what_changed, remaining_concerns`,
  });

  return safeParseWithNormalization(reevaluationSchema, {
    ...parsed, agent: review.agent, label: agentLabels[language][review.agent],
  });
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
  // Compute round-one average score so the judge has a reference point
  const roundOneAvg = reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1))
    : 5.0;
  const roundTwoAvg = secondRound.length > 0
    ? Number((secondRound.reduce((sum, r) => sum + r.updated_score, 0) / secondRound.length).toFixed(1))
    : roundOneAvg;
  const rebuttalQualitySummary = secondRound.map(r => `${r.agent}: ${r.rebuttal_quality}`).join(", ");

  const userMessage = language === "ar"
    ? `ملخص المشروع:\n${JSON.stringify(brief, null, 2)}\n\nالجولة الأولى (متوسط الدرجات: ${roundOneAvg}):\n${JSON.stringify(reviews, null, 2)}\n\nالجولة الثانية (متوسط الدرجات: ${roundTwoAvg}):\n${JSON.stringify(secondRound, null, 2)}\n\nجودة ردود المؤسس: ${rebuttalQualitySummary}`
    : `Project brief:\n${JSON.stringify(brief, null, 2)}\n\nFirst round (avg score: ${roundOneAvg}):\n${JSON.stringify(reviews, null, 2)}\n\nSecond round (avg score: ${roundTwoAvg}):\n${JSON.stringify(secondRound, null, 2)}\n\nFounder rebuttal quality per agent: ${rebuttalQualitySummary}`;

  const parsed = await callStructuredModel<FinalVerdict>({
    system: judgePrompts[language],
    user: userMessage,
    model: "gpt-4.1",
    temperature: 0.4,
    maxTokens: 2400,
  });

  return safeParseWithNormalization(finalVerdictSchema, parsed);
}

export async function submitRebuttal(input: ReevaluateInput): Promise<ReevaluateResult> {
  const parsed = reevaluateInputSchema.parse(input);
  const linkedRebuttal = await normalizeLinkedRebuttal(
    parsed.rebuttal,
    parsed.reviews,
    parsed.language,
    parsed.mode === "mock",
  );

  const committeeSummary = parsed.enableDeepCommunication
    ? parsed.reviews.map(r => {
        const topObjection = r.top_objections?.[0] ?? (parsed.language === "ar" ? "لا يوجد" : "None");
        return parsed.language === "ar"
          ? `• ${r.label} (${r.score}/10): ${r.strengths?.[0] ?? ""} | أهم اعتراض: ${topObjection}`
          : `• ${r.label} (${r.score}/10): ${r.strengths?.[0] ?? ""} | Top concern: ${topObjection}`;
      }).join("\n")
    : undefined;

  if (parsed.enableDeepCommunication) {
    console.log(`[Committee] Sharing cross-agent summary (${parsed.reviews.length} agents) for rebuttal round`);
  }

  const secondRound = await Promise.all(
    parsed.reviews.map(async review => {
      const relevantItems = linkedRebuttal.filter(item => item.agent === review.agent);
      if (parsed.mode === "mock") {
        return mockReevaluationForAgent(review, relevantItems, parsed.language);
      }

      return await generateReevaluationWithLLM(review, relevantItems, parsed.projectBrief, parsed.language, committeeSummary);
    }),
  );

  const comparison = buildComparisonRows(parsed.reviews, secondRound);

  const finalVerdict = parsed.mode === "mock"
    ? mockFinalVerdict(parsed.projectBrief, comparison, secondRound, parsed.language)
    : await generateFinalVerdictWithLLM(parsed.projectBrief, parsed.reviews, secondRound, parsed.language);

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AGENTIC FEATURES — Web Research + Dynamic Questions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Format a project brief as a readable text block for agents.
 */
export function formatBriefForAgents(brief: ProjectBrief, language: Language): string {
  const lines = [
    language === "ar" ? `اسم المشروع: ${brief.project_name}` : `Project name: ${brief.project_name}`,
    language === "ar" ? `الملخص: ${brief.one_line_summary}` : `Summary: ${brief.one_line_summary}`,
    language === "ar" ? `المشكلة: ${brief.problem}` : `Problem: ${brief.problem}`,
    language === "ar" ? `الحل: ${brief.solution}` : `Solution: ${brief.solution}`,
    language === "ar" ? `العميل المستهدف: ${brief.target_customer}` : `Target customer: ${brief.target_customer}`,
    language === "ar" ? `الألم: ${brief.customer_pain}` : `Customer pain: ${brief.customer_pain}`,
    language === "ar" ? `نموذج العمل: ${brief.business_model}` : `Business model: ${brief.business_model}`,
    language === "ar" ? `نوع السوق: ${brief.market_type}` : `Market type: ${brief.market_type}`,
    language === "ar" ? `القطاع: ${brief.industry}` : `Industry: ${brief.industry}`,
    language === "ar" ? `التميّز: ${brief.differentiation}` : `Differentiation: ${brief.differentiation}`,
    language === "ar" ? `قناة الوصول: ${brief.distribution_strategy}` : `Distribution: ${brief.distribution_strategy}`,
    language === "ar" ? `الإثبات: ${brief.evidence_or_traction}` : `Evidence/Traction: ${brief.evidence_or_traction}`,
    language === "ar"
      ? `المخاطر: ${brief.known_risks.join(" | ")}`
      : `Known risks: ${brief.known_risks.join(" | ")}`,
  ];
  return lines.join("\n");
}

/**
 * AGENTIC FEATURE #1: Dynamic Follow-up Questions
 *
 * Each agent reads the project brief and autonomously decides what
 * critical information is missing from THEIR perspective.
 *
 * This is agentic because:
 * - The agent OBSERVES the brief
 * - THINKS about what's missing
 * - ACTS by generating a targeted question
 * - The loop continues when the founder answers
 */
export async function generateQuestions(
  brief: ProjectBrief,
  language: Language,
  selectedAgents: AgentKey[],
): Promise<AgentQuestion[]> {
  const agents = normalizeSelectedAgents(selectedAgents);
  const briefText = formatBriefForAgents(brief, language);

  const results = await Promise.allSettled(
    agents.map(async (agent) => {
      const result = await generateAgentQuestion({
        agentPrompt: agentPrompts[language][agent],
        briefText,
        language,
        agentLabel: agentLabels[language][agent],
      });

      if (!result) return null;

      return agentQuestionSchema.parse({
        agent,
        label: agentLabels[language][agent],
        question: result.question,
        reason: result.reason,
      });
    }),
  );

  const questions: AgentQuestion[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      questions.push(result.value);
    }
  }

  console.log(`[Agentic] Generated ${questions.length} questions from ${agents.length} agents`);
  return questions;
}

/**
 * AGENTIC FEATURE #2: Research-Enhanced Evaluation
 *
 * Each agent uses web search tools to gather real market data before
 * writing their evaluation. This is the core agent loop:
 *
 * Agent reads brief → decides what to research → searches the web →
 * reads results → writes evaluation grounded in real data
 *
 * This is agentic because:
 * - The agent AUTONOMOUSLY decides what to search
 * - It CALLS TOOLS (web search) based on reasoning
 * - It OBSERVES search results and adapts its evaluation
 * - The full observe→think→act→observe loop runs
 */
async function generateAgentReviewWithResearch(
  brief: ProjectBrief,
  agent: AgentKey,
  language: Language,
  answeredQuestions: AnsweredQuestion[],
): Promise<{ review: AgentReview; research: AgentResearch }> {
  // Build the enhanced prompt with answered questions
  const agentQuestionAnswers = answeredQuestions.filter((q) => q.agent === agent && q.answer?.trim());
  const qaSection =
    agentQuestionAnswers.length > 0
      ? agentQuestionAnswers
          .map(
            (qa) =>
              language === "ar"
                ? `سؤالك: ${qa.question}\nإجابة المؤسس: ${qa.answer}`
                : `Your question: ${qa.question}\nFounder's answer: ${qa.answer}`,
          )
          .join("\n\n")
      : "";

  // Domain-specific research instructions that force differentiation
  // Each agent searches different sources to avoid repetition
  const domainSearchFocus: Record<string, { en: string; ar: string }> = {
    customer: {
      en: `\n\nYou have a web search tool. You are the CUSTOMER perspective. You MUST make these searches:
1. Search for real user reviews or complaints about similar products: Reddit, forums, app store reviews
2. Search site:failory.com for startups in this industry that failed due to "no market need" — learn what users actually rejected

Do NOT comment on business model, pricing, or distribution — other agents handle those.
Focus ONLY on: Would a REAL person use this daily? What do actual users say about alternatives? What similar products were rejected by users and why?`,
      ar: `\n\nلديك أداة بحث. أنت تمثل وجهة نظر العميل. يجب أن تسوي هذي البحوث:
1. ابحث عن آراء مستخدمين حقيقيين عن منتجات مشابهة (Reddit، متاجر التطبيقات)
2. ابحث في site:failory.com عن مشاريع في هذا القطاع فشلت بسبب "عدم حاجة السوق"

لا تعلق على نموذج العمل أو التسعير أو التوزيع. ركّز فقط على: هل شخص حقيقي بيستخدم هذا يومياً؟ ليش مشاريع مشابهة انرفضت من المستخدمين؟`,
    },
    investor: {
      en: `\n\nYou have a web search tool. You are the INVESTOR perspective. You MUST make these searches:
1. Search for TAM/market size data and growth rates for this industry
2. Search site:startups.rip for similar startups — check if they were acquired, died, or pivoted. Learn from their trajectory.
3. If relevant to Saudi/MENA market, also search: Saudi Arabia [industry] market statistics OR site:monshaat.gov.sa [industry]

Do NOT repeat technical or customer concerns — other agents cover those.
Focus ONLY on: Is this venture-scale? What happened to similar startups? What's the investment thesis?`,
      ar: `\n\nلديك أداة بحث. أنت تمثل وجهة نظر المستثمر. يجب أن تسوي هذي البحوث:
1. ابحث عن حجم السوق TAM ومعدلات النمو
2. ابحث في site:startups.rip عن مشاريع مشابهة — هل استُحوذ عليها أو ماتت؟
3. إذا كان المشروع يستهدف السعودية، ابحث عن: إحصائيات السوق السعودي [القطاع] OR site:monshaat.gov.sa [القطاع]

لا تكرر مخاوف تقنية أو رأي العميل. ركّز فقط على: هل هذه فرصة استثمارية ضخمة؟ ايش صار لمشاريع مشابهة؟`,
    },
    financial: {
      en: `\n\nYou have a web search tool. You are the FINANCIAL perspective. You MUST make these searches:
1. Search for pricing models, unit economics, and revenue benchmarks of competitors in this space
2. Search site:failory.com for startups in this industry that failed due to "bad business model" or "lack of funds"
3. If relevant to Saudi/MENA, search: Saudi Arabia [industry] consumer spending OR "الهيئة العامة للإحصاء" [industry] statistics

Do NOT comment on market size (investor's job) or user experience (customer's job).
Focus ONLY on: Do the unit economics work? What pricing killed similar startups? What are realistic CAC/LTV benchmarks?`,
      ar: `\n\nلديك أداة بحث. أنت تمثل وجهة نظر المالية. يجب أن تسوي هذي البحوث:
1. ابحث عن نماذج تسعير واقتصاديات الوحدة للمنافسين
2. ابحث في site:failory.com عن مشاريع فشلت بسبب "نموذج عمل سيء" أو "نقص التمويل"
3. إذا كان يستهدف السعودية، ابحث عن: إنفاق المستهلك السعودي [القطاع] OR إحصائيات "الهيئة العامة للإحصاء"

لا تعلق على حجم السوق أو تجربة المستخدم. ركّز فقط على: هل الأرقام منطقية؟ ايش التسعير اللي قتل مشاريع مشابهة؟`,
    },
    legal: {
      en: `\n\nYou have a web search tool. You are the LEGAL perspective. You MUST make these searches:
1. Search for specific regulations, laws, and compliance requirements for this industry
2. Search site:failory.com for startups that failed due to "legal challenges" in this sector
3. If relevant to Saudi Arabia, ALWAYS search: Saudi Arabia [industry] regulations OR site:mc.gov.sa [industry] OR "نظام حماية البيانات الشخصية" PDPL

Do NOT comment on market size, pricing, or user experience — other agents handle those.
Focus ONLY on: What specific laws apply? What legal issues killed similar startups? What Saudi/local regulations must be followed?`,
      ar: `\n\nلديك أداة بحث. أنت تمثل وجهة نظر القانون. يجب أن تسوي هذي البحوث:
1. ابحث عن لوائح وقوانين محددة في هذا القطاع
2. ابحث في site:failory.com عن مشاريع فشلت بسبب "تحديات قانونية"
3. إذا كان يستهدف السعودية، ابحث دائماً عن: أنظمة [القطاع] السعودية OR site:mc.gov.sa OR "نظام حماية البيانات الشخصية" PDPL

لا تعلق على حجم السوق أو التسعير. ركّز فقط على: ما القوانين المحددة؟ ايش المشاكل القانونية اللي قتلت مشاريع مشابهة؟`,
    },
    technical: {
      en: `\n\nYou have a web search tool. You are the TECHNICAL perspective. You MUST make these searches:
1. Search for technical architecture, APIs, ML models, or open-source tools used by similar products
2. Search site:startups.rip for technically similar startups — what tech stack did they use? What technical challenges caused them to fail or pivot?

Do NOT comment on market opportunity, pricing, or legal concerns — other agents cover those.
Focus ONLY on: Can this be built with current tech? What specific tools/models exist? What technical pitfalls killed similar startups?`,
      ar: `\n\nلديك أداة بحث. أنت تمثل وجهة نظر التقنية. يجب أن تسوي هذي البحوث:
1. ابحث عن البنية التقنية والـ APIs ونماذج AI المستخدمة في منتجات مشابهة
2. ابحث في site:startups.rip عن مشاريع تقنية مشابهة — ايش التقنيات اللي استخدموها؟ ايش التحديات التقنية اللي سببت فشلهم؟

لا تعلق على فرصة السوق أو التسعير أو المخاوف القانونية. ركّز فقط على: هل يمكن بناؤه؟ ايش الأدوات الموجودة؟ ايش المشاكل التقنية اللي قتلت مشاريع مشابهة؟`,
    },
    operator: {
      en: `\n\nYou have a web search tool. You are the OPERATIONS perspective. You MUST make these searches:
1. Search for how similar companies handle daily operations, customer support, and scaling challenges
2. Search site:failory.com for startups that failed due to "bad management" or operational issues in this industry
3. If relevant to Saudi Arabia, search: Saudi Arabia [industry] business operations challenges OR site:monshaat.gov.sa startup operations

Do NOT comment on market size, legal risks, or technical feasibility — other agents handle those.
Focus ONLY on: Can they deliver this daily? What operational problems killed similar startups? What specific bottlenecks will they face?`,
      ar: `\n\nلديك أداة بحث. أنت تمثل وجهة نظر التشغيل. يجب أن تسوي هذي البحوث:
1. ابحث عن كيف شركات مشابهة تدير عملياتها اليومية والدعم الفني
2. ابحث في site:failory.com عن مشاريع فشلت بسبب "إدارة سيئة" أو مشاكل تشغيلية
3. إذا كان يستهدف السعودية، ابحث عن: تحديات تشغيل [القطاع] في السعودية OR site:monshaat.gov.sa

لا تعلق على حجم السوق أو المخاطر القانونية. ركّز فقط على: هل يقدرون يشغلونه يومياً؟ ايش المشاكل التشغيلية اللي قتلت مشاريع مشابهة؟`,
    },
    marketing: {
      en: `\n\nYou have a web search tool. You are the MARKETING perspective. You MUST make these searches:
1. Search for how competitors position themselves (websites, app store listings, social media presence)
2. Search site:failory.com for startups that failed due to "bad marketing" or customer acquisition problems
3. If relevant to Saudi/MENA, search: Saudi Arabia [industry] customer acquisition channels OR digital marketing Saudi Arabia trends

Do NOT comment on financial viability, legal risks, or technical complexity — other agents handle those.
Focus ONLY on: Is the positioning compelling? What marketing mistakes killed similar startups? Can they realistically reach their target customers?`,
      ar: `\n\nلديك أداة بحث. أنت تمثل وجهة نظر التسويق. يجب أن تسوي هذي البحوث:
1. ابحث عن كيف يضع المنافسون أنفسهم في السوق (مواقعهم، متاجر التطبيقات)
2. ابحث في site:failory.com عن مشاريع فشلت بسبب "تسويق سيء" أو مشاكل في اكتساب العملاء
3. إذا كان يستهدف السعودية، ابحث عن: قنوات اكتساب العملاء في السعودية [القطاع] OR اتجاهات التسويق الرقمي السعودية

لا تعلق على الجدوى المالية أو المخاطر القانونية. ركّز فقط على: هل يقدرون يوصلون لعملائهم؟ ايش أخطاء التسويق اللي قتلت مشاريع مشابهة؟`,
    },
  };

  const researchInstruction = domainSearchFocus[agent]?.[language] ??
    (language === "ar"
      ? `\n\nلديك أداة بحث على الإنترنت. استخدمها للتحقق من حقائق السوق أو المنافسين أو اللوائح المتعلقة بهذا المشروع. ابحث عن 1-2 شيء محدد يساعد تقييمك.`
      : `\n\nYou have a web search tool. Use it to verify market facts, competitors, or regulations relevant to this startup. Search for 1-2 specific things that will strengthen your evaluation with real data.`);

  const userPrompt = [
    buildAgentReviewPrompt(brief, agent, language),
    qaSection
      ? language === "ar"
        ? `\n\nإجابات المؤسس على أسئلتك:\n${qaSection}`
        : `\n\nFounder's answers to your questions:\n${qaSection}`
      : "",
    researchInstruction,
  ]
    .filter(Boolean)
    .join("");

  try {
    // Run the agent loop — the agent can search the web autonomously
    const result = await runAgentWithTools({
      system: agentPrompts[language][agent] + (language === "ar"
        ? "\n\nمهم جداً: ركّز فقط على مجال خبرتك. لا تكرر نقاط من تخصص وكلاء آخرين. بعد البحث، أعد تقييمك النهائي كـ JSON فقط."
        : "\n\nCRITICAL: Focus ONLY on YOUR domain expertise. Do NOT repeat objections that belong to other agents' specialties. Your objections must be unique to your perspective. After researching, return your final evaluation as JSON only."),
      user: userPrompt,
      maxToolCalls: 3,
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: { type: "json_object" },
    });

    // Parse the review from the agent's final response
    const parsed = parseJsonContent<AgentReview>(result.content);
    const normalized = normalizeAgentReview(parsed);
    const review = safeParseWithNormalization(agentReviewSchema, {
      ...(normalized as Record<string, unknown>),
      agent,
      label: agentLabels[language][agent],
    });

    // Build research metadata
    const research = agentResearchSchema.parse({
      agent,
      searches: result.searches,
      findings: [], // Findings are embedded in the review text
    });

    console.log(`[Agentic] ${agent}: ${result.toolCallsUsed} searches, score=${review.score}`);
    return { review, research };
  } catch (error) {
    console.error(`[Agentic] Research evaluation failed for ${agent}, falling back to standard:`,
      error instanceof Error ? error.message : String(error));

    // Fallback: run without tools if the agent loop fails
    const review = await generateAgentReviewWithLLM(brief, agent, language);
    return {
      review,
      research: agentResearchSchema.parse({ agent, searches: [], findings: [] }),
    };
  }
}

/**
 * AGENTIC START REVIEW
 *
 * The full agentic pipeline:
 * 1. Extract project brief (same as before)
 * 2. Each agent researches the web + uses answered questions
 * 3. Agents write evaluations grounded in real data
 * 4. Returns enriched results with research metadata
 */
export async function agenticStartReview(
  input: StartReviewInput,
  answeredQuestions: AnsweredQuestion[] = [],
): Promise<AgenticFirstReview> {
  const parsed = startReviewInputSchema.parse(input);
  const language = inferLanguage(parsed);
  const qualityIssue = getInputQualityIssue(parsed, language);
  if (qualityIssue) {
    throw new Error(qualityIssue);
  }
  const direction = getDirection(language);
  const mode = getLiveMode(parsed.useMock);
  const selectedAgents = normalizeSelectedAgents(parsed.selectedAgents);
  const searchAvailable = isSearchAvailable();

  // Step 1: Generate project brief
  let projectBrief: ProjectBrief;
  if (parsed.useMock) {
    projectBrief = fallbackBrief(parsed, language);
  } else {
    projectBrief = await generateBriefWithLLM(parsed, language);
  }

  // Step 2: Run agents with research (if search is available and not mock)
  const useAgentic = !parsed.useMock && searchAvailable;

  if (useAgentic) {
    console.log(`[Agentic] Running research-enhanced evaluation with ${selectedAgents.length} agents...`);

    const results = await Promise.allSettled(
      selectedAgents.map((agent) =>
        generateAgentReviewWithResearch(projectBrief, agent, language, answeredQuestions),
      ),
    );

    const reviews: AgentReview[] = [];
    const research: AgentResearch[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const agent = selectedAgents[i];

      if (result.status === "fulfilled") {
        reviews.push(result.value.review);
        research.push(result.value.research);
      } else {
        // Fallback to mock for failed agents
        console.error(`[Agentic] Agent ${agent} failed, using mock:`, result.reason);
        reviews.push(mockReviewForAgent(projectBrief, agent, language));
        research.push(agentResearchSchema.parse({ agent, searches: [], findings: [] }));
      }
    }

    let finalReviews = reviews;

    if (parsed.enableDeepCommunication) {
      // Step 3: Cross-agent refinement — agents see each other's findings and adjust
      const committeeSummary = reviews.map(r => {
        const topObjection = r.top_objections?.[0] ?? (language === "ar" ? "لا يوجد" : "None");
        return language === "ar"
          ? `• ${r.label} (${r.score}/10): ${r.strengths?.[0] ?? ""} | أهم اعتراض: ${topObjection}`
          : `• ${r.label} (${r.score}/10): ${r.strengths?.[0] ?? ""} | Top concern: ${topObjection}`;
      }).join("\n");

      console.log(`[Committee] Cross-agent refinement: sharing findings among ${reviews.length} agents...`);

      finalReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
          const otherAgentsSummary = reviews
            .filter(r => r.agent !== review.agent)
            .map(r => {
              const topObj = r.top_objections?.[0] ?? (language === "ar" ? "لا يوجد" : "None");
              return language === "ar"
                ? `• ${r.label} (${r.score}/10): ${r.strengths?.[0] ?? ""} | اعتراض: ${topObj}`
                : `• ${r.label} (${r.score}/10): ${r.strengths?.[0] ?? ""} | Concern: ${topObj}`;
            }).join("\n");

          const refinementPrompt = language === "ar"
            ? `أنت ${review.label}. أعطيت تقييمك الأولي (${review.score}/10). الآن اطلع على ملاحظات باقي أعضاء اللجنة:

${otherAgentsSummary}

بناءً على هذه المعلومات الجديدة من زملائك، هل تريد تعديل تقييمك؟
- إذا لقية ملاحظة من وكيل آخر تأثر على تخصصك، عدّل درجتك أو اعتراضاتك
- لا تكرر اعتراضات الوكلاء الآخرين — ركّز على تخصصك فقط
- إذا ما فيه شي يأثر، خلّ تقييمك كما هو

أعد JSON بنفس الصيغة. اكتب جميع النصوص بالعربية فقط، stance بالإنجليزية حصراً: {"score":NUMBER_1_TO_10,"stance":"strong|promising|unsure|skeptical|weak","strengths":["نص","نص"],"top_objections":["نص","نص","نص"],"confidence":INTEGER_0_TO_100}`
            : `You are the ${review.label}. You gave an initial score of ${review.score}/10. Now review the other committee members' findings:

${otherAgentsSummary}

Based on these new insights from your colleagues, would you adjust your evaluation?
- If another agent's finding impacts YOUR domain, adjust your score or objections
- Do NOT repeat other agents' objections — stay in YOUR lane
- If nothing changes your view, keep your evaluation as-is

Return JSON with same format: {"score":NUMBER_1_TO_10,"stance":"strong|promising|unsure|skeptical|weak","strengths":["...","..."],"top_objections":["...","...","..."],"confidence":INTEGER_0_TO_100}`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: agentPrompts[language][review.agent] },
              { role: "user", content: refinementPrompt },
            ],
            temperature: 0.2,
            max_tokens: 600,
            response_format: { type: "json_object" },
          });

          const content = response.choices[0]?.message?.content;
          if (!content) return review;

          const refined = JSON.parse(content) as Partial<AgentReview>;
          const newScore = typeof refined.score === "number" ? Math.min(10, Math.max(1, Number(refined.score.toFixed(1)))) : review.score;
          const delta = Number((newScore - review.score).toFixed(1));

          if (delta !== 0) {
            console.log(`[Committee] ${review.agent}: adjusted ${review.score} → ${newScore} (${delta > 0 ? "+" : ""}${delta}) after cross-agent review`);
          }

          const validStances = ["strong", "promising", "unsure", "skeptical", "weak"];
          const newStance = validStances.includes(refined.stance as string) ? refined.stance : review.stance;
          const newConfidence = typeof refined.confidence === "number" ? Math.round(refined.confidence) : review.confidence;

          return agentReviewSchema.parse({
            ...review,
            score: newScore,
            stance: newStance,
            strengths: Array.isArray(refined.strengths) && refined.strengths.length ? refined.strengths.slice(0, 2) : review.strengths,
            top_objections: Array.isArray(refined.top_objections) && refined.top_objections.length ? refined.top_objections.slice(0, 3) : review.top_objections,
            confidence: newConfidence,
          });
        } catch (error) {
          console.error(`[Committee] Refinement failed for ${review.agent}, keeping original:`, error instanceof Error ? error.message : String(error));
          return review;
        }
      }),
    );
    }

    return agenticFirstReviewSchema.parse({
      language,
      direction,
      mode,
      projectBrief,
      reviews: finalReviews,
      research,
      answeredQuestions,
      agenticMode: true,
    });
  }

  // Non-agentic fallback (mock mode or no search API key)
  const reviews = await Promise.all(
    selectedAgents.map(async (agent) => {
      if (parsed.useMock) return mockReviewForAgent(projectBrief, agent, language);
      return await generateAgentReviewWithLLM(projectBrief, agent, language);
    }),
  );

  return agenticFirstReviewSchema.parse({
    language,
    direction,
    mode,
    projectBrief,
    reviews,
    research: [],
    answeredQuestions: [],
    agenticMode: false,
  });
}
