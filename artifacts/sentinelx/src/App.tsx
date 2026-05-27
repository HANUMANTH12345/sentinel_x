import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Sandbox from "@/pages/Sandbox";
import QrDetector from "@/pages/QrDetector";
import Intelligence from "@/pages/Intelligence";
import Community from "@/pages/Community";
import Admin from "@/pages/Admin";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

import { ChatBot } from "@/components/chatbot/ChatBot";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { ThreatAlerts } from "@/components/ui/ThreatAlerts";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/sandbox" component={Sandbox} />
      <Route path="/qr" component={QrDetector} />
      <Route path="/intelligence" component={Intelligence} />
      <Route path="/community" component={Community} />
      <Route path="/admin" component={Admin} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <LoadingScreen />
          <Router />
          <ChatBot />
          <ThreatAlerts />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;