import { useState, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Play, Download, X, FileText, AlertTriangle, Shield,
  CheckCircle2, Loader2, ChevronDown, ChevronUp, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserScans } from "@/contexts/UserScansContext";

interface ScanResult {
  url: string;
  score: number;
  severity: "critical" | "high" | "medium" | "low" | "safe";
  indicators: string[];
  hasSSL: boolean;
  chain: string[];
  error?: string;
  status: "pending" | "scanning" | "done" | "error";
}

function severityFromScore(score: number): ScanResult["severity"] {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "medium";
  if (score >= 10) return "low";
  return "safe";
}

const SEV_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  safe: "text-green-400 bg-green-500/10 border-green-500/30",
};

const SEV_BAR: Record<string, string> = {
  critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-blue-500", safe: "bg-green-500",
};

function parseUrls(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map(l => l.trim().replace(/^["'\s]+|["'\s]+$/g, ""))
    .filter(l => l.length > 3 && (l.includes(".") || l.startsWith("http")))
    .filter((l, i, a) => a.indexOf(l) === i)
    .slice(0, 50);
}

function parseCsv(text: string): string[] {
  const lines = text.split("\n");
  const urls: string[] = [];
  for (const line of lines) {
    const cols = line.split(",");
    for (const col of cols) {
      const v = col.trim().replace(/^["']+|["']+$/g, "");
      if (v.startsWith("http") || (v.includes(".") && !v.includes(" ") && v.length > 5)) {
        urls.push(v);
      }
    }
  }
  return [...new Set(urls)].slice(0, 50);
}

function parseJsonHistory(text: string): string[] {
  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed
      : (parsed["Browser History"] ?? parsed.history ?? parsed.urls ?? []);
    return [...new Set(
      (arr as Record<string, unknown>[])
        .map(item => (item.url ?? item.URL ?? item.href ?? "") as string)
        .filter(u => typeof u === "string" && u.startsWith("http") && !u.startsWith("chrome://") && !u.startsWith("about:"))
    )].slice(0, 50);
  } catch { return []; }
}

export default function BulkScanner() {
  const [textarea, setTextarea] = useState("");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const { addScan } = useUserScans();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let urls: string[] = [];
      if (file.name.endsWith(".json")) urls = parseJsonHistory(text);
      else if (file.name.endsWith(".csv")) urls = parseCsv(text);
      else urls = parseUrls(text);
      setTextarea(prev => {
        const existing = prev.trim() ? parseUrls(prev) : [];
        return [...new Set([...existing, ...urls])].join("\n");
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const urls = parseUrls(textarea);

  const startScan = async () => {
    if (urls.length === 0 || isRunning) return;
    abortRef.current = false;
    setIsRunning(true);
    setProgress(0);
    const initial: ScanResult[] = urls.map(u => ({ url: u, score: 0, severity: "safe", indicators: [], hasSSL: false, chain: [], status: "pending" }));
    setResults(initial);

    for (let i = 0; i < urls.length; i++) {
      if (abortRef.current) break;
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "scanning" } : r));
      try {
        const res = await fetch("/api/analyze-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urls[i] }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { score: number; indicators: string[]; hasSSL: boolean; chain: string[] };
        const severity = severityFromScore(data.score);
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, ...data, severity, status: "done" } : r));
        addScan({ url: urls[i], score: data.score, indicators: data.indicators, chain: data.chain, hasSSL: data.hasSSL });
      } catch (err) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "error", error: String(err) } : r));
      }
      setProgress(i + 1);
    }
    setIsRunning(false);
  };

  const stopScan = () => { abortRef.current = true; setIsRunning(false); };

  const downloadCsv = () => {
    const done = results.filter(r => r.status === "done" || r.status === "error");
    const rows = [
      ["URL", "Threat Score", "Severity", "SSL", "Redirect Chain", "Indicators"],
      ...done.map(r => [
        r.url, String(r.score), r.severity, r.hasSSL ? "Yes" : "No",
        r.chain.join(" → "), r.indicators.join("; "),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sentinelx-bulk-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const done = results.filter(r => r.status === "done" || r.status === "error");
  const critCount = results.filter(r => r.severity === "critical" && r.status === "done").length;
  const safeCount = results.filter(r => r.severity === "safe" && r.status === "done").length;

  return (
    <Sidebar>
      <div className="p-8 max-w-5xl mx-auto pb-20">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold font-display text-white">Bulk URL Scanner</h1>
          </div>
          <p className="text-muted-foreground font-mono text-sm">
            Scan up to 50 URLs at once. Paste, upload a CSV/JSON, or drag a file. Results export as a ranked CSV report.
          </p>
        </div>

        {results.length === 0 && (
          <div className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/25 bg-white/2"}`}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-white/30" />
              <p className="text-white/50 font-mono text-sm mb-1">Drop a CSV, TXT, or browser history JSON here</p>
              <p className="text-white/25 font-mono text-xs">or click to browse</p>
              <input ref={fileRef} type="file" accept=".csv,.txt,.json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/8" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-white/25 text-xs font-mono">or paste URLs</span></div>
            </div>

            <textarea
              value={textarea}
              onChange={e => setTextarea(e.target.value)}
              placeholder={"https://example.com\nhttps://suspicious-site.ru\nhttps://phishing-paypal.xyz\n...one URL per line"}
              rows={10}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 resize-none"
            />

            <div className="flex items-center justify-between">
              <p className="text-white/40 font-mono text-xs">{urls.length} / 50 URLs detected</p>
              <Button onClick={startScan} disabled={urls.length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Play className="w-4 h-4" />Start Scanning {urls.length > 0 && `(${urls.length})`}
              </Button>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="text-white/40">{done.length}/{results.length} scanned</span>
                {critCount > 0 && <span className="text-red-400 font-bold">{critCount} critical</span>}
                {safeCount > 0 && <span className="text-green-400">{safeCount} safe</span>}
                {isRunning && <span className="text-primary animate-pulse flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Scanning...</span>}
              </div>
              <div className="flex gap-2">
                {isRunning ? (
                  <Button variant="outline" size="sm" onClick={stopScan} className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <X className="w-3.5 h-3.5" />Stop
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setResults([]); setTextarea(""); setProgress(0); }} className="gap-1.5">
                      <X className="w-3.5 h-3.5" />New Scan
                    </Button>
                    {done.length > 0 && (
                      <Button size="sm" onClick={downloadCsv} className="gap-1.5 bg-primary text-primary-foreground">
                        <Download className="w-3.5 h-3.5" />Export CSV
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {isRunning && (
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${(progress / results.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}

            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {results
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((r, i) => (
                    <motion.div
                      key={r.url}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-xl border border-white/8 bg-black/30 overflow-hidden"
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/3 transition-colors"
                        onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                      >
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          {r.status === "scanning" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                          {r.status === "pending" && <div className="w-2 h-2 rounded-full bg-white/20" />}
                          {r.status === "done" && r.severity === "safe" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                          {r.status === "done" && r.severity !== "safe" && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                          {r.status === "done" && r.severity === "critical" && <AlertTriangle className="w-4 h-4 text-red-400" />}
                          {r.status === "error" && <X className="w-4 h-4 text-red-400/50" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm text-white truncate">{r.url}</p>
                          {r.status === "done" && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${SEV_BAR[r.severity]}`} style={{ width: `${r.score}%` }} />
                              </div>
                              <span className="text-[10px] font-mono text-white/40">{r.score}/100</span>
                            </div>
                          )}
                        </div>
                        {r.status === "done" && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border capitalize shrink-0 ${SEV_COLORS[r.severity]}`}>
                            {r.severity}
                          </span>
                        )}
                        {r.status === "done" && (
                          expandedIdx === i ? <ChevronUp className="w-4 h-4 text-white/20 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/20 shrink-0" />
                        )}
                      </div>

                      <AnimatePresence>
                        {expandedIdx === i && r.status === "done" && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="border-t border-white/5 px-4 py-3 space-y-2 font-mono text-xs">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={r.hasSSL ? "text-green-400 flex items-center gap-1" : "text-red-400 flex items-center gap-1"}>
                                  <Shield className="w-3 h-3" />{r.hasSSL ? "SSL" : "No SSL"}
                                </span>
                                {r.chain.length > 1 && (
                                  <span className="text-yellow-400 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />{r.chain.length} redirects
                                  </span>
                                )}
                              </div>
                              {r.indicators.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {r.indicators.map((ind, j) => (
                                    <span key={j} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">{ind}</span>
                                  ))}
                                </div>
                              )}
                              {r.chain.length > 1 && (
                                <p className="text-white/30 truncate">{r.chain.join(" → ")}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
