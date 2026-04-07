import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import ReportForm from "./pages/ReportForm";
import IssueDetail from "./pages/IssueDetail";
import UserProfile from "./pages/UserProfile";
import AdminPanel from "./pages/AdminPanel";
import Leaderboard from "./pages/Leaderboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/report"} component={ReportForm} />
      <Route path={"/issue/:id"} component={IssueDetail} />
      <Route path={"/profile/:userId"} component={UserProfile} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/leaderboard"} component={Leaderboard} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
