import { CommitteeFlowShell } from "@/components/CommitteeFlowShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCommitteeFlow } from "@/contexts/CommitteeFlowContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { committeeStepRoutes, scoreDeltaText, scoreText } from "@/lib/reject-me-first";
import {
  agentLabels, agentOrder, rebuttalQualityLabels, stanceLabels, verdictLabels,
  type AgentKey,
} from "@shared/rejectMeFirst";
import {
  AlertTriangle, ArrowRight, BriefcaseBusiness, CheckCircle2, ChevronRight, Cpu,
  FileDown, FlaskConical, Gavel, Lightbulb, Moon, ShieldCheck, Sparkles, Sun, Target, Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useLocation } from "wouter";

const agentIcons: Record<AgentKey, typeof BriefcaseBusiness> = {
  investor: BriefcaseBusiness, customer: Users, financial: BriefcaseBusiness,
  legal: Gavel, technical: Cpu, operator: Target, marketing: Sparkles,
};
const agentColors: Record<AgentKey, string> = {
  investor: "bg-blue-500", customer: "bg-emerald-500", financial: "bg-amber-500",
  legal: "bg-rose-500", technical: "bg-cyan-500", operator: "bg-orange-500", marketing: "bg-violet-500",
};



function AgentAvatar({ agent, size = "md" }: { agent: AgentKey; size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-9 w-9" : "h-7 w-7";
  const textSize = size === "md" ? "text-xs" : "text-[10px]";

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-lg", dim)}>
      <img
        src={`/agents/${agent}.png`}
        alt=""
        className="h-full w-full object-cover"
        onError={(e) => {
          const el = e.currentTarget;
          if (el.dataset.tried) return;
          el.dataset.tried = "1";
          el.style.display = "none";
          el.parentElement!.classList.add(agentColors[agent], "flex", "items-center", "justify-center");
          const span = document.createElement("span");
          span.className = `font-bold text-white ${textSize}`;
          span.textContent = agent[0].toUpperCase();
          el.parentElement!.appendChild(span);
        }}
      />
    </div>
  );
}

