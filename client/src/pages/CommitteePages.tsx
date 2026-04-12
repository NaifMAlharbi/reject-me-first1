import { CommitteeFlowShell } from "@/components/CommitteeFlowShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCommitteeFlow } from "@/contexts/CommitteeFlowContext";
import { useTheme } from "@/contexts/ThemeContext";
import { committeeStepRoutes, scoreDeltaText, scoreText } from "@/lib/reject-me-first";
import {
  agentLabels,
  rebuttalQualityLabels,
  stanceLabels,
  verdictLabels,
} from "@shared/rejectMeFirst";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileDown,
  FlaskConical,
  FolderOpen,
  Globe2,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useLocation } from "wouter";

const agentIcons = {
  investor: BriefcaseBusiness,
  customer: Users,
  technical: Cpu,
} as const;

function useFlowPage(currentStep: "input" | "review" | "rebuttal" | "verdict") {
  const flow = useCommitteeFlow();
  const [, navigate] = useLocation();
  const pageSteps = committeeStepRoutes[flow.preferredLanguage];

  const statusSlot = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-full border border-border bg-background/90 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => flow.setPreferredLanguage("ar")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            flow.preferredLanguage === "ar"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          العربية
        </button>
        <button
          type="button"
          onClick={() => flow.setPreferredLanguage("en")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            flow.preferredLanguage === "en"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          English
        </button>
      </div>
      <Badge variant="outline" className="border-border bg-background text-foreground">
        {flow.useMock ? <FlaskConical className="me-2 h-3.5 w-3.5" /> : <Sparkles className="me-2 h-3.5 w-3.5" />}
        {flow.useMock ? flow.text.mockMode : flow.text.liveMode}
      </Badge>
    </div>
  );

  return {
    flow,
    navigate,
    pageSteps,
    statusSlot,
    goTo: (href: string) => navigate(href),
    goNext: () => {
      const index = pageSteps.findIndex(step => step.key === currentStep);
      const next = pageSteps[index + 1];
      if (next) navigate(next.href);
    },
    goBack: () => {
      const index = pageSteps.findIndex(step => step.key === currentStep);
      const previous = pageSteps[index - 1];
      if (previous) navigate(previous.href);
    },
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3 text-sm font-medium text-foreground">
        <span>{label}</span>
        {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function inputClassName(multiline = false) {
  return multiline
    ? "min-h-28 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
    : "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
}

function SummaryBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <Card className="gap-3 border-border/70 bg-background/70 py-4 shadow-none">
      <CardContent className="px-5">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-primary">{label}</p>
        <p className="text-sm leading-7 text-foreground/90">{value || "—"}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}

function BulletCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="gap-3 border-border/70 bg-background/70 py-4 shadow-none">
      <CardHeader className="px-6 pb-1 pt-1">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-0">
        <ul className="space-y-4 text-[15px] leading-8 text-muted-foreground md:text-base">
          {items.map(item => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SectionLead({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-primary">{title}</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { flow, navigate } = useFlowPage("input");
  const { theme, toggleTheme, switchable } = useTheme();

  return (
    <div dir={flow.direction} className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_34%)]" />
      <div className="container relative flex min-h-screen flex-col pt-5 pb-10 md:pt-6 md:pb-14">
        <div className="sticky top-0 z-30 mb-6 rounded-[24px] border border-border/70 bg-background/80 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur md:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Reject Me First</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {flow.preferredLanguage === "ar" ? "الصفحة الرئيسية" : "Home"}
                </div>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {switchable && toggleTheme && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="border-border bg-background/80"
                >
                  {theme === "light" ? <Moon className="me-2 h-4 w-4" /> : <Sun className="me-2 h-4 w-4" />}
                  {flow.preferredLanguage === "ar"
                    ? theme === "light"
                      ? "تفعيل الوضع الداكن"
                      : "تفعيل الوضع الفاتح"
                    : theme === "light"
                      ? "Switch to dark"
                      : "Switch to light"}
                </Button>
              )}
              <div className="inline-flex items-center rounded-full border border-border bg-card/80 p-1">
                <button
                  type="button"
                  onClick={() => flow.setPreferredLanguage("ar")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    flow.preferredLanguage === "ar"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => flow.setPreferredLanguage("en")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    flow.preferredLanguage === "en"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="grid flex-1 content-center gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <Card className="rounded-[36px] border-border/70 bg-card/90 py-0 shadow-[0_28px_90px_rgba(15,23,42,0.08)] dark:shadow-[0_32px_100px_rgba(0,0,0,0.28)]">
            <CardContent className="p-8 md:p-10">
              <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                {flow.text.eyebrow}
              </Badge>
              <div className="mt-5 space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">{flow.text.title}</h1>
                <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">{flow.text.subtitle}</p>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{flow.text.landingDescription}</p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    flow.resetAll();
                    flow.setUseMock(false);
                    navigate("/flow/input");
                  }}
                  className="group rounded-[28px] border border-primary/20 bg-primary/[0.08] p-5 text-left transition hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/[0.11]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary transition group-hover:translate-x-1 rtl:rotate-180" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">{flow.text.submitProject}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{flow.text.submitProjectDesc}</p>
                </button>

                <button
                  type="button"
                  onClick={() => void flow.loadDemo().then(() => navigate("/flow/review"))}
                  className="group rounded-[28px] border border-border bg-background p-5 text-left transition hover:-translate-y-1 hover:border-primary/25 hover:bg-card"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 rtl:rotate-180" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">{flow.text.exploreDemo}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{flow.text.exploreDemoDesc}</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/70 bg-card/90 py-0 shadow-[0_24px_70px_rgba(15,23,42,0.06)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
            <CardHeader>
              <CardTitle>{flow.preferredLanguage === "ar" ? "كيف تمشي التجربة؟" : "How the experience moves"}</CardTitle>
              <CardDescription>
                {flow.preferredLanguage === "ar"
                  ? "كل خطوة لها صفحة مستقلة حتى تكون القراءة أوضح وما يصير كل شيء في شاشة واحدة طويلة."
                  : "Each stage is a separate page, so the flow feels deliberate instead of one long scrolling screen."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {committeeStepRoutes[flow.preferredLanguage].map((step, index) => (
                <div key={step.key} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="font-medium">{step.label}</p>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {index === 0
                      ? flow.text.pageIntroBrief
                      : index === 1
                        ? flow.text.briefReady
                        : index === 2
                          ? flow.text.pageIntroReview
                          : index === 3
                            ? flow.text.pageIntroRebuttal
                            : flow.text.pageIntroVerdict}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

export function InputPage() {
  const { flow, goNext, goTo, pageSteps, statusSlot } = useFlowPage("input");
  const startNewProjectLabel = flow.preferredLanguage === "ar" ? "مشروع جديد" : "Start New Project";

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction}
        language={flow.preferredLanguage}
        eyebrow={flow.text.projectInput}
        title={flow.text.projectInput}
        description={flow.text.pageIntroBrief}
        steps={[...pageSteps]}
        currentStep="input"
        onNavigate={goTo}
        primaryAction={{
          label: flow.text.startCommittee,
          onClick: async () => {
            await flow.startCommittee();
            goTo("/flow/review");
          },
          loading: flow.reviewPending,
        }}
        tertiaryAction={{ label: startNewProjectLabel, onClick: flow.resetAll }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          {flow.reviewError && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-700 dark:text-amber-200">
              {flow.reviewError}
            </div>
          )}

          <Card className="gap-4 border-border/70 bg-background/70 py-4 shadow-none">
            <CardHeader>
              <CardTitle>{flow.preferredLanguage === "ar" ? "طريقة إدخال المشروع" : "How do you want to submit the project?"}</CardTitle>
              <CardDescription>
                {flow.preferredLanguage === "ar"
                  ? "ابدأ بالنص الحر لو عندك وصف سريع، أو استخدم الإدخال المنظم لو تبغى لجنة أوضح من البداية."
                  : "Start with free text for quick founder notes, or use the structured form for a cleaner first brief."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant={flow.inputMode === "free" ? "default" : "outline"} onClick={() => flow.setInputMode("free")}>
                  {flow.text.freeText}
                </Button>
                <Button variant={flow.inputMode === "structured" ? "default" : "outline"} onClick={() => flow.setInputMode("structured")}>
                  {flow.text.structured}
                </Button>
              </div>
            </CardContent>
          </Card>

          {flow.inputMode === "free" ? (
            <Field label={flow.text.founderNarrative}>
              <textarea
                className={inputClassName(true)}
                value={flow.freeText}
                placeholder={flow.text.founderNarrativePlaceholder}
                onChange={event => flow.setFreeText(event.target.value)}
              />
            </Field>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label={flow.text.projectName}
                hint={
                  flow.preferredLanguage === "ar"
                    ? `${flow.structured.projectName.length}/120 حرفًا`
                    : `${flow.structured.projectName.length}/120 characters`
                }
              >
                <input
                  className={inputClassName()}
                  value={flow.structured.projectName}
                  maxLength={120}
                  onChange={event => flow.updateStructured("projectName", event.target.value)}
                />
              </Field>
              <Field label={flow.text.idea}>
                <input className={inputClassName()} value={flow.structured.idea} onChange={event => flow.updateStructured("idea", event.target.value)} />
              </Field>
              <Field label={flow.text.problem}>
                <textarea className={inputClassName(true)} value={flow.structured.problem} onChange={event => flow.updateStructured("problem", event.target.value)} />
              </Field>
              <Field label={flow.text.solution}>
                <textarea className={inputClassName(true)} value={flow.structured.solution} onChange={event => flow.updateStructured("solution", event.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label={flow.text.additionalInfo}>
                  <textarea className={inputClassName(true)} value={flow.structured.additionalInfo} onChange={event => flow.updateStructured("additionalInfo", event.target.value)} />
                </Field>
              </div>
            </div>
          )}

          <Field label={flow.text.transcript}>
            <textarea className={inputClassName(true)} value={flow.transcriptText} placeholder={flow.text.transcriptPlaceholder} onChange={event => flow.setTranscriptText(event.target.value)} />
          </Field>

          <Card className="gap-4 border-border/70 bg-background/70 py-4 shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{flow.text.dynamicSections}</CardTitle>
                <CardDescription>{flow.text.savedDraft}</CardDescription>
              </div>
              <Button variant="outline" onClick={() => flow.addSection()}>{flow.text.addSection}</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {flow.structured.sections.map((section, index) => (
                <div key={`${section.title}-${index}`} className="grid gap-3 rounded-2xl border border-border bg-background p-4 md:grid-cols-[0.9fr_1.1fr_auto]">
                  <input className={inputClassName()} value={section.title} placeholder={flow.text.sectionTitle} onChange={event => flow.updateSection(index, "title", event.target.value)} />
                  <textarea className={inputClassName(true)} value={section.content} placeholder={flow.text.sectionContent} onChange={event => flow.updateSection(index, "content", event.target.value)} />
                  <Button variant="ghost" onClick={() => flow.removeSection(index)}>{flow.text.remove}</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </CommitteeFlowShell>
    </div>
  );
}


export function ReviewPage() {
  const { flow, goBack, goNext, goTo, pageSteps, statusSlot } = useFlowPage("review");

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction}
        language={flow.preferredLanguage}
        eyebrow={flow.text.firstReview}
        title={flow.text.firstReview}
        description={flow.text.pageIntroReview}
        steps={[...pageSteps]}
        currentStep="review"
        onNavigate={goTo}
        primaryAction={{ label: flow.text.openRebuttal, onClick: goNext, disabled: !flow.hasFirstRound }}
        secondaryAction={{ label: flow.text.back, onClick: goBack }}
        tertiaryAction={{ label: flow.text.reset, onClick: flow.resetAll }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          {!flow.firstRound ? (
            <Card className="border-border/70 bg-background/70 py-6 shadow-none">
              <CardContent className="px-6 text-sm leading-7 text-muted-foreground">{flow.text.reviewMissing}</CardContent>
            </Card>
          ) : (
            <>
              <SectionLead
                title={flow.text.reviewSummary}
                description={flow.preferredLanguage === "ar"
                  ? "اقرأ رأي كل جهة على حدة قبل تجهيز ردك حتى تعرف أين فعلًا تحتاج إلى توضيح أو دفاع."
                  : "Read each committee perspective separately before preparing your rebuttal so you know which concerns actually need a response."}
              />

              <div className="grid gap-6 2xl:grid-cols-2">
                  {flow.firstRound.reviews.map(review => {
                    const AgentIcon = agentIcons[review.agent];
                    return (
                      <Card
                        key={review.agent}
                        className="border-border/70 bg-background/80 py-0 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                      >
                        <CardHeader className="space-y-5 px-7 pt-7 md:px-8">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <AgentIcon className="h-5 w-5" />
                              </div>
                              <div className="space-y-3">
                                <CardTitle className="text-xl">{review.label}</CardTitle>
                                <CardDescription className="max-w-2xl text-[15px] leading-8 text-muted-foreground md:text-base">{review.key_insight}</CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-border bg-background text-foreground">
                              {stanceLabels[flow.preferredLanguage][review.stance]}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-7 px-7 pb-8 md:px-8">
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Metric label={flow.text.score} value={scoreText(review.score)} />
                            <Metric label={flow.text.confidence} value={`${review.confidence}%`} />
                          </div>

                          <Card className="gap-3 border-border/70 bg-card py-6 shadow-none">
                            <CardContent className="px-6">
                              <p className="text-xs uppercase tracking-[0.22em] text-primary">{flow.text.summary}</p>
                              <p className="mt-3 max-w-3xl text-[15px] leading-8 text-foreground/85 md:text-base">{review.summary}</p>
                            </CardContent>
                          </Card>

                          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] xl:items-start">
                            <BulletCard title={flow.text.strengths} items={review.strengths} />
                            <BulletCard title={flow.text.objections} items={review.top_objections} />
                          </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}

export function RebuttalPage() {
  const { flow, goBack, goNext, goTo, pageSteps, statusSlot } = useFlowPage("rebuttal");
  const reviews = flow.firstRound?.reviews ?? [];

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction}
        language={flow.preferredLanguage}
        eyebrow={flow.text.rebuttal}
        title={flow.text.rebuttal}
        description={flow.text.pageIntroRebuttal}
        steps={[...pageSteps]}
        currentStep="rebuttal"
        onNavigate={goTo}
        primaryAction={{
          label: flow.text.openVerdict,
          onClick: async () => {
            await flow.submitCommitteeRebuttal();
            goNext();
          },
          disabled: !flow.hasFirstRound,
          loading: flow.rebuttalPending,
        }}
        secondaryAction={{ label: flow.text.back, onClick: goBack }}
        tertiaryAction={{ label: flow.text.reset, onClick: flow.resetAll }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          {flow.rebuttalError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-7 text-red-700 dark:text-red-200">
              {flow.rebuttalError}
            </div>
          )}
          {!flow.firstRound ? (
            <Card className="border-border/70 bg-background/70 py-6 shadow-none">
              <CardContent className="px-6 text-sm leading-7 text-muted-foreground">{flow.text.reviewMissing}</CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-border/70 bg-background/70 py-4 shadow-none">
                <CardHeader>
                  <CardTitle>{flow.preferredLanguage === "ar" ? "طريقة الرد" : "Choose the response format"}</CardTitle>
                  <CardDescription>
                    {flow.preferredLanguage === "ar"
                      ? "إذا تبغى ترد بشكل عام استخدم النص الحر، وإذا تبغى ردًا أقوى وواضحًا استخدم الرد المنظم تحت كل اعتراض."
                      : "Use a free rebuttal for a broad response, or structured rebuttals when you want to address objections one by one."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button variant={flow.rebuttalMode === "free" ? "default" : "outline"} onClick={() => flow.setRebuttalMode("free")}>
                      {flow.text.freeRebuttal}
                    </Button>
                    <Button variant={flow.rebuttalMode === "structured" ? "default" : "outline"} onClick={() => flow.setRebuttalMode("structured")}>
                      {flow.text.structuredRebuttal}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {flow.rebuttalMode === "free" ? (
                <Field label={flow.text.freeRebuttal}>
                  <textarea className={inputClassName(true)} value={flow.freeRebuttal} placeholder={flow.text.emptyResponseHint} onChange={event => flow.setFreeRebuttal(event.target.value)} />
                </Field>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => {
                    const rows = flow.structuredRebuttal[review.agent];
                    const AgentIcon = agentIcons[review.agent];
                    return (
                      <Card key={review.agent} className="border-border/70 bg-background/80 py-0 shadow-none">
                        <CardHeader>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <AgentIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{review.label}</CardTitle>
                                <CardDescription>{flow.text.linkedResponses}</CardDescription>
                              </div>
                            </div>
                            <Button variant="outline" onClick={() => flow.addStructuredRebuttalRow(review.agent)}>
                              {flow.text.addSection}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-5 px-7 pb-7">
                          <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="mb-3 text-sm font-medium">{flow.text.objections}</p>
                            <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                              {review.top_objections.map(objection => (
                                <li key={objection} className="flex gap-3">
                                  <MessageSquareQuote className="mt-1 h-4 w-4 shrink-0 text-primary" />
                                  <span>{objection}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            {rows.map((row, index) => (
                              <div key={`${review.agent}-${index}`} className="grid gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-[0.95fr_1.05fr]">
                                <div className="space-y-2">
                                  <p className="text-xs uppercase tracking-[0.22em] text-primary">{flow.text.objection}</p>
                                  <textarea className={inputClassName(true)} value={row.objection} placeholder={flow.text.objection} onChange={event => flow.setStructuredRebuttal(review.agent, index, "objection", event.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs uppercase tracking-[0.22em] text-primary">{flow.text.response}</p>
                                    <Button variant="ghost" onClick={() => flow.removeStructuredRebuttalRow(review.agent, index)}>{flow.text.remove}</Button>
                                  </div>
                                  <textarea className={inputClassName(true)} value={row.response} placeholder={flow.text.response} onChange={event => flow.setStructuredRebuttal(review.agent, index, "response", event.target.value)} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}

export function VerdictPage() {
  const { flow, goBack, goTo, pageSteps, statusSlot } = useFlowPage("verdict");

  const secondRoundMap = useMemo(() => {
    return new Map((flow.rebuttalResult?.second_round ?? []).map(item => [item.agent, item]));
  }, [flow.rebuttalResult]);

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction}
        language={flow.preferredLanguage}
        eyebrow={flow.text.finalVerdict}
        title={flow.text.finalVerdict}
        description={flow.text.pageIntroVerdict}
        steps={[...pageSteps]}
        currentStep="verdict"
        onNavigate={goTo}
        primaryAction={{ label: flow.text.downloadReport, onClick: flow.downloadReport, disabled: !flow.hasVerdict, icon: "download" }}
        secondaryAction={{ label: flow.text.back, onClick: goBack }}
        tertiaryAction={{ label: flow.text.reset, onClick: flow.resetAll }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          {!flow.rebuttalResult ? (
            <Card className="border-border/70 bg-background/70 py-6 shadow-none">
              <CardContent className="px-6 text-sm leading-7 text-muted-foreground">{flow.text.rebuttalMissing}</CardContent>
            </Card>
          ) : (
            <>
              <Card className="rounded-[30px] border-primary/20 bg-primary/[0.07] py-0 shadow-[0_20px_60px_rgba(79,70,229,0.1)]">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                      {verdictLabels[flow.preferredLanguage][flow.rebuttalResult.final_verdict.verdict]}
                    </Badge>
                    <Badge variant="outline" className="border-border bg-background text-foreground">
                      {flow.text.score}: {scoreText(flow.rebuttalResult.final_verdict.final_score)}
                    </Badge>
                    <Badge variant="outline" className="border-border bg-background text-foreground">
                      {flow.text.confidence}: {flow.rebuttalResult.final_verdict.confidence}%
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {flow.preferredLanguage === "ar" ? "قرار اللجنة النهائي" : "Final committee decision"}
                  </CardTitle>
                  <CardDescription className="text-base leading-8 text-foreground/80">
                    {flow.rebuttalResult.final_verdict.committee_summary}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <FileDown className="h-4 w-4 text-primary" />
                    <span>{flow.text.reportReady}</span>
                  </div>
                </CardContent>
              </Card>

              <SectionLead
                title={flow.text.comparison}
                description={flow.preferredLanguage === "ar"
                  ? "هنا يظهر كيف تغيّر موقف كل طرف بعد ردك، مع إبراز جودة الرد والنتيجة الجديدة."
                  : "This view shows how each reviewer changed after the rebuttal, including the updated stance and response quality."}
              />

              <div className="grid gap-6 xl:grid-cols-3">
                {flow.rebuttalResult.second_round.map(updated => {
                  const previous = flow.firstRound?.reviews.find(item => item.agent === updated.agent);
                  const AgentIcon = agentIcons[updated.agent];
                  return (
                    <Card key={updated.agent} className="border-border/70 bg-background/80 py-0 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                      <CardHeader className="px-7 pt-7">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <AgentIcon className="h-5 w-5" />
                          </div>
                          <div className="space-y-2">
                            <CardTitle className="text-xl">{agentLabels[flow.preferredLanguage][updated.agent]}</CardTitle>
                            <CardDescription className="max-w-2xl text-base leading-8 text-muted-foreground">
                              {rebuttalQualityLabels[flow.preferredLanguage][updated.rebuttal_quality]}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5 px-7 pb-7">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Metric label={flow.text.score} value={`${scoreText(previous?.score ?? updated.updated_score)} → ${scoreText(updated.updated_score)}`} />
                          <Metric label={flow.text.scoreDelta} value={scoreDeltaText(updated.score_delta)} />
                          <Metric label={flow.text.stance} value={`${stanceLabels[flow.preferredLanguage][previous?.stance ?? updated.updated_stance]} → ${stanceLabels[flow.preferredLanguage][updated.updated_stance]}`} />
                          <Metric label={flow.text.response} value={rebuttalQualityLabels[flow.preferredLanguage][updated.rebuttal_quality]} />
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-5 text-base leading-8 text-muted-foreground">
                          <p><span className="font-medium text-foreground">{flow.text.whatChanged}:</span> {updated.what_changed}</p>
                          <p className="mt-3"><span className="font-medium text-foreground">{flow.text.keyInsight}:</span> {updated.key_insight}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <BulletCard title={flow.text.improvedAfterRebuttal} items={flow.rebuttalResult.final_verdict.what_improved_after_rebuttal} />
                <BulletCard title={flow.text.stillUnproven} items={flow.rebuttalResult.final_verdict.what_still_feels_unproven} />
              </div>

              <Card className="border-border/70 bg-background/70 py-0 shadow-none">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{flow.text.nextSteps}</CardTitle>
                      <CardDescription>
                        {flow.preferredLanguage === "ar" ? "خطوات عملية لتقوية المشروع قبل عرضه مرة ثانية." : "Concrete next steps to strengthen the project before the next committee round."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                    {flow.rebuttalResult.final_verdict.actionable_tips.map(item => (
                      <li key={item} className="flex gap-3">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}
