import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect, lazy, Suspense } from "react";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Sandbox from "@/pages/Sandbox";
import QrDetector from "@/pages/QrDetector";
import Intelligence from "@/pages/Intelligence";
import Community from "@/pages/Community";
import Admin from "@/pages/Admin";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import ScanHistory from "@/pages/History";

import { ChatBot } from "@/components/chatbot/ChatBot";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { ThreatAlerts } from "@/components/ui/ThreatAlerts";
import { ThreatLevelProvider } from "@/contexts/ThreatLevelContext";
import { CyberStorm } from "@/components/background/CyberStorm";
import { UserScansProvider } from "@/contexts/UserScansContext";

const ThreatUniverse = lazy(() => import("@/pages/ThreatUniverse"));
const ThreatMap = lazy(() => import("@/pages/ThreatMap"));

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/sandbox" component={Sandbox} />
      <Route path="/qr" component={QrDetector} />
      <Route path="/intelligence" component={Intelligence} />
      <Route path="/universe">
        {() => (
          <Suspense fallback={<div className="flex items-center justify-center h-screen text-primary font-mono text-sm animate-pulse">LOADING THREAT UNIVERSE...</div>}>
            <ThreatUniverse />
          </Suspense>
        )}
      </Route>
      <Route path="/community" component={Community} />
      <Route path="/admin" component={Admin} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/history" component={ScanHistory} />
      <Route path="/threatmap">
        {() => (
          <Suspense fallback={<div className="flex items-center justify-center h-screen text-primary font-mono text-sm animate-pulse">LOADING THREAT MAP...</div>}>
            <ThreatMap />
          </Suspense>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThreatLevelProvider>
          <UserScansProvider>
            <CyberStorm />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <LoadingScreen />
              <Router />
              <ChatBot />
              <ThreatAlerts />
            </WouterRouter>
            <Toaster />
          </UserScansProvider>
        </ThreatLevelProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