function stanceBadge(stance: string) {
  const m: Record<string, string> = {
    strong: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    promising: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    unsure: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    skeptical: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    weak: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return m[stance] ?? "bg-muted text-muted-foreground border-border";
}

function ScoreCircle({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const pct = Math.min(100, Math.max(0, score * 10));
  const r = size === "lg" ? 36 : 22;
  const sw = size === "lg" ? 4 : 3;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const col = score >= 7 ? "stroke-emerald-500" : score >= 5 ? "stroke-amber-500" : "stroke-red-500";
  const d = (r + sw) * 2;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={d} height={d} className="-rotate-90">
        <circle cx={r + sw} cy={r + sw} r={r} fill="none" strokeWidth={sw} className="stroke-border" />
        <circle cx={r + sw} cy={r + sw} r={r} fill="none" strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} className={cn("transition-all duration-700", col)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold tabular-nums", size === "lg" ? "text-2xl" : "text-sm")}>{scoreText(score)}</span>
        <span className={cn("text-muted-foreground", size === "lg" ? "text-xs" : "text-[10px]")}>/10</span>
      </div>
    </div>
  );
}

function useFlowPage(currentStep: "input" | "review" | "rebuttal" | "verdict") {
  const flow = useCommitteeFlow();
  const [, navigate] = useLocation();
  const pageSteps = committeeStepRoutes[flow.preferredLanguage];
  const statusSlot = (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      <button type="button" onClick={() => flow.setPreferredLanguage("en")}
        className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", flow.preferredLanguage === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>EN</button>
      <button type="button" onClick={() => flow.setPreferredLanguage("ar")}
        className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", flow.preferredLanguage === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>AR</button>
    </div>
  );
  return {
    flow, navigate, pageSteps, statusSlot,
    goTo: (href: string) => navigate(href),
    goNext: () => { const i = pageSteps.findIndex(s => s.key === currentStep); const n = pageSteps[i + 1]; if (n) navigate(n.href); },
    goBack: () => { const i = pageSteps.findIndex(s => s.key === currentStep); const p = pageSteps[i - 1]; if (p) navigate(p.href); },
  };
}

function inputCls(multi = false) {
  return multi
    ? "min-h-28 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
    : "h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30";
}

/* ─── LANDING ─── */
export function LandingPage() {
  const { flow, navigate } = useFlowPage("input");
  const { theme, toggleTheme, switchable } = useTheme();
  const isAr = flow.preferredLanguage === "ar";

  return (
    <div dir={flow.direction} className="relative min-h-screen text-foreground overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/4 right-0 h-1/2 w-1/3 rounded-full bg-secondary/10 blur-[100px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <header className="relative w-full bg-background/40 border-b border-border/40 backdrop-blur-md z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src="/Terget_Logo.jpg" alt="Logo" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            <span className="text-primary text-lg font-bold tracking-tight hidden sm:inline-block">Reject Me First</span>
          </div>
          <div className="flex items-center gap-4">
            {switchable && toggleTheme && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all">
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            )}
            <div className="inline-flex items-center rounded-full border border-border/50 bg-background/50 backdrop-blur-sm p-1 shadow-sm">
              <button type="button" onClick={() => flow.setPreferredLanguage("en")}
                className={cn("rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300", flow.preferredLanguage === "en" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}>EN</button>
              <button type="button" onClick={() => flow.setPreferredLanguage("ar")}
                className={cn("rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300", flow.preferredLanguage === "ar" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}>AR</button>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative z-10 flex flex-col items-center pb-20 pt-10 text-center md:pt-16">
        <div className="mb-8 relative group">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-primary to-secondary opacity-70 blur-md transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
          <img src="/Terget_Logo.jpg" alt="Reject Me First" className="relative h-28 w-28 rounded-full object-cover shadow-2xl border-2 border-background" />
        </div>

        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          {isAr ? "اختبر فكرتك قبل الإطلاق" : "Test Your Idea Before Launch"}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {isAr
            ? "قيّم فكرتك أمام لجنة ذكاء اصطناعي من 7 خبراء قبل ما تعرضها على مستثمرين حقيقيين. احصل على ملاحظات قاسية تبني مشروعك."
            : "Get your startup idea evaluated by an AI committee of 7 expert perspectives before pitching to real investors. Brutal feedback that builds better startups."}
        </p>

        <div className="mt-12 w-full max-w-2xl space-y-4">
          <div className="grid gap-5 md:grid-cols-2">
            <button
              type="button"
              onClick={() => { flow.resetAll(); flow.setUseMock(false); navigate("/flow/input"); }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6 text-start backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"><Sparkles className="h-5 w-5" /></div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{isAr ? "أرسل مشروعك" : "Submit your project"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{isAr ? "قيّم فكرتك الحقيقية مباشرة مع لجنة الخبراء." : "Evaluate your real idea with the AI committee."}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => void flow.loadDemo().then(() => navigate("/flow/input"))}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6 text-start backdrop-blur-md transition-all hover:border-secondary/50 hover:shadow-2xl hover:shadow-secondary/20 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30"><FlaskConical className="h-5 w-5" /></div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-secondary rtl:rotate-180" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{isAr ? "جرّب الديمو" : "Try the demo"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{isAr ? "استعرض التجربة الكاملة على مثال جاهز." : "Explore the full flow with sample data."}</p>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-20 w-full max-w-5xl">
          <div className="mb-8 flex items-center justify-center gap-4">
             <div className="h-px flex-1 bg-border/50 max-w-[100px]"></div>
             <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{isAr ? "لجنة الخبراء الخاصة بك" : "Your Expert Committee"}</span>
             <div className="h-px flex-1 bg-border/50 max-w-[100px]"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {agentOrder.map((agent, i) => (
              <div key={agent} className="group flex items-center gap-3 rounded-full border border-border/50 bg-background/40 py-2 pl-2 pr-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-background/80 hover:shadow-md hover:-translate-y-0.5">
                <AgentAvatar agent={agent} />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">{agentLabels[flow.preferredLanguage][agent]}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── INPUT ─── */
export function InputPage() {
  const { flow, goTo, pageSteps, statusSlot } = useFlowPage("input");
  const isAr = flow.preferredLanguage === "ar";

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction} language={flow.preferredLanguage}
        eyebrow={flow.text.projectInput} title={flow.text.projectInput} description={flow.text.pageIntroBrief}
        steps={[...pageSteps]} currentStep="input" onNavigate={goTo}
        primaryAction={{ label: flow.text.startCommittee, onClick: async () => { await flow.startCommittee(); goTo("/flow/review"); }, loading: flow.reviewPending }}
        secondaryAction={{ label: isAr ? "رجوع للرئيسية" : "Back to Home", onClick: () => goTo("/") }}
        tertiaryAction={{ label: isAr ? "مسح البيانات" : "Reset Data", onClick: () => { flow.resetAll(); goTo("/"); } }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          {flow.reviewError && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{flow.reviewError}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant={flow.inputMode === "free" ? "default" : "outline"} onClick={() => flow.setInputMode("free")}>{flow.text.freeText}</Button>
            <Button size="sm" variant={flow.inputMode === "structured" ? "default" : "outline"} onClick={() => flow.setInputMode("structured")}>{flow.text.structured}</Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">{isAr ? "المقيّمين" : "Evaluators"}</span>
              <Button variant="ghost" size="sm" onClick={flow.selectAllAgents} disabled={flow.selectedAgents.length === agentOrder.length}>{isAr ? "الكل" : "All"}</Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {agentOrder.map(agent => {
                const sel = flow.selectedAgents.includes(agent);
                return (
                  <button key={agent} type="button" onClick={() => flow.toggleSelectedAgent(agent)} aria-pressed={sel}
                    className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-start text-sm transition-all", sel ? "border-primary/40 bg-primary/10" : "border-border hover:border-primary/20")}>
                    <div className={cn("h-2 w-2 rounded-full", sel ? agentColors[agent] : "bg-muted-foreground/30")} />
                    <span className={sel ? "font-medium" : "text-muted-foreground"}>{agentLabels[flow.preferredLanguage][agent]}</span>
                    {sel && <CheckCircle2 className="ms-auto h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {flow.inputMode === "free" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">{flow.text.founderNarrative}</label>
              <textarea className={inputCls(true)} value={flow.freeText} placeholder={flow.text.founderNarrativePlaceholder} onChange={e => flow.setFreeText(e.target.value)} />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium">{flow.text.projectName}</label><input className={inputCls()} value={flow.structured.projectName} maxLength={120} onChange={e => flow.updateStructured("projectName", e.target.value)} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">{flow.text.idea}</label><input className={inputCls()} value={flow.structured.idea} onChange={e => flow.updateStructured("idea", e.target.value)} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">{flow.text.problem}</label><textarea className={inputCls(true)} value={flow.structured.problem} onChange={e => flow.updateStructured("problem", e.target.value)} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">{flow.text.solution}</label><textarea className={inputCls(true)} value={flow.structured.solution} onChange={e => flow.updateStructured("solution", e.target.value)} /></div>
              <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-medium">{flow.text.additionalInfo}</label><textarea className={inputCls(true)} value={flow.structured.additionalInfo} onChange={e => flow.updateStructured("additionalInfo", e.target.value)} /></div>
            </div>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}

/* ─── REVIEW ─── */
export function ReviewPage() {
  const { flow, goBack, goNext, goTo, pageSteps, statusSlot } = useFlowPage("review");

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction} language={flow.preferredLanguage}
        eyebrow={flow.text.firstReview} title={flow.text.firstReview} description={flow.text.pageIntroReview}
        steps={[...pageSteps]} currentStep="review" onNavigate={goTo}
        primaryAction={{ label: flow.text.openRebuttal, onClick: goNext, disabled: !flow.hasFirstRound }}
        secondaryAction={{ label: flow.text.back, onClick: goBack }}
        tertiaryAction={{ label: flow.text.reset, onClick: () => { flow.resetAll(); goTo("/"); } }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          {!flow.firstRound ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{flow.text.reviewMissing}</p>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {flow.firstRound.reviews.map(review => (
                <div key={review.agent} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AgentAvatar agent={review.agent} />
                      <div>
                        <p className="text-sm font-semibold">{review.label}</p>
                        <Badge className={cn("mt-1 text-[10px] uppercase tracking-wider", stanceBadge(review.stance))}>{stanceLabels[flow.preferredLanguage][review.stance]}</Badge>
                      </div>
                    </div>
                    <ScoreCircle score={review.score} />
                  </div>
                  <div className="space-y-4 px-5 pb-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{review.summary}</p>
                    <details className="group">
                      <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-emerald-400">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />{flow.text.strengths}
                      </summary>
                      <ul className="mt-2 space-y-1.5 ps-5 text-sm text-muted-foreground">
                        {review.strengths.map(s => <li key={s} className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />{s}</li>)}
                      </ul>
                    </details>
                    <details open className="group">
                      <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5" />{flow.text.objections}
                      </summary>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {review.top_objections.map((o, i) => (
                          <li key={o} className="flex items-start gap-2.5 rounded-lg bg-secondary/50 px-3 py-2">
                            <span className="shrink-0 text-xs font-medium text-muted-foreground">{i + 1}.</span>{o}
                          </li>
                        ))}
                      </ul>
                    </details>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{flow.text.confidence}: {review.confidence}%</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${review.confidence}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}

/* ─── REBUTTAL ─── */
export function RebuttalPage() {
  const { flow, goBack, goNext, goTo, pageSteps, statusSlot } = useFlowPage("rebuttal");
  const reviews = flow.firstRound?.reviews ?? [];
  const isAr = flow.preferredLanguage === "ar";

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction} language={flow.preferredLanguage}
        eyebrow={flow.text.rebuttal} title={flow.text.rebuttal} description={flow.text.pageIntroRebuttal}
        steps={[...pageSteps]} currentStep="rebuttal" onNavigate={goTo}
        primaryAction={{ label: flow.text.openVerdict, onClick: async () => { await flow.submitCommitteeRebuttal(); goNext(); }, disabled: !flow.hasFirstRound, loading: flow.rebuttalPending }}
        secondaryAction={{ label: flow.text.back, onClick: goBack }}
        tertiaryAction={{ label: flow.text.reset, onClick: () => { flow.resetAll(); goTo("/"); } }}
        statusSlot={statusSlot}
      >
        <div className="space-y-6">
          {flow.rebuttalError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{flow.rebuttalError}</span>
            </div>
          )}
          {!flow.firstRound ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{flow.text.reviewMissing}</p>
          ) : (
            <>
              {reviews.map(review => (
                <div key={review.agent} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <AgentAvatar agent={review.agent} size="sm" />
                    <span className="text-sm font-semibold">{review.label}</span>
                    <Badge className={cn("ms-auto text-[10px] uppercase", stanceBadge(review.stance))}>{stanceLabels[flow.preferredLanguage][review.stance]}</Badge>
                  </div>
                  <ul className="space-y-2">
                    {review.top_objections.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">{i + 1}</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-sm font-medium">{isAr ? "ردك على الاعتراضات" : "Your response to the committee"}</label>
                <textarea className={inputCls(true)} value={flow.freeRebuttal} placeholder={flow.text.emptyResponseHint} onChange={e => flow.setFreeRebuttal(e.target.value)} />
              </div>
            </>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}

/* ─── VERDICT ─── */
export function VerdictPage() {
  const { flow, goBack, goTo, pageSteps, statusSlot } = useFlowPage("verdict");
  const isAr = flow.preferredLanguage === "ar";

  return (
    <div dir={flow.direction}>
      <CommitteeFlowShell
        direction={flow.direction} language={flow.preferredLanguage}
        eyebrow={flow.text.finalVerdict} title={flow.text.finalVerdict} description={flow.text.pageIntroVerdict}
        steps={[...pageSteps]} currentStep="verdict" onNavigate={goTo}
        primaryAction={{ label: flow.text.downloadReport, onClick: flow.downloadReport, disabled: !flow.hasVerdict, icon: "download" }}
        secondaryAction={{ label: flow.text.back, onClick: goBack }}
        tertiaryAction={{ label: flow.text.reset, onClick: () => { flow.resetAll(); goTo("/"); } }}
        statusSlot={statusSlot}
      >
        <div className="space-y-8">
          {!flow.rebuttalResult ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{flow.text.rebuttalMissing}</p>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <Badge className={cn("text-xs uppercase tracking-wider", stanceBadge(flow.rebuttalResult.final_verdict.verdict))}>
                  {verdictLabels[flow.preferredLanguage][flow.rebuttalResult.final_verdict.verdict]}
                </Badge>
                <div className="mt-4 flex justify-center"><ScoreCircle score={flow.rebuttalResult.final_verdict.final_score} size="lg" /></div>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{flow.rebuttalResult.final_verdict.committee_summary}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400"><Sparkles className="h-3.5 w-3.5" />{flow.text.strongestPoint}</p>
                  <p className="text-sm leading-relaxed text-foreground/90">{flow.rebuttalResult.final_verdict.biggest_strength}</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400"><AlertTriangle className="h-3.5 w-3.5" />{flow.text.biggestRisk}</p>
                  <p className="text-sm leading-relaxed text-foreground/90">{flow.rebuttalResult.final_verdict.biggest_risk}</p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {flow.rebuttalResult.second_round.map(updated => {
                  const prev = flow.firstRound?.reviews.find(r => r.agent === updated.agent);
                  return (
                    <div key={updated.agent} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center gap-2.5">
                        <AgentAvatar agent={updated.agent} />
                        <div>
                          <p className="text-sm font-semibold">{agentLabels[flow.preferredLanguage][updated.agent]}</p>
                          <Badge className={cn("mt-0.5 text-[10px] uppercase", stanceBadge(updated.updated_stance))}>{stanceLabels[flow.preferredLanguage][updated.updated_stance]}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-[10px] text-muted-foreground">{isAr ? "سابق" : "Before"}</p><p className="text-lg font-bold tabular-nums">{scoreText(prev?.score ?? updated.updated_score)}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">{isAr ? "التغيير" : "Change"}</p><p className={cn("text-lg font-bold tabular-nums", updated.score_delta > 0 ? "text-emerald-400" : updated.score_delta < 0 ? "text-red-400" : "")}>{scoreDeltaText(updated.score_delta)}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">{isAr ? "محدّث" : "After"}</p><ScoreCircle score={updated.updated_score} size="sm" /></div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{updated.what_changed}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{flow.text.stillUnproven}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {flow.rebuttalResult.final_verdict.what_still_feels_unproven.map(item => (
                    <li key={item} className="flex items-start gap-2.5"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Lightbulb className="h-3.5 w-3.5" />{flow.text.nextSteps}</p>
                <ol className="space-y-3">
                  {flow.rebuttalResult.final_verdict.actionable_tips.map((tip, i) => (
                    <li key={tip} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">{i + 1}</span>{tip}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      </CommitteeFlowShell>
    </div>
  );
}
