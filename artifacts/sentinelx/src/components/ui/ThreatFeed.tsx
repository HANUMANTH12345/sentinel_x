import { useState, useEffect } from "react";
import { AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const THREATS = [
  { msg: "Malicious domain blocked", type: "critical" },
  { msg: "Phishing attempt intercepted", type: "warning" },
  { msg: "Suspicious IP flagged", type: "warning" },
  { msg: "DDoS mitigation active", type: "critical" },
  { msg: "New malware signature loaded", type: "info" },
  { msg: "Credential harvesting prevented", type: "critical" },
  { msg: "Anomalous traffic detected", type: "warning" },
];

const IPS = Array.from({length: 20}, () => `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`);

export function ThreatFeed() {
  const [feed, setFeed] = useState<{id: number; msg: string; type: string; ip: string; time: string}[]>([]);

  useEffect(() => {
    let idCounter = 0;
    const interval = setInterval(() => {
      const randomThreat = THREATS[Math.floor(Math.random() * THREATS.length)];
      const randomIp = IPS[Math.floor(Math.random() * IPS.length)];
      const now = new Date().toISOString().split('T')[1].slice(0, -1);
      
      setFeed(prev => {
        const newFeed = [{ id: idCounter++, msg: randomThreat.msg, type: randomThreat.type, ip: randomIp, time: now }, ...prev];
        return newFeed.slice(0, 10);
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/30 border border-border rounded-xl p-4 backdrop-blur-sm h-full flex flex-col font-mono text-sm">
      <div className="flex items-center gap-2 mb-4 text-primary pb-2 border-b border-border/50">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
        <h3 className="font-bold uppercase tracking-widest font-display text-white">Live Threat Stream</h3>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none z-10" />
        <div className="flex flex-col gap-2">
          {feed.map((item) => (
            <div key={item.id} className="animate-in slide-in-from-top-2 fade-in duration-300 flex items-start gap-3 py-1 border-b border-white/5 last:border-0">
              <span className="text-muted-foreground opacity-50 shrink-0">[{item.time}]</span>
              {item.type === 'critical' && <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
              {item.type === 'warning' && <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
              {item.type === 'info' && <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
              <div className="flex flex-col">
                <span className={cn(
                  "font-medium",
                  item.type === 'critical' ? "text-destructive drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" : 
                  item.type === 'warning' ? "text-yellow-500" : "text-primary"
                )}>
                  {item.msg}
                </span>
                <span className="text-xs text-muted-foreground opacity-60">Source: {item.ip}</span>
              </div>
            </div>
          ))}
          {feed.length === 0 && (
            <div className="text-muted-foreground animate-pulse text-center mt-10">Waiting for intelligence stream...</div>
          )}
        </div>
      </div>
    </div>
  );
}