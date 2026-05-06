import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
import type { ReactNode } from "react";

type FlowStep = { key: string; label: string; href: string };

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
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean; icon?: "next" | "download" };
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  tertiaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  statusSlot?: ReactNode;
};

export function CommitteeFlowShell({
  direction, language, eyebrow, title, description,
  steps, currentStep, children, onNavigate,
  primaryAction, secondaryAction, tertiaryAction, statusSlot,
}: CommitteeFlowShellProps) {
  const isArabic = language === "ar";
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const { theme, toggleTheme, switchable } = useTheme();
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="min-h-screen text-foreground">
      <header className="relative w-full bg-background/40 border-b border-border/40 backdrop-blur-md z-50">
        <div className="container max-w-5xl flex items-center justify-between py-4">
          <button onClick={() => onNavigate("/")} className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src="/Terget_Logo.jpg" alt="Logo" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            <span className="text-primary text-lg font-bold tracking-tight hidden sm:inline-block">Reject Me First</span>
          </button>
          
          <div className="flex items-center gap-4">
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-1.5 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 px-4 py-1.5 text-sm font-semibold text-primary transition-all duration-300 hover:bg-background/80 hover:text-primary/80 shadow-sm"
              >
                <BackIcon className="h-4 w-4" />
                {secondaryAction.label}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="container max-w-5xl py-6 md:py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusSlot}
          </div>
          <div className="flex items-center gap-2">
            {switchable && toggleTheme && (
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            )}
            {tertiaryAction && (
              <Button variant="ghost" size="sm" onClick={tertiaryAction.onClick} disabled={tertiaryAction.disabled} className="text-muted-foreground">
                <RotateCcw className="me-1.5 h-3.5 w-3.5" />
                {tertiaryAction.label}
              </Button>
            )}
          </div>
        </div>

        <div>{children}</div>

        {primaryAction && (
          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || primaryAction.loading}
              className="rounded-full bg-primary px-8 text-primary-foreground shadow-[0_0_20px_oklch(0.63_0.2_290/30%)] hover:shadow-[0_0_30px_oklch(0.63_0.2_290/40%)]"
            >
              {primaryAction.loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {isArabic ? "جارٍ التنفيذ..." : "Working..."}
                </>
              ) : (
                <>
                  {primaryAction.label}
                  {primaryAction.icon === "download" ? (
                    <Download className="ms-2 h-4 w-4" />
                  ) : (
                    <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                  )}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
