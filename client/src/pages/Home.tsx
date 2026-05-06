import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BriefcaseBusiness,
  Cpu,
  FileText,
  Gavel,
  Languages,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import {
  agentLabels,
  rebuttalQualityLabels,
  stanceLabels,
  verdictLabels,
  type AgentKey,
  type AgentReview,
  type ComparisonRow,
  type FirstReview,
  type Language,
  type LinkedRebuttalItem,
  type ReevaluateResult,
  type StructuredFounderInput,
} from "@shared/rejectMeFirst";

type InputMode = "free" | "structured";
type RebuttalMode = "free" | "structured";

type UiCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  liveMode: string;
  mockMode: string;
  loadDemo: string;
  reset: string;
  startReview: string;
  rerun: string;
  projectInput: string;
  freeText: string;
  structured: string;
  sourceMaterial: string;
  transcript: string;
  pdfText: string;
  freeTextPlaceholder: string;
  projectName: string;
  idea: string;
  problem: string;
  solution: string;
  additionalInfo: string;
  dynamicSections: string;
  sectionTitle: string;
  sectionContent: string;
  addSection: string;
  briefReady: string;
  firstReview: string;
  rebuttal: string;
  finalVerdict: string;
  founderRebuttal: string;
  submitRebuttal: string;
  rebuttalFreePlaceholder: string;
  beforeAfter: string;
  scoreBefore: string;
  scoreAfter: string;
  scoreDelta: string;
  stanceBefore: string;
  stanceAfter: string;
  improved: string;
  keyInsight: string;
  strengths: string;
  objections: string;
  summary: string;
  score: string;
  confidence: string;
  stance: string;
  quality: string;
  whatChanged: string;
  remainingConcerns: string;
  linkedResponses: string;
  strongestPoint: string;
  biggestRisk: string;
  improvements: string;
  stillUnproven: string;
  actionSteps: string;
  committeeSummary: string;
  noDataYet: string;
  modeLabel: string;
  systemBrief: string;
  targetCustomer: string;
  businessModel: string;
  evidence: string;
  differentiation: string;
  languageMatch: string;
  investor: string;
  customer: string;
  technical: string;
};
const committeeAgents = Object.keys(agentLabels.en) as AgentKey[];

const createEmptyStructuredRebuttal = (): Record<AgentKey, { objection: string; response: string }[]> =>
  Object.fromEntries(committeeAgents.map(agent => [agent, []])) as unknown as Record<
    AgentKey,
    { objection: string; response: string }[]
  >;

