import { z } from "zod";

export const languageSchema = z.enum(["en", "ar"]);
export type Language = z.infer<typeof languageSchema>;

export const directionSchema = z.enum(["ltr", "rtl"]);
export type Direction = z.infer<typeof directionSchema>;

export const marketTypeSchema = z.enum(["B2B", "B2C", "B2G", "unknown"]);
export const stanceSchema = z.enum(["strong", "promising", "unsure", "skeptical", "weak"]);
export const rebuttalQualitySchema = z.enum(["weak", "partial", "strong"]);
export const verdictSchema = z.enum(["strong", "promising", "needs_work", "risky", "weak"]);

export const agentKeys = [
  "customer",
  "investor",
  "financial",
  "legal",
  "technical",
  "operator",
  "marketing",
] as const;

export const agentKeySchema = z.enum(agentKeys);

export type AgentKey = z.infer<typeof agentKeySchema>;
export type Stance = z.infer<typeof stanceSchema>;
export type RebuttalQuality = z.infer<typeof rebuttalQualitySchema>;
export type Verdict = z.infer<typeof verdictSchema>;

export const dynamicSectionSchema = z.object({
  title: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(1200),
});

export const structuredFounderInputSchema = z.object({
  projectName: z.string().trim().max(120).optional().default(""),
  idea: z.string().trim().max(2400).optional().default(""),
  problem: z.string().trim().max(2400).optional().default(""),
  solution: z.string().trim().max(2400).optional().default(""),
  additionalInfo: z.string().trim().max(2400).optional().default(""),
  sections: z.array(dynamicSectionSchema).default([]),
});
export type StructuredFounderInput = z.infer<typeof structuredFounderInputSchema>;

export const startReviewInputSchema = z.object({
  language: languageSchema.optional(),
  freeText: z.string().trim().max(8000).optional().default(""),
  structured: structuredFounderInputSchema.optional(),
  transcriptText: z.string().trim().max(6000).optional().default(""),
  pdfText: z.string().trim().max(12000).optional().default(""),
  extraFragments: z.array(z.string().trim().max(2000)).default([]),
  selectedAgents: z.array(agentKeySchema).min(1).max(agentKeys.length).optional().default([...agentKeys]),
  useMock: z.boolean().default(false),
});
export type StartReviewInput = z.infer<typeof startReviewInputSchema>;

export const projectBriefSchema = z.object({
  project_name: z.string().trim().min(1).max(120),
  one_line_summary: z.string().trim().min(1).max(240),
  problem: z.string().trim().min(1).max(700),
  solution: z.string().trim().min(1).max(700),
  target_customer: z.string().trim().min(1).max(300),
  customer_pain: z.string().trim().min(1).max(300),
  business_model: z.string().trim().min(1).max(240),
  market_type: marketTypeSchema,
  industry: z.string().trim().min(1).max(160),
  differentiation: z.string().trim().min(1).max(320),
  distribution_strategy: z.string().trim().min(1).max(240),
  evidence_or_traction: z.string().trim().min(1).max(280),
  key_assumptions: z.array(z.string().trim().min(1).max(180)).max(4),
  known_risks: z.array(z.string().trim().min(1).max(180)).max(4),
  unknowns: z.array(z.string().trim().min(1).max(180)).max(4),
});
export type ProjectBrief = z.infer<typeof projectBriefSchema>;

export const agentReviewSchema = z.object({
  agent: agentKeySchema,
  label: z.string().trim().min(1).max(40),
  score: z.number().min(0).max(10),
  confidence: z.number().int().min(0).max(100),
  stance: stanceSchema,
  key_insight: z.string().trim().min(1).max(180),
  top_objections: z.array(z.string().trim().min(1).max(180)).max(3),
  strengths: z.array(z.string().trim().min(1).max(140)).max(2),
  summary: z.string().trim().min(1).max(220),
});
export type AgentReview = z.infer<typeof agentReviewSchema>;

export const agentOrder: AgentKey[] = [...agentKeys];

export function normalizeSelectedAgents(input?: AgentKey[] | null): AgentKey[] {
  const requested = Array.isArray(input) ? input : agentOrder;
  const unique = new Set<AgentKey>(requested);
  const ordered = agentOrder.filter(agent => unique.has(agent));
  return ordered.length > 0 ? ordered : [...agentOrder];
}

