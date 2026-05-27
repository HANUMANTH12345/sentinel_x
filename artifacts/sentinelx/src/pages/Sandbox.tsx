import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, CheckCircle2, ShieldAlert, ArrowRight, AlertTriangle, Shield, Wifi, Cpu } from "lucide-react";
import { ThreatScoreGauge } from "@/components/ui/ThreatScoreGauge";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MemoryVisualizer } from "@/components/sandbox/MemoryVisualizer";
import { VoiceNarrator } from "@/components/ai/VoiceNarrator";
import { useThreatLevel } from "@/contexts/ThreatLevelContext";

const SAMPLE_URLS = [
  "http://secure-login-paypal-verify.com",
  "https://github.com",
  "http://bit.ly/3x8qA2m",
  "https://free-crypto-giveaway-now.ru",
  "https://google.com",
];

const SCAN_STEPS = [
  "DNS Lookup & Domain Registration",
  "SSL Certificate Validation",
  "Tracing Redirect Chains",
  "Executing Sandbox JS Behavior",
  "Malware Pattern Matching",
];

interface AnalysisResult {
  score: number;
  indicators: string[];
  chain: string[];
  breakdown: Record<string, number>;
  networkRequests: { method: string; url: string; size: string }[];
  aiText: string;
  trackers: string[];
  statusCode: number | null;
  hasSSL: boolean;
  hasHSTS: boolean;
}