const copy: Record<Language, UiCopy> = { en: {
    eyebrow: "Reject Me First",
    title: "A realistic investment and technical committee simulation",
    subtitle:
      "Convert founder input into one clean Project Brief, run three concise committee reviews, answer objections, then compare how the verdict changes after rebuttal.",
    liveMode: "Live committee",
    mockMode: "Mock committee",
    loadDemo: "Load demo case",
    reset: "Reset",
    startReview: "Start first review",
    rerun: "Run again",
    projectInput: "Founder input",
    freeText: "Free text",
    structured: "Structured input",
    sourceMaterial: "Supporting source material",
    transcript: "Voice transcript",
    pdfText: "PDF extracted text",
    freeTextPlaceholder:
      "Paste the startup idea, notes, messy founder draft, or mixed fragments. The system will structure it into one clean Project Brief.",
    projectName: "Project name",
    idea: "Idea",
    problem: "Problem",
    solution: "Solution",
    additionalInfo: "Additional info",
    dynamicSections: "Dynamic sections",
    sectionTitle: "Section title",
    sectionContent: "Section content",
    addSection: "Add section",
    briefReady: "Project Brief",
    firstReview: "First review",
    rebuttal: "Rebuttal",
    finalVerdict: "Final verdict",
    founderRebuttal: "Founder rebuttal",
    submitRebuttal: "Submit rebuttal",
    rebuttalFreePlaceholder:
      "Respond to the strongest objections in plain language. The system will link responses to committee concerns.",
    beforeAfter: "Before vs After",
    scoreBefore: "Before",
    scoreAfter: "After",
    scoreDelta: "Delta",
    stanceBefore: "Stance before",
    stanceAfter: "Stance after",
    improved: "Improved",
    keyInsight: "Key insight",
    strengths: "Strengths",
    objections: "Top objections",
    summary: "Summary",
    score: "Score",
    confidence: "Confidence",
    stance: "Stance",
    quality: "Rebuttal quality",
    whatChanged: "What changed",
    remainingConcerns: "Remaining concerns",
    linkedResponses: "Linked responses",
    strongestPoint: "Biggest strength",
    biggestRisk: "Biggest risk",
    improvements: "What improved after rebuttal",
    stillUnproven: "What still feels unproven",
    actionSteps: "Actionable next steps",
    committeeSummary: "Committee summary",
    noDataYet: "No committee output yet.",
    modeLabel: "Mode",
    systemBrief: "System brief",
    targetCustomer: "Target customer",
    businessModel: "Business model",
    evidence: "Evidence or traction",
    differentiation: "Differentiation",
    languageMatch: "Output matches detected input language.",
    investor: "Investor Agent",
    customer: "Customer Agent",
    technical: "Technical Agent",
  },
  ar: {
    eyebrow: "Reject Me First",
    title: "محاكاة واقعية للجنة استثمارية وتقنية",
    subtitle:
      "حوّل مدخلات المؤسس إلى Project Brief واحد وواضح، ثم شغّل ثلاث مراجعات مختصرة، وقدّم الردود، وقارن كيف تغيّر الحكم بعد الـ rebuttal.",
    liveMode: "لجنة حيّة",
    mockMode: "لجنة تجريبية",
    loadDemo: "تحميل حالة تجريبية",
    reset: "إعادة ضبط",
    startReview: "ابدأ المراجعة الأولى",
    rerun: "أعد التشغيل",
    projectInput: "مدخلات المؤسس",
    freeText: "نص حر",
    structured: "إدخال منظم",
    sourceMaterial: "مواد داعمة",
    transcript: "نص تفريغ صوتي",
    pdfText: "نص مستخرج من PDF",
    freeTextPlaceholder:
      "الصق فكرة المشروع أو ملاحظات المؤسس أو مسودة غير مرتبة أو خليطًا من المقاطع، وسيتم تحويلها إلى Project Brief نظيف.",
    projectName: "اسم المشروع",
    idea: "الفكرة",
    problem: "المشكلة",
    solution: "الحل",
    additionalInfo: "معلومات إضافية",
    dynamicSections: "أقسام ديناميكية",
    sectionTitle: "عنوان القسم",
    sectionContent: "محتوى القسم",
    addSection: "إضافة قسم",
    briefReady: "Project Brief",
    firstReview: "المراجعة الأولى",
    rebuttal: "الرد",
    finalVerdict: "الحكم النهائي",
    founderRebuttal: "رد المؤسس",
    submitRebuttal: "إرسال الرد",
    rebuttalFreePlaceholder:
      "رد على أقوى الاعتراضات بصياغة مباشرة، وسيقوم النظام بربط الردود بمخاوف اللجنة.",
    beforeAfter: "قبل / بعد",
    scoreBefore: "قبل",
    scoreAfter: "بعد",
    scoreDelta: "التغير",
    stanceBefore: "الموقف قبل",
    stanceAfter: "الموقف بعد",
    improved: "تحسن",
    keyInsight: "الخلاصة الأهم",
    strengths: "نقاط القوة",
    objections: "أهم الاعتراضات",
    summary: "الملخص",
    score: "الدرجة",
    confidence: "الثقة",
    stance: "الموقف",
    quality: "جودة الرد",
    whatChanged: "ما الذي تغيّر",
    remainingConcerns: "المخاوف المتبقية",
    linkedResponses: "الردود المرتبطة",
    strongestPoint: "أقوى نقطة",
    biggestRisk: "أكبر مخاطرة",
    improvements: "ما الذي تحسن بعد الرد",
    stillUnproven: "ما الذي ما يزال غير مثبت",
    actionSteps: "الخطوات المقترحة",
    committeeSummary: "ملخص اللجنة",
    noDataYet: "لا توجد مخرجات بعد.",
    modeLabel: "الوضع",
    systemBrief: "ملخص النظام",
    targetCustomer: "العميل المستهدف",
    businessModel: "نموذج العمل",
    evidence: "الإثبات أو المؤشرات",
    differentiation: "التميّز",
    languageMatch: "المخرجات تتبع اللغة المكتشفة من المدخلات.",
    investor: "وكيل المستثمر",
    customer: "وكيل العميل",
    technical: "الوكيل التقني",
  },
};

