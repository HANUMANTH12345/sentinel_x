import { useState, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chrome, Upload, Play, Download, AlertTriangle, Shield,
  CheckCircle2, Loader2, X, Globe2, ArrowRight, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserScans } from "@/contexts/UserScansContext";

interface HistoryEntry { url: string; domain: string; title?: string; }
interface ScanResult extends HistoryEntry {
  score: number;
  severity: "critical" | "high" | "medium" | "low" | "safe";
  indicators: string[];
  hasSSL: boolean;
  chain: string[];
  status: "pending" | "scanning" | "done" | "error";
  error?: string;
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

function severityFromScore(score: number): ScanResult["severity"] {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "medium";
  if (score >= 10) return "low";
  return "safe";
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function parseHistoryFile(text: string, filename: string): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const seen = new Set<string>();

  const add = (url: string, title?: string) => {
    if (!url || seen.has(url)) return;
    if (url.startsWith("chrome://") || url.startsWith("about:") || url.startsWith("moz-extension://")) return;
    if (!url.startsWith("http")) return;
    seen.add(url);
    entries.push({ url, domain: extractDomain(url), title });
  };

  try {
    if (filename.endsWith(".json")) {
      const parsed = JSON.parse(text);
      // Chrome extension formats: various
      const arr = Array.isArray(parsed) ? parsed
        : (parsed["Browser History"] ?? parsed.history ?? parsed.urls ?? parsed.items ?? []);
      for (const item of arr as Record<string, unknown>[]) {
        add(
          String(item.url ?? item.URL ?? item.href ?? item.page_url ?? ""),
          String(item.title ?? item.Title ?? ""),
        );
      }
    } else {
      // Plain text — one URL per line
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("http")) add(trimmed);
      }
    }
  } catch {
    // Fallback: extract URLs via regex
    const urlRegex = /https?:\/\/[^\s"'<>]+/g;
    for (const match of text.matchAll(urlRegex)) add(match[0]);
  }

  return entries.slice(0, 100);
}

const STEPS = [
  { id: "chrome", label: "Google Chrome", color: "#4285F4", steps: ["Open Chrome", "Press Ctrl+H (or Cmd+Y on Mac)", "Install the \"Export Chrome History\" extension from the Chrome Web Store", "Click the extension icon → Export as JSON", "Upload the downloaded file here"] },
  { id: "firefox", label: "Mozilla Firefox", color: "#FF7139", steps: ["Open Firefox", "Press Ctrl+Shift+H to open History", "Right-click any entry → Export History (Firefox 122+)", "Or use the \"Export Firefox History\" add-on", "Upload the JSON/TXT file here"] },
  { id: "manual", label: "Paste Manually", color: "#00f5ff", steps: ["Open your browser history (Ctrl+H)", "Select URLs and copy them", "Paste into the text area below — one URL per line"] },
];