export const firstReviewSchema = z.object({
  language: languageSchema,
  direction: directionSchema,
  mode: z.enum(["live", "mock"]),
  projectBrief: projectBriefSchema,
  reviews: z.array(agentReviewSchema).min(1).max(agentOrder.length),
});
export type FirstReview = z.infer<typeof firstReviewSchema>;

export const linkedRebuttalItemSchema = z.object({
  agent: agentKeySchema,
  objection: z.string().trim().min(1).max(180),
  response: z.string().trim().min(1).max(300),
});
export type LinkedRebuttalItem = z.infer<typeof linkedRebuttalItemSchema>;

export const structuredRebuttalGroupSchema = z.object({
  objection: z.string().trim().min(1).max(180),
  response: z.string().trim().min(1).max(300),
});
export type StructuredRebuttalGroup = z.infer<typeof structuredRebuttalGroupSchema>;

const structuredRebuttalShape = {
  customer: z.array(structuredRebuttalGroupSchema).default([]),
  investor: z.array(structuredRebuttalGroupSchema).default([]),
  financial: z.array(structuredRebuttalGroupSchema).default([]),
  legal: z.array(structuredRebuttalGroupSchema).default([]),
  technical: z.array(structuredRebuttalGroupSchema).default([]),
  operator: z.array(structuredRebuttalGroupSchema).default([]),
  marketing: z.array(structuredRebuttalGroupSchema).default([]),
};

export const rebuttalInputSchema = z.object({
  freeText: z.string().trim().max(4000).optional().default(""),
  structured: z.object(structuredRebuttalShape).optional(),
});
export type RebuttalInput = z.infer<typeof rebuttalInputSchema>;

export const reevaluationSchema = z.object({
  agent: agentKeySchema,
  label: z.string().trim().min(1).max(40),
  updated_score: z.number().min(0).max(10),
  score_delta: z.number().min(-10).max(10),
  updated_stance: stanceSchema,
  rebuttal_quality: rebuttalQualitySchema,
  key_insight: z.string().trim().min(1).max(180),
  what_changed: z.string().trim().min(1).max(180),
  remaining_concerns: z.array(z.string().trim().min(1).max(180)).max(3),
});
export type Reevaluation = z.infer<typeof reevaluationSchema>;

export const comparisonRowSchema = z.object({
  agent: agentKeySchema,
  label: z.string().trim().min(1).max(40),
  score_before: z.number().min(0).max(10),
  score_after: z.number().min(0).max(10),
  score_delta: z.number().min(-10).max(10),
  stance_before: stanceSchema,
  stance_after: stanceSchema,
  improved: z.boolean(),
});
export type ComparisonRow = z.infer<typeof comparisonRowSchema>;

export const finalVerdictSchema = z.object({
  final_score: z.number().min(0).max(10),
  confidence: z.number().int().min(0).max(100),
  verdict: verdictSchema,
  biggest_risk: z.string().trim().min(1).max(180),
  biggest_strength: z.string().trim().min(1).max(180),
  what_improved_after_rebuttal: z.array(z.string().trim().min(1).max(180)).max(3),
  what_still_feels_unproven: z.array(z.string().trim().min(1).max(180)).max(3),
  committee_summary: z.string().trim().min(1).max(240),
  actionable_tips: z.array(z.string().trim().min(1).max(180)).length(3),
});
export type FinalVerdict = z.infer<typeof finalVerdictSchema>;

export const reevaluateInputSchema = z.object({
  language: languageSchema,
  direction: directionSchema,
  mode: z.enum(["live", "mock"]),
  projectBrief: projectBriefSchema,
  reviews: z.array(agentReviewSchema).min(1).max(agentOrder.length),
  rebuttal: rebuttalInputSchema,
});
export type ReevaluateInput = z.infer<typeof reevaluateInputSchema>;

export const reevaluateResultSchema = z.object({
  language: languageSchema,
  direction: directionSchema,
  mode: z.enum(["live", "mock"]),
  linked_rebuttal: z.array(linkedRebuttalItemSchema),
  second_round: z.array(reevaluationSchema).min(1).max(agentOrder.length),
  comparison: z.array(comparisonRowSchema).min(1).max(agentOrder.length),
  final_verdict: finalVerdictSchema,
});
export type ReevaluateResult = z.infer<typeof reevaluateResultSchema>;

export const demoCaseSchema = z.object({
  title: z.string(),
  input: startReviewInputSchema,
  rebuttal: rebuttalInputSchema,
});
export type DemoCase = z.infer<typeof demoCaseSchema>;