export default function Sandbox() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMemory, setShowMemory] = useState(true);
  const { setThreatLevel } = useThreatLevel();

  useEffect(() => {
    return () => setThreatLevel(0);
  }, [setThreatLevel]);

  const handleScan = async (targetUrl: string) => {
    if (!targetUrl) return;
    setUrl(targetUrl);
    setIsScanning(true);
    setResults(null);
    setError(null);
    setScanProgress(0);
    setThreatLevel(0);
    setShowMemory(true);

    let step = 0;
    const stepInterval = setInterval(() => {
      step += 1;
      setScanProgress(step);
      if (step >= SCAN_STEPS.length - 1) clearInterval(stepInterval);
    }, 800);

    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      clearInterval(stepInterval);
      setScanProgress(SCAN_STEPS.length);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }

      const data = await res.json() as AnalysisResult;
      await new Promise((r) => setTimeout(r, 400));
      setResults(data);
      setThreatLevel(data.score >= 70 ? 3 : data.score >= 35 ? 2 : 0);
    } catch (err) {
      clearInterval(stepInterval);
      setScanProgress(0);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsScanning(false);
    }
  };

  const breakdownData = results
    ? Object.entries(results.breakdown).map(([name, val]) => ({ name, val }))
    : [];

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white">URL Sandbox Analyzer</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            Detonate links in an isolated environment. Results are based on live heuristic and network analysis.
          </p>
        </div>

        {!results && (
          <Card className="bg-card/40 backdrop-blur-md border-primary/20 shadow-[0_0_30px_rgba(0,245,255,0.05)] overflow-hidden mb-6">
            <CardContent className="p-8 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                  data-testid="input-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isScanning && url && handleScan(url)}
                  placeholder="Enter URL to analyze (e.g., https://suspicious-site.com)"
                  className="h-14 font-mono text-lg bg-black/50 border-white/10 focus-visible:border-primary focus-visible:ring-primary shadow-inner"
                  disabled={isScanning}
                />
                <Button
                  data-testid="button-analyze"
                  onClick={() => handleScan(url)}
                  disabled={isScanning || !url}
                  className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 min-w-[200px]"
                >
                  {isScanning
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Scanning...</>
                    : <><Search className="w-5 h-5 mr-2" /> Analyze URL</>}
                </Button>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 text-destructive font-mono text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {isScanning ? (
                <div className="mt-8 space-y-4 font-mono text-sm">
                  {SCAN_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-all duration-300 ${
                        i < scanProgress
                          ? "text-primary"
                          : i === scanProgress
                          ? "text-white animate-pulse"
                          : "text-muted-foreground opacity-40"
                      }`}
                    >
                      {i < scanProgress
                        ? <CheckCircle2 className="w-5 h-5" />
                        : i === scanProgress
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <div className="w-5 h-5 border-2 border-current rounded-full opacity-50" />}
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
                        data-testid={`button-sample-url-${i}`}
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

        {(isScanning || results) && showMemory && (
          <div className="mb-6">
            <MemoryVisualizer
              isScanning={isScanning}
              isComplete={!isScanning && !!results}
              threatScore={results?.score ?? 0}
              indicators={results?.indicators ?? []}
            />
          </div>
        )}

        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VoiceNarrator results={results} score={results.score} />

            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">Analyzed URL</p>
                <h2 className="text-lg font-bold font-mono text-white truncate max-w-2xl">{url}</h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  data-testid="button-toggle-memory"
                  onClick={() => setShowMemory(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors"
                >
                  <Cpu className="w-3 h-3" />
                  {showMemory ? "Hide" : "Show"} Memory View
                </button>
                <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border ${results.hasSSL ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                  {results.hasSSL ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {results.hasSSL ? "SSL Verified" : "No SSL"}
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border ${results.hasHSTS ? "border-primary/30 bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground"}`}>
                  <Wifi className="w-3 h-3" />
                  {results.hasHSTS ? "HSTS" : "No HSTS"}
                </div>
                {results.statusCode && (
                  <div className="text-xs font-mono px-3 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">
                    HTTP {results.statusCode}
                  </div>
                )}
                <Button data-testid="button-scan-another" variant="outline" onClick={() => { setResults(null); setUrl(""); setError(null); setThreatLevel(0); }}>
                  Scan Another URL
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-white/10 flex flex-col items-center justify-center p-6">
                <ThreatScoreGauge score={results.score} />
              </Card>
              <Card className="md:col-span-2 bg-card/50 border-white/10 p-6">
                <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" /> AI Risk Assessment
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{results.aiText}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {results.indicators.map((ind, i) => (
                    <span key={i} className="px-3 py-1 text-xs font-mono rounded bg-destructive/10 text-destructive border border-destructive/20">
                      {ind}
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            {results.chain.length > 0 && (
              <Card className="bg-card/50 border-white/10 p-6">
                <h3 className="font-display font-bold text-lg mb-4">Redirect Chain</h3>
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 font-mono text-sm">
                  {results.chain.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`px-4 py-2 rounded-md truncate max-w-[280px] border ${i === 0 ? "bg-primary/10 border-primary/30 text-primary" : i === results.chain.length - 1 ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-black/40 border-white/10 text-muted-foreground"}`} title={link}>
                        {link}
                      </div>
                      {i < results.chain.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                </div>
                {results.chain.length === 1 && (
                  <p className="text-xs text-muted-foreground font-mono mt-2">No redirects detected — direct destination.</p>
                )}
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-white/10 p-6">
                <h3 className="font-display font-bold text-lg mb-4">Network Requests Observed</h3>
                <div className="space-y-2 font-mono text-xs">
                  {results.networkRequests.map((req, i) => (
                    <div key={i} className="flex justify-between p-2 rounded bg-black/30 border border-white/5">
                      <div className="flex gap-3">
                        <span className={req.method === "POST" ? "text-secondary" : "text-primary"}>{req.method}</span>
                        <span className="text-muted-foreground truncate max-w-[180px]">{req.url}</span>
                      </div>
                      <span className="text-white/40">{req.size}</span>
                    </div>
                  ))}
                </div>
                {results.trackers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-muted-foreground font-mono mb-2">Suspicious scripts detected:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.trackers.map((t, i) => (
                        <span key={i} className="px-2 py-1 text-xs font-mono rounded bg-secondary/10 text-secondary border border-secondary/20">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
              <Card className="bg-card/50 border-white/10 p-6">
                <h3 className="font-display font-bold text-lg mb-4">Risk Breakdown</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdownData}>
                      <XAxis dataKey="name" stroke="#666" fontSize={12} />
                      <Tooltip
                        cursor={{ fill: "#1a1a2e" }}
                        contentStyle={{ backgroundColor: "#0d0d1a", borderColor: "#333", borderRadius: 8 }}
                        formatter={(val: number) => [`${val}`, "Risk Score"]}
                      />
                      <Bar dataKey="val" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
