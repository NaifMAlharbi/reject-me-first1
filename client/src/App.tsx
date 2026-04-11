import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CommitteeFlowProvider } from "@/contexts/CommitteeFlowContext";
import NotFound from "@/pages/NotFound";
import {
  BriefPage,
  InputPage,
  LandingPage,
  RebuttalPage,
  ReviewPage,
  VerdictPage,
} from "@/pages/CommitteePages";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Route, Switch } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/flow/input" component={InputPage} />
      <Route path="/flow/brief" component={BriefPage} />
      <Route path="/flow/review" component={ReviewPage} />
      <Route path="/flow/rebuttal" component={RebuttalPage} />
      <Route path="/flow/verdict" component={VerdictPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <CommitteeFlowProvider>
            <Router />
          </CommitteeFlowProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