const agentIcons: Record<AgentKey, typeof BriefcaseBusiness> = {
  investor: BriefcaseBusiness,
  customer: Users,
  financial: BriefcaseBusiness,
  legal: Gavel,
  technical: Cpu,
  operator: Target,
  marketing: Sparkles,
};

const initialStructured = (): StructuredFounderInput => ({
  projectName: "",
  idea: "",
  problem: "",
  solution: "",
  additionalInfo: "",
  sections: [],
});

const demoInput = (): StructuredFounderInput => ({
  projectName: "BriefBridge",
  idea: "An AI meeting assistant that turns notes, recordings, and meeting fragments into summaries, owners, and follow-up drafts for small teams.",
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
});

function detectInputLanguage(text: string): Language {
  return /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
}

function getCombinedText(freeText: string, structured: StructuredFounderInput, transcriptText: string, pdfText: string) {
  return [
    freeText,
    structured.projectName,
    structured.idea,
    structured.problem,
    structured.solution,
    structured.additionalInfo,
    transcriptText,
    pdfText,
    ...structured.sections.flatMap(section => [section.title, section.content]),
  ]
    .join(" ")
    .trim();
}

function scoreText(value: number) {
  return value.toFixed(1);
}

function scoreDeltaText(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function badgeTone(agent: AgentKey) {
  if (agent === "investor") return "bg-amber-500/15 text-amber-200 border-amber-400/30";
  if (agent === "customer") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
  return "bg-sky-500/15 text-sky-200 border-sky-400/30";
}

function comparisonTone(improved: boolean) {
  return improved ? "text-emerald-300" : "text-stone-300";
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="space-y-3">
      <Badge className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] tracking-[0.3em] uppercase text-stone-200">
        {eyebrow}
      </Badge>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-stone-300 md:text-base">{description}</p>
      </div>
    </div>
  );
}

function BriefField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{label}</p>
      <p className="text-sm leading-6 text-stone-100">{value}</p>
    </div>
  );
}

