import { CommitteeFlowShell } from "@/components/CommitteeFlowShell";
import { useCommitteeFlow } from "@/contexts/CommitteeFlowContext";
import { agentLabels, rebuttalQualityLabels, stanceLabels, verdictLabels } from "@shared/rejectMeFirst";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { committeeStepRoutes, scoreDeltaText, scoreText } from "@/lib/reject-me-first";
import { AlertTriangle, CheckCircle2, ChevronDown, FileDown, FlaskConical, Globe2, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";

function useFlowPage(currentStep: "input" | "brief" | "review" | "rebuttal" | "verdict") {
  const flow = useCommitteeFlow();
  const [, navigate] = useLocation();
  const pageSteps = committeeStepRoutes[flow.preferredLanguage];

  const statusSlot = (
    <>
      <Badge variant="outline" className="border-white/10 bg-white/5 text-foreground">
        <Globe2 className="me-2 h-3.5 w-3.5" />
        {flow.text.language}: {flow.preferredLanguage === "ar" ? "العربية" : "English"}
      </Badge>
      <Badge variant="outline" className="border-white/10 bg-white/5 text-foreground">
        {flow.useMock ? <FlaskConical className="me-2 h-3.5 w-3.5" /> : <Sparkles className="me-2 h-3.5 w-3.5" />}
        {flow.useMock ? flow.text.mockMode : flow.text.liveMode}
      </Badge>
    </>
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

function StatusRail() {
  const { flow } = useFlowPage("input");

  const statuses = [
    { label: flow.text.briefStatus, active: true },
    { label: flow.text.reviewStatus, active: flow.hasFirstRound },
    { label: flow.text.verdictStatus, active: flow.hasVerdict },
  ];

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[var(--accent)]">{flow.text.panelStatus}</p>
      <div className="grid gap-3 md:grid-cols-3">
        {statuses.map(item => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              {item.active ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-300" />
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{flow.text.savedDraft}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function inputClassName(multiline = false) {
  return multiline
    ? "min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(216,195,159,0.2)]"
    : "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(216,195,159,0.2)]";
}

export function LandingPage() {
  const { flow, navigate } = useFlowPage("input");

  return (
    <div dir={flow.direction} className="min-h-screen bg-background text-foreground">
      <div className="container py-10 md:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6 rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)] md:p-10">
            <Badge variant="outline" className="border-[rgba(216,195,159,0.24)] bg-[rgba(216,195,159,0.08)] text-[var(--accent)]">
              {flow.text.eyebrow}
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">{flow.text.title}</h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">{flow.text.subtitle}</p>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{flow.text.landingDescription}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate("/flow/input")}>
                {flow.text.startFlow}
              </Button>
              <Button size="lg" variant="outline" onClick={() => flow.loadDemo().then(() => navigate("/flow/review"))}>
                {flow.text.loadDemo}
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-[30px] border border-white/10 bg-[#111111] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">{flow.text.comparison}</p>
            {committeeStepRoutes[flow.preferredLanguage].map((step, index) => (
              <div key={step.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(216,195,159,0.18)] text-sm font-semibold text-[var(--accent)]">
                    {index + 1}
                  </div>
                  <p className="font-medium">{step.label}</p>
                </div>
                <p className="text-sm text-muted-foreground">
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
          </div>
        </section>
      </div>
    </div>
  );
}

export function InputPage() {
  const { flow, goNext, goTo, pageSteps, statusSlot } = useFlowPage("input");

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
        primaryAction={{ label: flow.text.next, onClick: goNext }}
        tertiaryAction={{ label: flow.text.reset, onClick: flow.resetAll }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          <StatusRail />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-sm font-medium">{flow.text.language}</p>
              <div className="flex gap-3">
                <Button variant={flow.preferredLanguage === "en" ? "default" : "outline"} onClick={() => flow.setPreferredLanguage("en")}>English</Button>
                <Button variant={flow.preferredLanguage === "ar" ? "default" : "outline"} onClick={() => flow.setPreferredLanguage("ar")}>العربية</Button>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-sm font-medium">{flow.text.mode}</p>
              <div className="flex gap-3">
                <Button variant={!flow.useMock ? "default" : "outline"} onClick={() => flow.setUseMock(false)}>{flow.text.liveMode}</Button>
                <Button variant={flow.useMock ? "default" : "outline"} onClick={() => flow.setUseMock(true)}>{flow.text.mockMode}</Button>
                <Button variant="ghost" onClick={() => void flow.loadDemo()}>{flow.text.loadDemo}</Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Button variant={flow.inputMode === "free" ? "default" : "outline"} onClick={() => flow.setInputMode("free")}>{flow.text.freeText}</Button>
            <Button variant={flow.inputMode === "structured" ? "default" : "outline"} onClick={() => flow.setInputMode("structured")}>{flow.text.structured}</Button>
          </div>

          {flow.inputMode === "free" ? (
            <Field label={flow.text.founderNarrative}>
              <textarea className={inputClassName(true)} value={flow.freeText} placeholder={flow.text.founderNarrativePlaceholder} onChange={event => flow.setFreeText(event.target.value)} />
            </Field>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={flow.text.projectName}>
                <input className={inputClassName()} value={flow.structured.projectName} onChange={event => flow.updateStructured("projectName", event.target.value)} />
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

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={flow.text.transcript}>
              <textarea className={inputClassName(true)} value={flow.transcriptText} placeholder={flow.text.transcriptPlaceholder} onChange={event => flow.setTranscriptText(event.target.value)} />
            </Field>
            <Field label={flow.text.pdf}>
              <textarea className={inputClassName(true)} value={flow.pdfText} placeholder={flow.text.pdfPlaceholder} onChange={event => flow.setPdfText(event.target.value)} />
            </Field>
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{flow.text.dynamicSections}</p>
                <p className="text-sm text-muted-foreground">{flow.text.savedDraft}</p>
              </div>
              <Button variant="outline" onClick={() => flow.addSection()}>{flow.text.addSection}</Button>
            </div>
            <div className="space-y-3">
              {flow.structured.sections.map((section, index) => (
                <div key={`${section.title}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[0.9fr_1.1fr_auto]">
                  <input className={inputClassName()} value={section.title} placeholder={flow.text.sectionTitle} onChange={event => flow.updateSection(index, "title", event.target.value)} />
                  <textarea className={inputClassName(true)} value={section.content} placeholder={flow.text.sectionContent} onChange={event => flow.updateSection(index, "content", event.target.value)} />
                  <Button variant="ghost" onClick={() => flow.removeSection(index)}>{flow.text.remove}</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CommitteeFlowShell>
    </div>
  );
}

export function BriefPage() {
  const { flow, goBack, goNext, goTo, pageSteps, statusSlot } = useFlowPage("brief");
  const brief = flow.firstRound?.projectBrief;

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction}
        language={flow.preferredLanguage}
        eyebrow={flow.text.projectBrief}
        title={flow.text.projectBrief}
        description={flow.text.briefReady}
        steps={[...pageSteps]}
        currentStep="brief"
        onNavigate={goTo}
        primaryAction={{ label: flow.text.startCommittee, onClick: async () => { await flow.startCommittee(); goNext(); }, loading: flow.reviewPending }}
        secondaryAction={{ label: flow.text.back, onClick: goBack }}
        tertiaryAction={{ label: flow.text.reset, onClick: flow.resetAll }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          <StatusRail />
          {flow.reviewError && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{flow.reviewError}</div>}
          {brief ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SummaryBlock label={flow.text.projectName} value={brief.project_name} />
              <SummaryBlock label={flow.text.idea} value={brief.one_line_summary} />
              <SummaryBlock label={flow.text.problem} value={brief.problem} />
              <SummaryBlock label={flow.text.solution} value={brief.solution} />
              <SummaryBlock label="Target customer" value={brief.target_customer} />
              <SummaryBlock label="Business model" value={brief.business_model} />
              <SummaryBlock label="Differentiation" value={brief.differentiation} />
              <SummaryBlock label="Traction" value={brief.evidence_or_traction} />
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-muted-foreground">{flow.text.briefReady}</p>
              <p className="mt-2 text-sm text-muted-foreground">{flow.text.startCommittee}</p>
            </div>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}

function SummaryBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--accent)]">{label}</p>
      <p className="text-sm leading-7 text-foreground/90">{value || "—"}</p>
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
          <StatusRail />
          {!flow.firstRound ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">{flow.text.reviewMissing}</div>
          ) : (
            flow.firstRound.reviews.map(review => (
              <details key={review.agent} open className="group rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">{review.label}</p>
                    <h3 className="mt-2 text-xl font-semibold">{review.key_insight}</h3>
                  </div>
                  <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                </summary>
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <Metric label={flow.text.score} value={scoreText(review.score)} />
                  <Metric label={flow.text.confidence} value={`${review.confidence}%`} />
                  <Metric label={flow.text.stance} value={stanceLabels[flow.preferredLanguage][review.stance]} />
                  <Metric label={flow.text.keyInsight} value={review.summary} />
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <BulletCard title={flow.text.strengths} items={review.strengths} />
                  <BulletCard title={flow.text.objections} items={review.top_objections} />
                </div>
              </details>
            ))
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}

function BulletCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="mb-3 font-medium">{title}</p>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map(item => (
          <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" /> <span>{item}</span></li>
        ))}
      </ul>
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
        primaryAction={{ label: flow.text.openVerdict, onClick: async () => { await flow.submitCommitteeRebuttal(); goNext(); }, disabled: !flow.hasFirstRound, loading: flow.rebuttalPending }}
        secondaryAction={{ label: flow.text.back, onClick: goBack }}
        tertiaryAction={{ label: flow.text.reset, onClick: flow.resetAll }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          <StatusRail />
          {flow.rebuttalError && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{flow.rebuttalError}</div>}
          {!flow.firstRound ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">{flow.text.reviewMissing}</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant={flow.rebuttalMode === "free" ? "default" : "outline"} onClick={() => flow.setRebuttalMode("free")}>{flow.text.freeRebuttal}</Button>
                <Button variant={flow.rebuttalMode === "structured" ? "default" : "outline"} onClick={() => flow.setRebuttalMode("structured")}>{flow.text.structuredRebuttal}</Button>
              </div>

              {flow.rebuttalMode === "free" ? (
                <Field label={flow.text.freeRebuttal}>
                  <textarea className={inputClassName(true)} value={flow.freeRebuttal} placeholder={flow.text.emptyResponseHint} onChange={event => flow.setFreeRebuttal(event.target.value)} />
                </Field>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => {
                    const rows = flow.structuredRebuttal[review.agent];
                    return (
                      <div key={review.agent} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">{review.label}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{flow.text.linkedResponses}</p>
                          </div>
                          <Button variant="outline" onClick={() => flow.addStructuredRebuttalRow(review.agent)}>{flow.text.addSection}</Button>
                        </div>
                        <div className="space-y-3">
                          {rows.map((row, index) => (
                            <div key={`${review.agent}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2">
                              <textarea className={inputClassName(true)} value={row.objection} placeholder={flow.text.objection} onChange={event => flow.setStructuredRebuttal(review.agent, index, "objection", event.target.value)} />
                              <div className="space-y-3">
                                <textarea className={inputClassName(true)} value={row.response} placeholder={flow.text.response} onChange={event => flow.setStructuredRebuttal(review.agent, index, "response", event.target.value)} />
                                <div className="flex justify-end">
                                  <Button variant="ghost" onClick={() => flow.removeStructuredRebuttalRow(review.agent, index)}>{flow.text.remove}</Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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
          <StatusRail />
          {!flow.rebuttalResult ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">{flow.text.rebuttalMissing}</div>
          ) : (
            <>
              <div className="rounded-[28px] border border-[rgba(216,195,159,0.2)] bg-[rgba(216,195,159,0.06)] p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-[var(--accent)] text-black hover:bg-[var(--accent)]">{verdictLabels[flow.preferredLanguage][flow.rebuttalResult.final_verdict.verdict]}</Badge>
                  <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-foreground">{flow.text.score}: {scoreText(flow.rebuttalResult.final_verdict.final_score)}</Badge>
                  <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-foreground">{flow.text.confidence}: {flow.rebuttalResult.final_verdict.confidence}%</Badge>
                </div>
                <p className="mt-4 text-lg leading-8">{flow.rebuttalResult.final_verdict.committee_summary}</p>
                <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                  <FileDown className="h-4 w-4 text-[var(--accent)]" />
                  <span>{flow.text.reportReady}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {flow.firstRound?.reviews.map(review => {
                  const updated = secondRoundMap.get(review.agent);
                  if (!updated) return null;
                  return (
                    <div key={review.agent} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">{agentLabels[flow.preferredLanguage][review.agent]}</p>
                      <div className="mt-4 grid gap-3">
                        <Metric label={flow.text.score} value={`${scoreText(review.score)} → ${scoreText(updated.updated_score)}`} />
                        <Metric label={flow.text.scoreDelta} value={scoreDeltaText(updated.score_delta)} />
                        <Metric label={flow.text.stance} value={`${stanceLabels[flow.preferredLanguage][review.stance]} → ${stanceLabels[flow.preferredLanguage][updated.updated_stance]}`} />
                        <Metric label={flow.text.response} value={rebuttalQualityLabels[flow.preferredLanguage][updated.rebuttal_quality]} />
                      </div>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                        <p><span className="font-medium text-foreground">{flow.text.whatChanged}:</span> {updated.what_changed}</p>
                        <p><span className="font-medium text-foreground">{flow.text.keyInsight}:</span> {updated.key_insight}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <BulletCard title={flow.text.improvedAfterRebuttal} items={flow.rebuttalResult.final_verdict.what_improved_after_rebuttal} />
                <BulletCard title={flow.text.stillUnproven} items={flow.rebuttalResult.final_verdict.what_still_feels_unproven} />
              </div>
              <BulletCard title={flow.text.nextSteps} items={flow.rebuttalResult.final_verdict.actionable_tips} />
            </>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}