export const agentLabels: Record<Language, Record<AgentKey, string>> = {
  en: {
    customer: "Customer Agent",
    investor: "Investor Agent",
    financial: "Financial Agent",
    legal: "Legal Agent",
    technical: "Tech Agent",
    operator: "Operator Agent",
    marketing: "Marketing Agent",
  },
  ar: {
    customer: "وكيل العميل",
    investor: "وكيل المستثمر",
    financial: "الوكيل المالي",
    legal: "الوكيل القانوني",
    technical: "الوكيل التقني",
    operator: "الوكيل التشغيلي",
    marketing: "الوكيل التسويقي",
  },
};

export const stanceLabels: Record<Language, Record<Stance, string>> = {
  en: {
    strong: "Strong",
    promising: "Promising",
    unsure: "Unsure",
    skeptical: "Skeptical",
    weak: "Weak",
  },
  ar: {
    strong: "قوي",
    promising: "واعد",
    unsure: "غير محسوم",
    skeptical: "متشكك",
    weak: "ضعيف",
  },
};

export const verdictLabels: Record<Language, Record<Verdict, string>> = {
  en: {
    strong: "Strong",
    promising: "Promising",
    needs_work: "Needs work",
    risky: "Risky",
    weak: "Weak",
  },
  ar: {
    strong: "قوي",
    promising: "واعد",
    needs_work: "يحتاج عملًا",
    risky: "محفوف بالمخاطر",
    weak: "ضعيف",
  },
};

export const rebuttalQualityLabels: Record<Language, Record<RebuttalQuality, string>> = {
  en: {
    weak: "Weak",
    partial: "Partial",
    strong: "Strong",
  },
  ar: {
    weak: "ضعيف",
    partial: "جزئي",
    strong: "قوي",
  },
};

export const defaultStructuredInput: StructuredFounderInput = {
  projectName: "",
  idea: "",
  problem: "",
  solution: "",
  additionalInfo: "",
  sections: [],
};

export const defaultStructuredRebuttal: Record<AgentKey, StructuredRebuttalGroup[]> = {
  customer: [],
  investor: [],
  financial: [],
  legal: [],
  technical: [],
  operator: [],
  marketing: [],
};

// ─── Agentic Features ─────────────────────────────────────────────

/** A question generated by an agent about the project brief */
export const agentQuestionSchema = z.object({
  agent: agentKeySchema,
  label: z.string().trim().min(1).max(40),
  question: z.string().trim().min(1).max(300),
  reason: z.string().trim().max(200).optional().default(""),
});
export type AgentQuestion = z.infer<typeof agentQuestionSchema>;

/** A founder's answer to an agent question */
export const answeredQuestionSchema = z.object({
  agent: agentKeySchema,
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().max(1000).optional().default(""),
});
export type AnsweredQuestion = z.infer<typeof answeredQuestionSchema>;

/** Input for the question generation step */
export const generateQuestionsInputSchema = z.object({
  language: languageSchema,
  projectBrief: projectBriefSchema,
  selectedAgents: z.array(agentKeySchema).min(1).max(agentKeys.length).optional().default([...agentKeys]),
});
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsInputSchema>;

/** Result of the question generation step */
export const questionsResultSchema = z.object({
  language: languageSchema,
  questions: z.array(agentQuestionSchema),
});
export type QuestionsResult = z.infer<typeof questionsResultSchema>;

/** Web search result used in research */
export const searchResultItemSchema = z.object({
  query: z.string(),
  title: z.string(),
  snippet: z.string(),
  url: z.string(),
});
export type SearchResultItem = z.infer<typeof searchResultItemSchema>;

/** Research data collected by an agent */
export const agentResearchSchema = z.object({
  agent: agentKeySchema,
  searches: z.array(z.string()),
  findings: z.array(searchResultItemSchema),
});
export type AgentResearch = z.infer<typeof agentResearchSchema>;

/** Extended start review input that includes answered questions */
export const agenticReviewInputSchema = startReviewInputSchema.extend({
  answeredQuestions: z.array(answeredQuestionSchema).optional().default([]),
});
export type AgenticReviewInput = z.infer<typeof agenticReviewInputSchema>;

/** Extended first review result that includes research metadata */
export const agenticFirstReviewSchema = firstReviewSchema.extend({
  research: z.array(agentResearchSchema).optional().default([]),
  answeredQuestions: z.array(answeredQuestionSchema).optional().default([]),
  agenticMode: z.boolean().optional().default(false),
});
export type AgenticFirstReview = z.infer<typeof agenticFirstReviewSchema>;
