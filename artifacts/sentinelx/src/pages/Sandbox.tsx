import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, CheckCircle2, XCircle, ShieldAlert, ArrowRight } from "lucide-react";
import { ThreatScoreGauge } from "@/components/ui/ThreatScoreGauge";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

const SAMPLE_URLS = [
  "http://secure-login-paypal-verify.com",
  "https://github.com",
  "http://bit.ly/3x8qA2m",
  "https://free-crypto-giveaway-now.ru"
];

const SCAN_STEPS = [
  "DNS Lookup & Domain Registration",
  "SSL Certificate Validation",
  "Tracing Redirect Chains",
  "Executing Sandbox JS Behavior",
  "Malware Pattern Matching"
];

export default function Sandbox() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleScan = (targetUrl: string) => {
    if (!targetUrl) return;
    setUrl(targetUrl);
    setIsScanning(true);
    setResults(null);
    setScanProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setScanProgress(progress);
      
      if (progress >= 5) {
        clearInterval(interval);
        setIsScanning(false);
        setResults({
          score: Math.floor(Math.random() * 40) + 50, // 50-90
          indicators: ["Obfuscated JavaScript", "Suspicious Redirect Chain", "New Domain Registration", "Missing HSTS"],
          chain: [targetUrl, "http://short.ly/xyz", "http://malicious-payload-drop.ru/login"],
          trackers: ["Meta Pixel", "Unknown Fingerprinting Script"],
          requests: [
            { method: "GET", url: "/api/config", size: "1.2kb" },
            { method: "POST", url: "/log/keystrokes", size: "0.5kb" }
          ],
          aiText: "Sentinel AI analysis indicates this URL exhibits behaviors consistent with credential harvesting. The site initiates a complex redirect chain designed to evade basic scanners, finally landing on a newly registered domain hosting obfuscated scripts that attempt to log input keystrokes."
        });
      }
    }, 1000);
  };

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white">URL Sandbox Analyzer</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Detonate links in an isolated environment.</p>
        </div>

        {!results && (
          <Card className="bg-card/40 backdrop-blur-md border-primary/20 shadow-[0_0_30px_rgba(0,245,255,0.05)] overflow-hidden">
            <CardContent className="p-8 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL to analyze (e.g., https://suspicious-site.com)"
                  className="h-14 font-mono text-lg bg-black/50 border-white/10 focus-visible:border-primary focus-visible:ring-primary shadow-inner"
                  disabled={isScanning}
                />
                <Button 
                  onClick={() => handleScan(url)}
                  disabled={isScanning || !url}
                  className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 min-w-[200px]"
                >
                  {isScanning ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Scanning...</> : <><Search className="w-5 h-5 mr-2" /> Analyze URL</>}
                </Button>
              </div>

              {isScanning ? (
                <div className="mt-8 space-y-4 font-mono text-sm">
                  {SCAN_STEPS.map((step, i) => (
                    <div key={i} className={`flex items-center gap-3 ${i < scanProgress ? "text-primary" : i === scanProgress ? "text-white animate-pulse" : "text-muted-foreground opacity-50"}`}>
                      {i < scanProgress ? <CheckCircle2 className="w-5 h-5" /> : i === scanProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="w-5 h-5 border-2 border-current rounded-full opacity-50" />}
                      {step}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3 font-mono">Sample URLs to try:</p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_URLS.map((sUrl, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleScan(sUrl)}
                        className="px-3 py-1.5 text-xs font-mono rounded-md bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-colors text-left truncate max-w-full"
                      >
                        {sUrl}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-mono text-white truncate max-w-2xl">{url}</h2>
              <Button variant="outline" onClick={() => { setResults(null); setUrl(""); }}>Scan Another URL</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-white/10 flex flex-col items-center justify-center p-6">
                <ThreatScoreGauge score={results.score} />
              </Card>
              <Card className="md:col-span-2 bg-card/50 border-white/10 p-6">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" /> AI Risk Assessment
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {results.aiText}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {results.indicators.map((ind: string, i: number) => (
                    <span key={i} className="px-3 py-1 text-xs font-mono rounded bg-destructive/10 text-destructive border border-destructive/20">
                      {ind}
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="bg-card/50 border-white/10 p-6">
              <h3 className="font-display font-bold text-lg mb-4">Redirect Chain</h3>
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 font-mono text-sm">
                {results.chain.map((link: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-md truncate max-w-[250px]" title={link}>
                      {link}
                    </div>
                    {i < results.chain.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-white/10 p-6">
                 <h3 className="font-display font-bold text-lg mb-4">Network Requests</h3>
                 <div className="space-y-2 font-mono text-xs">
                   {results.requests.map((req: any, i: number) => (
                     <div key={i} className="flex justify-between p-2 rounded bg-black/30 border border-white/5">
                       <div className="flex gap-3">
                         <span className={req.method === 'POST' ? 'text-secondary' : 'text-primary'}>{req.method}</span>
                         <span className="text-muted-foreground truncate max-w-[150px]">{req.url}</span>
                       </div>
                       <span className="text-white/40">{req.size}</span>
                     </div>
                   ))}
                 </div>
              </Card>
              <Card className="bg-card/50 border-white/10 p-6">
                 <h3 className="font-display font-bold text-lg mb-4">Risk Breakdown</h3>
                 <div className="h-[200px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={[
                       { name: 'Phishing', val: 85 },
                       { name: 'Malware', val: 40 },
                       { name: 'Spam', val: 20 },
                       { name: 'Suspicious', val: 65 }
                     ]}>
                       <XAxis dataKey="name" stroke="#666" fontSize={12} />
                       <Tooltip cursor={{fill: '#222'}} contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                       <Bar dataKey="val" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}