export default function BrowserScan() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pasteText, setPasteText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const { addScan } = useUserScans();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseHistoryFile(text, file.name);
      setEntries(parsed);
      setShowInstructions(false);
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    const lines = pasteText.split("\n").filter(l => l.trim().startsWith("http"));
    const parsed = lines.map(url => ({ url: url.trim(), domain: extractDomain(url.trim()) }));
    const unique = parsed.filter((e, i, a) => a.findIndex(x => x.url === e.url) === i).slice(0, 100);
    setEntries(unique);
    setShowInstructions(false);
  };

  const startScan = async () => {
    if (entries.length === 0 || isRunning) return;
    abortRef.current = false;
    setIsRunning(true);
    setProgress(0);
    const initial: ScanResult[] = entries.map(e => ({ ...e, score: 0, severity: "safe", indicators: [], hasSSL: false, chain: [], status: "pending" }));
    setResults(initial);

    for (let i = 0; i < entries.length; i++) {
      if (abortRef.current) break;
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "scanning" } : r));
      try {
        const res = await fetch("/api/analyze-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: entries[i].url }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { score: number; indicators: string[]; hasSSL: boolean; chain: string[] };
        const severity = severityFromScore(data.score);
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, ...data, severity, status: "done" } : r));
        if (data.score >= 20) {
          addScan({ url: entries[i].url, score: data.score, indicators: data.indicators, chain: data.chain, hasSSL: data.hasSSL });
        }
      } catch (err) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "error", error: String(err) } : r));
      }
      setProgress(i + 1);
    }
    setIsRunning(false);
  };

  const downloadCsv = () => {
    const rows = [["URL", "Domain", "Threat Score", "Severity", "SSL", "Indicators"],
      ...results.filter(r => r.status === "done").map(r => [r.url, r.domain, String(r.score), r.severity, r.hasSSL ? "Yes" : "No", r.indicators.join("; ")])];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sentinelx-history-scan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const done = results.filter(r => r.status === "done" || r.status === "error");
  const risky = results.filter(r => ["critical", "high", "medium"].includes(r.severity) && r.status === "done");
  const critCount = results.filter(r => r.severity === "critical" && r.status === "done").length;

  if (results.length > 0) {
    return (
      <Sidebar>
        <div className="p-8 max-w-5xl mx-auto pb-20">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display text-white">Browser History Analysis</h1>
              <p className="text-muted-foreground font-mono text-xs mt-0.5">{entries.length} URLs from your history · Scanning for threats</p>
            </div>
            <div className="flex gap-2">
              {!isRunning && done.length > 0 && (
                <Button size="sm" onClick={downloadCsv} className="gap-1.5 bg-primary text-primary-foreground">
                  <Download className="w-3.5 h-3.5" />Export Report
                </Button>
              )}
              {!isRunning && (
                <Button variant="outline" size="sm" onClick={() => { setResults([]); setEntries([]); setPasteText(""); setShowInstructions(true); }} className="gap-1.5">
                  <X className="w-3.5 h-3.5" />New Analysis
                </Button>
              )}
              {isRunning && (
                <Button variant="outline" size="sm" onClick={() => { abortRef.current = true; setIsRunning(false); }} className="gap-1.5 border-red-500/30 text-red-400">
                  <X className="w-3.5 h-3.5" />Stop
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono text-xs">
            {[
              { label: "Scanned", val: `${done.length}/${results.length}`, color: "text-white" },
              { label: "Risky", val: String(risky.length), color: "text-orange-400" },
              { label: "Critical", val: String(critCount), color: "text-red-400" },
              { label: "Safe", val: String(results.filter(r => r.severity === "safe" && r.status === "done").length), color: "text-green-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/3 rounded-xl border border-white/8 px-4 py-3">
                <p className="text-white/40 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {isRunning && (
            <div className="mb-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(progress / results.length) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          )}

          <div className="space-y-1.5">
            {results.slice().sort((a, b) => b.score - a.score).map((r, i) => (
              <div key={r.url} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${r.status === "done" && r.severity !== "safe" ? "border-white/8 bg-black/30" : "border-transparent bg-white/2"}`}>
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {r.status === "scanning" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                  {r.status === "pending" && <div className="w-1.5 h-1.5 rounded-full bg-white/15" />}
                  {r.status === "done" && r.severity === "safe" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                  {r.status === "done" && ["medium", "low"].includes(r.severity) && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                  {r.status === "done" && ["critical", "high"].includes(r.severity) && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  {r.status === "error" && <X className="w-3.5 h-3.5 text-white/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-white/70 truncate">{r.domain}</p>
                </div>
                {r.status === "done" && (
                  <>
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
                      <div className={`h-full rounded-full ${SEV_BAR[r.severity]}`} style={{ width: `${r.score}%` }} />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border capitalize shrink-0 ${SEV_COLORS[r.severity]}`}>
                      {r.severity === "safe" ? "OK" : r.severity}
                    </span>
                    {r.chain.length > 1 && (
                      <span className="text-[10px] text-yellow-400 font-mono shrink-0 flex items-center gap-0.5">
                        <ArrowRight className="w-2.5 h-2.5" />{r.chain.length - 1}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-8 max-w-4xl mx-auto pb-20">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Chrome className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold font-display text-white">Browser History Scanner</h1>
          </div>
          <p className="text-muted-foreground font-mono text-sm">
            Export your browser history, upload it here, and SentinelX will identify every insecure or risky site you've visited.
          </p>
        </div>

        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-primary/70 font-mono text-xs">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Your history file is processed entirely in your browser — it is never stored on our servers. Only the URLs you choose to scan are sent to the analysis engine.</span>
        </div>

        {showInstructions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {STEPS.map(s => (
              <div key={s.id} className="bg-black/30 rounded-xl border border-white/8 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <p className="font-bold text-sm text-white">{s.label}</p>
                </div>
                <ol className="space-y-1.5">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 font-mono text-[11px] text-white/50">
                      <span className="text-white/20 shrink-0">{i + 1}.</span>{step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl py-12 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/25 bg-white/2"}`}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-white/30" />
            <p className="text-white/60 font-mono text-sm mb-1">Drop your browser history file here</p>
            <p className="text-white/25 font-mono text-xs">Accepts JSON (Chrome/Firefox export), TXT, CSV</p>
            <input ref={fileRef} type="file" accept=".json,.txt,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {entries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-black/40 rounded-xl border border-primary/20 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <Globe2 className="w-4 h-4 text-primary" />
                  <span className="text-white">{entries.length} URLs detected from your history</span>
                </div>
                <Button onClick={startScan} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <Play className="w-4 h-4" />Scan All
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {entries.slice(0, 30).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-xs text-white/40 hover:text-white/60 transition-colors">
                    <Globe2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{e.domain}</span>
                  </div>
                ))}
                {entries.length > 30 && <p className="text-white/20 text-[10px] font-mono">+{entries.length - 30} more</p>}
              </div>
            </motion.div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/8" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-white/25 text-xs font-mono">or paste URLs manually</span></div>
          </div>

          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder={"Paste browser history URLs here — one per line:\nhttps://site1.com\nhttps://site2.ru\nhttps://..."}
            rows={6}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 resize-none"
          />

          {pasteText.trim() && (
            <Button onClick={handlePaste} variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" />Process Pasted URLs
            </Button>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
