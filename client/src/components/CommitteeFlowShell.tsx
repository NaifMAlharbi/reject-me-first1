import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Download, Landmark, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

type FlowStep = {
  key: string;
  label: string;
  href: string;
};

type CommitteeFlowShellProps = {
  direction: "ltr" | "rtl";
  language: "en" | "ar";
  eyebrow: string;
  title: string;
  description: string;
  steps: FlowStep[];
  currentStep: string;
  children: ReactNode;
  onNavigate: (href: string) => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    icon?: "next" | "download";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  tertiaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  statusSlot?: ReactNode;
};

export function CommitteeFlowShell({
  direction,
  language,
  eyebrow,
  title,
  description,
  steps,
  currentStep,
  children,
  onNavigate,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  statusSlot,
}: CommitteeFlowShellProps) {
  const isArabic = language === "ar";
  const NextIcon = isArabic ? ArrowLeft : ArrowRight;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(216,195,159,0.18),_transparent_55%)] pointer-events-none" />
      <div className="container relative py-8 md:py-10">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="inline-flex items-center gap-3 text-left transition-opacity hover:opacity-80"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Landmark className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">Reject Me First</div>
              <div className="text-sm text-muted-foreground">
                {isArabic ? "محاكاة لجنة استثمار وتقنية" : "Investment and technical committee simulation"}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {statusSlot}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
              <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[var(--accent)]">{eyebrow}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium">{isArabic ? "خطوات اللجنة" : "Committee steps"}</p>
                <Badge variant="outline" className="border-white/15 bg-white/5 text-xs text-foreground">
                  {steps.findIndex(step => step.key === currentStep) + 1}/{steps.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const active = step.key === currentStep;
                  const passed = steps.findIndex(item => item.key === currentStep) > index;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => onNavigate(step.href)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                        active
                          ? "border-[var(--accent)] bg-[rgba(216,195,159,0.12)]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          active || passed ? "bg-[var(--accent)] text-black" : "bg-white/8 text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{step.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {active
                            ? isArabic
                              ? "الخطوة الحالية"
                              : "Current step"
                            : passed
                              ? isArabic
                                ? "يمكن المراجعة"
                                : "Available to review"
                              : isArabic
                                ? "لاحقًا"
                                : "Later"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>

          <main className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[#121212]/95 p-5 shadow-[0_32px_100px_rgba(0,0,0,0.34)] md:p-7">
              {children}
            </section>

            {(primaryAction || secondaryAction || tertiaryAction) && (
              <section className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  {secondaryAction && (
                    <Button variant="outline" onClick={secondaryAction.onClick} disabled={secondaryAction.disabled}>
                      <BackIcon className="me-2 h-4 w-4" />
                      {secondaryAction.label}
                    </Button>
                  )}
                  {tertiaryAction && (
                    <Button variant="ghost" onClick={tertiaryAction.onClick} disabled={tertiaryAction.disabled}>
                      <RotateCcw className="me-2 h-4 w-4" />
                      {tertiaryAction.label}
                    </Button>
                  )}
                </div>
                {primaryAction && (
                  <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled || primaryAction.loading} className="min-w-44">
                    {primaryAction.icon === "download" ? <Download className="me-2 h-4 w-4" /> : <NextIcon className="me-2 h-4 w-4" />}
                    {primaryAction.loading ? (isArabic ? "جارٍ التنفيذ..." : "Working...") : primaryAction.label}
                  </Button>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