function AgentCard({ review, language }: { review: AgentReview; language: Language }) {
  const Icon = agentIcons[review.agent];
  const text = copy[language];
  return (
    <details className="group rounded-[28px] border border-white/10 bg-[#111111]/85 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]" open>
      <summary className="list-none cursor-pointer">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-stone-100">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-50">{review.label}</p>
                <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{text.keyInsight}</p>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-stone-200">{review.key_insight}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center md:min-w-[260px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{text.score}</p>
              <p className="mt-1 text-xl font-semibold text-stone-50">{scoreText(review.score)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{text.confidence}</p>
              <p className="mt-1 text-xl font-semibold text-stone-50">{review.confidence}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{text.stance}</p>
              <p className="mt-1 text-sm font-semibold text-stone-50">{stanceLabels[language][review.stance]}</p>
            </div>
          </div>
        </div>
      </summary>
      <div className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{text.strengths}</p>
          <ul className="space-y-2 text-sm leading-7 text-stone-200">
            {review.strengths.map(item => (
              <li key={item} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{text.objections}</p>
          <ul className="space-y-2 text-sm leading-7 text-stone-200">
            {review.top_objections.map(item => (
              <li key={item} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{text.summary}</p>
        <p className="mt-2 text-sm leading-7 text-stone-200">{review.summary}</p>
      </div>
    </details>
  );
}

function ReReviewCard({
  item,
  language,
}: {
  item: ReevaluateResult["second_round"][number];
  language: Language;
}) {
  const text = copy[language];
  return (
    <Card className="border-white/10 bg-[#121212]/90 text-stone-100 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-stone-50">{item.label}</CardTitle>
            <CardDescription className="text-stone-400">{item.key_insight}</CardDescription>
          </div>
          <Badge className={badgeTone(item.agent)}>{rebuttalQualityLabels[language][item.rebuttal_quality]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{text.score}</p>
            <p className="mt-1 text-xl font-semibold text-stone-50">{scoreText(item.updated_score)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{text.scoreDelta}</p>
            <p className="mt-1 text-xl font-semibold text-emerald-300">{scoreDeltaText(item.score_delta)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{text.stance}</p>
            <p className="mt-1 text-sm font-semibold text-stone-50">{stanceLabels[language][item.updated_stance]}</p>
          </div>
        </div>
        <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{text.whatChanged}</p>
          <p className="text-sm leading-7 text-stone-200">{item.what_changed}</p>
        </div>
        <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{text.remainingConcerns}</p>
          <ul className="space-y-2 text-sm leading-7 text-stone-200">
            {item.remaining_concerns.map(concern => (
              <li key={concern} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                {concern}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("free");
  const [rebuttalMode, setRebuttalMode] = useState<RebuttalMode>("free");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>("en");
  const [useMock, setUseMock] = useState(true);
  const [freeText, setFreeText] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [structured, setStructured] = useState<StructuredFounderInput>(initialStructured());
  const [structuredRebuttal, setStructuredRebuttal] = useState<Record<AgentKey, { objection: string; response: string }[]>>(
    createEmptyStructuredRebuttal(),
  );
  const [freeRebuttal, setFreeRebuttal] = useState("");
  const [firstRound, setFirstRound] = useState<FirstReview | null>(null);
  const [rebuttalResult, setRebuttalResult] = useState<ReevaluateResult | null>(null);

  const startReviewMutation = trpc.committee.startReview.useMutation();
  const rebuttalMutation = trpc.committee.submitRebuttal.useMutation();

  const detectedLanguage = useMemo(
    () => detectInputLanguage(getCombinedText(freeText, structured, transcriptText, pdfText) || preferredLanguage),
    [freeText, structured, transcriptText, pdfText, preferredLanguage],
  );

  const activeLanguage = rebuttalResult?.language ?? firstRound?.language ?? detectedLanguage;
  const activeCopy = copy[activeLanguage];
  const direction = activeLanguage === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = activeLanguage;
    document.documentElement.dir = direction;
  }, [activeLanguage, direction]);

  useEffect(() => {
    if (!firstRound) return;
    setStructuredRebuttal(
      Object.fromEntries(
        committeeAgents.map(agent => [
          agent,
          firstRound.reviews
            .find(review => review.agent === agent)
            ?.top_objections.map(objection => ({ objection, response: "" })) ?? [],
        ]),
      ) as Record<AgentKey, { objection: string; response: string }[]>,
    );
  }, [firstRound]);

  function resetAll() {
    setInputMode("free");
    setRebuttalMode("free");
    setUseMock(true);
    setFreeText("");
    setTranscriptText("");
    setPdfText("");
    setStructured(initialStructured());
    setStructuredRebuttal(createEmptyStructuredRebuttal());
    setFreeRebuttal("");
    setFirstRound(null);
    setRebuttalResult(null);
  }

  function loadDemo() {
    setUseMock(true);
    setInputMode("structured");
    setPreferredLanguage("en");
    setFreeText("");
    setTranscriptText("");
    setPdfText("");
    setStructured(demoInput());
    setFreeRebuttal(
      "We already have five pilot teams using the workflow weekly, and the first buyers are agencies with many client meetings. The MVP stays intentionally narrow around summaries, action items, and workspace sync.",
    );
    setRebuttalMode("free");
    setFirstRound(null);
    setRebuttalResult(null);
  }

  function updateStructuredField(field: keyof StructuredFounderInput, value: string) {
    setStructured(current => ({ ...current, [field]: value }));
  }

  function addSection() {
    setStructured(current => ({
      ...current,
      sections: [...current.sections, { title: "", content: "" }],
    }));
  }

  function updateSection(index: number, field: "title" | "content", value: string) {
    setStructured(current => ({
      ...current,
      sections: current.sections.map((section, itemIndex) =>
        itemIndex === index ? { ...section, [field]: value } : section,
      ),
    }));
  }

  function removeSection(index: number) {
    setStructured(current => ({
      ...current,
      sections: current.sections.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleStartReview() {
    const result = await startReviewMutation.mutateAsync({
      language: preferredLanguage,
      freeText,
      structured,
      transcriptText,
      pdfText,
      extraFragments: [],
      useMock,
    });
    setFirstRound(result);
    setRebuttalResult(null);
  }

  async function handleSubmitRebuttal() {
    if (!firstRound) return;
    const rebuttal =
      rebuttalMode === "free"
        ? { freeText: freeRebuttal }
        : {
            freeText: "",
            structured: Object.fromEntries(
              committeeAgents.map(agent => [agent, structuredRebuttal[agent].filter(item => item.response.trim())]),
            ) as Record<AgentKey, { objection: string; response: string }[]>,
          };

    const result = await rebuttalMutation.mutateAsync({
      language: firstRound.language,
      direction: firstRound.direction,
      mode: firstRound.mode,
      projectBrief: firstRound.projectBrief,
      reviews: firstRound.reviews,
      rebuttal,
    });
    setRebuttalResult(result);
  }

  const comparisonRows = rebuttalResult?.comparison ?? [];
  const linkedRebuttal = rebuttalResult?.linked_rebuttal ?? [];

  return (
    <div className="min-h-screen bg-[#090909] text-stone-100">
      <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(214,187,122,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(91,141,239,0.16),_transparent_30%),linear-gradient(180deg,_#121212_0%,_#090909_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:34px_34px] opacity-20" />
        <div className="container relative py-10 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="space-y-6">
              <Badge className="rounded-full border border-[#d5c09a]/30 bg-[#d5c09a]/10 px-3 py-1 text-[11px] tracking-[0.32em] uppercase text-[#ead7b3]">
                {activeCopy.eyebrow}
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-stone-50 md:text-6xl">
                  {activeCopy.title}
                </h1>
                <p className="max-w-3xl text-base leading-8 text-stone-300 md:text-lg">{activeCopy.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-stone-300">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{activeCopy.languageMatch}</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{activeCopy.customer}</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{activeCopy.investor}</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{activeCopy.technical}</div>
              </div>
            </div>
            <Card className="border-white/10 bg-black/35 text-stone-100 shadow-[0_32px_100px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-stone-50">
                  <Gavel className="h-5 w-5 text-[#d5c09a]" />
                  {activeCopy.systemBrief}
                </CardTitle>
                <CardDescription className="text-stone-400">
                  {firstRound
                    ? `${activeCopy.score}: ${scoreText(firstRound.reviews.reduce((sum, item) => sum + item.score, 0) / firstRound.reviews.length)}`
                    : activeCopy.noDataYet}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.modeLabel}</p>
                    <p className="mt-2 text-base font-semibold text-stone-50">{useMock ? activeCopy.mockMode : activeCopy.liveMode}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">Direction</p>
                    <p className="mt-2 text-base font-semibold text-stone-50">{direction.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => setPreferredLanguage("en")}
                    variant={preferredLanguage === "en" ? "default" : "outline"}
                    className="rounded-full"
                  >
                    EN
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setPreferredLanguage("ar")}
                    variant={preferredLanguage === "ar" ? "default" : "outline"}
                    className="rounded-full"
                  >
                    AR
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setUseMock(current => !current)}
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/5 text-stone-100 hover:bg-white/10"
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    {useMock ? activeCopy.mockMode : activeCopy.liveMode}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <main className="container space-y-16 py-10 md:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="border-white/10 bg-[#0f0f0f] text-stone-100 shadow-[0_26px_90px_rgba(0,0,0,0.38)]">
            <CardHeader className="space-y-5">
              <SectionHeader
                eyebrow={activeCopy.projectInput}
                title={activeCopy.projectInput}
                description={activeCopy.subtitle}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setInputMode("free")} variant={inputMode === "free" ? "default" : "outline"} className="rounded-full">
                  {activeCopy.freeText}
                </Button>
                <Button type="button" onClick={() => setInputMode("structured")} variant={inputMode === "structured" ? "default" : "outline"} className="rounded-full">
                  {activeCopy.structured}
                </Button>
                <Button type="button" variant="outline" className="rounded-full border-white/15 bg-white/5 text-stone-100 hover:bg-white/10" onClick={loadDemo}>
                  {activeCopy.loadDemo}
                </Button>
                <Button type="button" variant="outline" className="rounded-full border-white/15 bg-white/5 text-stone-100 hover:bg-white/10" onClick={resetAll}>
                  {activeCopy.reset}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {inputMode === "free" ? (
                <Textarea
                  value={freeText}
                  onChange={event => setFreeText(event.target.value)}
                  placeholder={activeCopy.freeTextPlaceholder}
                  className="min-h-[220px] rounded-[26px] border-white/10 bg-black/20 px-5 py-4 text-base leading-7 text-stone-100 placeholder:text-stone-500"
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input value={structured.projectName} onChange={event => updateStructuredField("projectName", event.target.value)} placeholder={activeCopy.projectName} className="h-12 rounded-2xl border-white/10 bg-black/20" />
                    <Input value={structured.additionalInfo} onChange={event => updateStructuredField("additionalInfo", event.target.value)} placeholder={activeCopy.additionalInfo} className="h-12 rounded-2xl border-white/10 bg-black/20" />
                  </div>
                  <Textarea value={structured.idea} onChange={event => updateStructuredField("idea", event.target.value)} placeholder={activeCopy.idea} className="min-h-[120px] rounded-[24px] border-white/10 bg-black/20" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Textarea value={structured.problem} onChange={event => updateStructuredField("problem", event.target.value)} placeholder={activeCopy.problem} className="min-h-[140px] rounded-[24px] border-white/10 bg-black/20" />
                    <Textarea value={structured.solution} onChange={event => updateStructuredField("solution", event.target.value)} placeholder={activeCopy.solution} className="min-h-[140px] rounded-[24px] border-white/10 bg-black/20" />
                  </div>
                  <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-100">{activeCopy.dynamicSections}</p>
                        <p className="text-sm text-stone-400">Add traction, pricing, GTM, market, or any custom block.</p>
                      </div>
                      <Button type="button" variant="outline" className="rounded-full border-white/15 bg-white/5 text-stone-100 hover:bg-white/10" onClick={addSection}>
                        <Plus className="mr-2 h-4 w-4" />
                        {activeCopy.addSection}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {structured.sections.map((section, index) => (
                        <div key={`${section.title}-${index}`} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                          <div className="mb-3 flex justify-end">
                            <Button type="button" variant="outline" className="rounded-full border-white/15 bg-transparent text-stone-200 hover:bg-white/10" onClick={() => removeSection(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            <Input value={section.title} onChange={event => updateSection(index, "title", event.target.value)} placeholder={activeCopy.sectionTitle} className="h-11 rounded-2xl border-white/10 bg-black/20" />
                            <Textarea value={section.content} onChange={event => updateSection(index, "content", event.target.value)} placeholder={activeCopy.sectionContent} className="min-h-[110px] rounded-[24px] border-white/10 bg-black/20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div>
                  <p className="text-sm font-semibold text-stone-100">{activeCopy.sourceMaterial}</p>
                  <p className="text-sm text-stone-400">Optional text sources are merged into the same Project Brief.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Textarea value={transcriptText} onChange={event => setTranscriptText(event.target.value)} placeholder={activeCopy.transcript} className="min-h-[140px] rounded-[24px] border-white/10 bg-white/5" />
                  <Textarea value={pdfText} onChange={event => setPdfText(event.target.value)} placeholder={activeCopy.pdfText} className="min-h-[140px] rounded-[24px] border-white/10 bg-white/5" />
                </div>
              </div>

              <Button onClick={handleStartReview} disabled={startReviewMutation.isPending} className="h-12 rounded-full px-6 text-sm font-semibold">
                {startReviewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {firstRound ? activeCopy.rerun : activeCopy.startReview}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0f0f0f] text-stone-100 shadow-[0_26px_90px_rgba(0,0,0,0.38)]">
            <CardHeader>
              <SectionHeader eyebrow={activeCopy.briefReady} title={activeCopy.briefReady} description="Auto-structured, merged, and kept intentionally concise for committee review." />
            </CardHeader>
            <CardContent>
              {firstRound ? (
                <div className="grid gap-4">
                  <BriefField label={activeCopy.projectName} value={firstRound.projectBrief.project_name} />
                  <BriefField label={activeCopy.idea} value={firstRound.projectBrief.one_line_summary} />
                  <BriefField label={activeCopy.problem} value={firstRound.projectBrief.problem} />
                  <BriefField label={activeCopy.solution} value={firstRound.projectBrief.solution} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <BriefField label={activeCopy.targetCustomer} value={firstRound.projectBrief.target_customer} />
                    <BriefField label={activeCopy.businessModel} value={firstRound.projectBrief.business_model} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <BriefField label={activeCopy.evidence} value={firstRound.projectBrief.evidence_or_traction} />
                    <BriefField label={activeCopy.differentiation} value={firstRound.projectBrief.differentiation} />
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-black/15 p-8 text-sm leading-7 text-stone-400">
                  {activeCopy.noDataYet}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionHeader eyebrow={activeCopy.firstReview} title={activeCopy.firstReview} description="Three independent views, kept short and committee-like rather than conversational." />
          {firstRound ? (
            <div className="space-y-5">
              {firstRound.reviews.map(review => (
                <AgentCard key={review.agent} review={review} language={firstRound.language} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-black/15 p-8 text-sm leading-7 text-stone-400">
              {activeCopy.noDataYet}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-white/10 bg-[#0f0f0f] text-stone-100 shadow-[0_26px_90px_rgba(0,0,0,0.38)]">
            <CardHeader className="space-y-5">
              <SectionHeader eyebrow={activeCopy.rebuttal} title={activeCopy.founderRebuttal} description="Respond in free text or directly against each committee objection." />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setRebuttalMode("free")} variant={rebuttalMode === "free" ? "default" : "outline"} className="rounded-full">
                  {activeCopy.freeText}
                </Button>
                <Button type="button" onClick={() => setRebuttalMode("structured")} variant={rebuttalMode === "structured" ? "default" : "outline"} className="rounded-full">
                  {activeCopy.structured}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {rebuttalMode === "free" ? (
                <Textarea value={freeRebuttal} onChange={event => setFreeRebuttal(event.target.value)} placeholder={activeCopy.rebuttalFreePlaceholder} className="min-h-[220px] rounded-[26px] border-white/10 bg-black/20 px-5 py-4 leading-7 text-stone-100 placeholder:text-stone-500" />
              ) : (
                <div className="space-y-5">
                  {committeeAgents.map(agent => (
                    <div key={agent} className="space-y-3 rounded-[26px] border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-stone-100">{agentLabels[activeLanguage][agent]}</p>
                        <Badge className={badgeTone(agent)}>{agentLabels[activeLanguage][agent]}</Badge>
                      </div>
                      <div className="space-y-3">
                        {structuredRebuttal[agent].map((item, index) => (
                          <div key={`${agent}-${index}`} className="space-y-2 rounded-2xl border border-white/8 bg-white/5 p-3">
                            <p className="text-sm leading-7 text-stone-300">{item.objection}</p>
                            <Textarea
                              value={item.response}
                              onChange={event =>
                                setStructuredRebuttal(current => ({
                                  ...current,
                                  [agent]: current[agent].map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, response: event.target.value } : entry,
                                  ),
                                }))
                              }
                              placeholder={activeCopy.founderRebuttal}
                              className="min-h-[100px] rounded-2xl border-white/10 bg-black/20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleSubmitRebuttal} disabled={!firstRound || rebuttalMutation.isPending} className="h-12 rounded-full px-6 text-sm font-semibold">
                {rebuttalMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                {activeCopy.submitRebuttal}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0f0f0f] text-stone-100 shadow-[0_26px_90px_rgba(0,0,0,0.38)]">
            <CardHeader>
              <SectionHeader eyebrow={activeCopy.linkedResponses} title={activeCopy.linkedResponses} description="Free-form rebuttals are auto-linked. Structured rebuttals preserve exact objection-response pairs." />
            </CardHeader>
            <CardContent>
              {linkedRebuttal.length > 0 ? (
                <div className="space-y-3">
                  {linkedRebuttal.map((item: LinkedRebuttalItem, index: number) => (
                    <div key={`${item.agent}-${index}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Badge className={badgeTone(item.agent)}>{agentLabels[activeLanguage][item.agent]}</Badge>
                      </div>
                      <p className="text-sm font-medium leading-7 text-stone-200">{item.objection}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-300">{item.response}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-black/15 p-8 text-sm leading-7 text-stone-400">
                  {activeCopy.noDataYet}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionHeader eyebrow={activeCopy.beforeAfter} title={activeCopy.beforeAfter} description="Score changes, stance changes, and what actually improved after the rebuttal." />
          {rebuttalResult ? (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0f0f0f] shadow-[0_26px_90px_rgba(0,0,0,0.38)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 text-stone-300">
                      <tr>
                        <th className="px-4 py-4 text-start font-medium">Agent</th>
                        <th className="px-4 py-4 text-start font-medium">{activeCopy.scoreBefore}</th>
                        <th className="px-4 py-4 text-start font-medium">{activeCopy.scoreAfter}</th>
                        <th className="px-4 py-4 text-start font-medium">{activeCopy.scoreDelta}</th>
                        <th className="px-4 py-4 text-start font-medium">{activeCopy.stanceBefore}</th>
                        <th className="px-4 py-4 text-start font-medium">{activeCopy.stanceAfter}</th>
                        <th className="px-4 py-4 text-start font-medium">{activeCopy.improved}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row: ComparisonRow) => (
                        <tr key={row.agent} className="border-t border-white/10 text-stone-100">
                          <td className="px-4 py-4">{row.label}</td>
                          <td className="px-4 py-4">{scoreText(row.score_before)}</td>
                          <td className="px-4 py-4">{scoreText(row.score_after)}</td>
                          <td className={`px-4 py-4 font-semibold ${comparisonTone(row.improved)}`}>{scoreDeltaText(row.score_delta)}</td>
                          <td className="px-4 py-4">{stanceLabels[activeLanguage][row.stance_before]}</td>
                          <td className="px-4 py-4">{stanceLabels[activeLanguage][row.stance_after]}</td>
                          <td className="px-4 py-4">{row.improved ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {rebuttalResult.second_round.map(item => (
                  <ReReviewCard key={item.agent} item={item} language={rebuttalResult.language} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-black/15 p-8 text-sm leading-7 text-stone-400">
              {activeCopy.noDataYet}
            </div>
          )}
        </section>

        <section className="space-y-6 pb-10 md:pb-16">
          <SectionHeader eyebrow={activeCopy.finalVerdict} title={activeCopy.finalVerdict} description="The final judge combines the first round, the rebuttal, and the second round into one realistic recommendation." />
          {rebuttalResult ? (
            <Card className="overflow-hidden border-white/10 bg-[linear-gradient(145deg,_rgba(18,18,18,0.96),_rgba(9,9,9,0.98))] text-stone-100 shadow-[0_32px_110px_rgba(0,0,0,0.45)]">
              <CardContent className="grid gap-6 p-6 md:p-8 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-5 rounded-[28px] border border-[#d5c09a]/18 bg-[linear-gradient(180deg,rgba(213,192,154,0.12),rgba(255,255,255,0.03))] p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-[#d5c09a]/25 bg-[#d5c09a]/10 p-3 text-[#ead7b3]">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-[#ead7b3]/80">Judge</p>
                      <p className="text-2xl font-semibold text-stone-50">{verdictLabels[rebuttalResult.language][rebuttalResult.final_verdict.verdict]}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.score}</p>
                      <p className="mt-2 text-3xl font-semibold text-stone-50">{scoreText(rebuttalResult.final_verdict.final_score)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.confidence}</p>
                      <p className="mt-2 text-3xl font-semibold text-stone-50">{rebuttalResult.final_verdict.confidence}%</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.strongestPoint}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-200">{rebuttalResult.final_verdict.biggest_strength}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.biggestRisk}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-200">{rebuttalResult.final_verdict.biggest_risk}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.committeeSummary}</p>
                    <p className="mt-3 text-base leading-8 text-stone-200">{rebuttalResult.final_verdict.committee_summary}</p>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.improvements}</p>
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-200">
                        {rebuttalResult.final_verdict.what_improved_after_rebuttal.map(item => (
                          <li key={item} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.stillUnproven}</p>
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-200">
                        {rebuttalResult.final_verdict.what_still_feels_unproven.map(item => (
                          <li key={item} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">{activeCopy.actionSteps}</p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-200">
                      {rebuttalResult.final_verdict.actionable_tips.map(item => (
                        <li key={item} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-black/15 p-8 text-sm leading-7 text-stone-400">
              {activeCopy.noDataYet}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
