import ErrorBoundary from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommitteeFlowProvider } from "@/contexts/CommitteeFlowContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import {
  InputPage,
  LandingPage,
  RebuttalPage,
  ReviewPage,
  VerdictPage,
} from "@/pages/CommitteePages";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/flow/input" component={InputPage} />
      <Route path="/flow/review" component={ReviewPage} />
      <Route path="/flow/rebuttal" component={RebuttalPage} />
      <Route path="/flow/verdict" component={VerdictPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <CommitteeFlowProvider>
            <Router />
          </CommitteeFlowProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
