import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Landmark,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
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
  const { theme, toggleTheme, switchable } = useTheme();
  const currentIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_34%)]" />
      <div className="container relative py-6 md:py-8">
        <div className="mb-6 rounded-[28px] border border-border/70 bg-card/85 px-5 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur md:px-6 dark:shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="inline-flex items-center gap-3 text-left transition-opacity hover:opacity-85"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-primary">Reject Me First</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {isArabic ? "مراجعة استثمارية وتقنية بشكل واضح ومنظم" : "A clearer, step-based investment and technical review"}
                </div>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {switchable && toggleTheme && (
                <Button variant="outline" size="sm" onClick={toggleTheme} className="border-border bg-background/80">
                  {theme === "light" ? <Moon className="me-2 h-4 w-4" /> : <Sun className="me-2 h-4 w-4" />}
                  {isArabic ? (theme === "light" ? "تفعيل الوضع الداكن" : "تفعيل الوضع الفاتح") : theme === "light" ? "Switch to dark" : "Switch to light"}
                </Button>
              )}
              {statusSlot}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="rounded-[32px] border border-border/70 bg-card/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
                {eyebrow}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-[2rem]">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
            </section>

            <section className="rounded-[32px] border border-border/70 bg-card/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{isArabic ? "تنقل الصفحات" : "Page flow"}</p>
                <Badge variant="outline" className="border-border bg-background text-foreground">
                  {Math.max(currentIndex + 1, 1)}/{steps.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const active = step.key === currentStep;
                  const passed = currentIndex > index;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => onNavigate(step.href)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                        active
                          ? "border-primary/30 bg-primary/8 shadow-[0_10px_30px_rgba(79,70,229,0.10)]"
                          : "border-border bg-background/70 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          active
                            ? "bg-primary text-primary-foreground"
                            : passed
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {passed && !active ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{step.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {active
                            ? isArabic
                              ? "الصفحة الحالية"
                              : "Current page"
                            : passed
                              ? isArabic
                                ? "يمكنك الرجوع لها"
                                : "You can revisit this"
                              : isArabic
                                ? "الخطوة التالية"
                                : "Comes next"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>

          <main className="space-y-5">
            <section className="rounded-[34px] border border-border/70 bg-card/92 p-5 shadow-[0_32px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7 dark:shadow-[0_34px_100px_rgba(0,0,0,0.3)]">
              {children}
            </section>

            {(primaryAction || secondaryAction || tertiaryAction) && (
              <section className="rounded-[28px] border border-border/70 bg-card/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    {secondaryAction && (
                      <Button variant="outline" onClick={secondaryAction.onClick} disabled={secondaryAction.disabled} className="border-border bg-background/70">
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
                    <Button
                      onClick={primaryAction.onClick}
                      disabled={primaryAction.disabled || primaryAction.loading}
                      className="min-w-52 shadow-[0_12px_30px_rgba(79,70,229,0.22)]"
                    >
                      {primaryAction.icon === "download" ? (
                        <Download className="me-2 h-4 w-4" />
                      ) : (
                        <>
                          <Sparkles className="me-2 h-4 w-4" />
                          <NextIcon className="me-1 h-4 w-4" />
                        </>
                      )}
                      {primaryAction.loading ? (isArabic ? "جارٍ التنفيذ..." : "Working...") : primaryAction.label}
                    </Button>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
