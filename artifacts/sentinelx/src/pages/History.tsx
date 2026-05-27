import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, QrCode, Link2, Shield, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface ScanEntry {
  id: number;
  type: "url" | "qr";
  target: string;
  score: number;
  hasSSL: boolean;
  createdAt: string;
}

interface Stats {
  urlsAnalyzed: number;
  qrScanned: number;
  communityReports: number;
  highRiskDetected: number;
  avgThreatScore: number;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-destructive";
  if (score >= 35) return "text-yellow-500";
  return "text-emerald-500";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-destructive/10 border-destructive/30";
  if (score >= 35) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-emerald-500/10 border-emerald-500/30";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ScanHistory() {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [scanRes, statsRes] = await Promise.all([
        fetch("/api/history"),
        fetch("/api/stats"),
      ]);
      if (scanRes.ok) setScans(await scanRes.json() as ScanEntry[]);
      if (statsRes.ok) setStats(await statsRes.json() as Stats);
    } catch {
      toast({ title: "Failed to load history", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <Sidebar>
      <div className="p-8 pb-20 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
              <History className="w-8 h-8 text-primary" /> Scan History
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">All URL and QR analyses stored in the database.</p>
          </div>
          <Button data-testid="button-refresh-history" variant="outline" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "URLs Analyzed", value: stats.urlsAnalyzed, icon: Link2, color: "text-primary" },
              { label: "QR Scans", value: stats.qrScanned, icon: QrCode, color: "text-secondary" },
              { label: "High Risk Found", value: stats.highRiskDetected, icon: AlertTriangle, color: "text-destructive" },
              { label: "Community Reports", value: stats.communityReports, icon: Shield, color: "text-emerald-500" },
              { label: "Avg Threat Score", value: `${stats.avgThreatScore}/100`, icon: History, color: "text-yellow-500" },
            ].map((s, i) => (
              <Card key={i} className="bg-card/40 border-white/10 p-4">
                <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">{s.label}</p>
              </Card>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="font-mono text-sm">Loading scan history...</p>
          </div>
        ) : scans.length === 0 ? (
          <Card className="bg-card/40 border-white/10 p-16 text-center">
            <History className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-xl font-bold font-display text-white mb-2">No scans yet</h3>
            <p className="text-muted-foreground text-sm mb-6 font-mono">Run your first URL or QR analysis to start building history.</p>
            <div className="flex gap-4 justify-center">
              <Button asChild className="bg-primary text-primary-foreground">
                <Link href="/sandbox">Analyze a URL</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/qr">Scan a QR Code</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <Card key={`${scan.type}-${scan.id}`} data-testid={`card-scan-${scan.type}-${scan.id}`}
                className="bg-card/40 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg border ${scoreBg(scan.score)} shrink-0`}>
                    {scan.type === "qr"
                      ? <QrCode className={`w-5 h-5 ${scoreColor(scan.score)}`} />
                      : <Link2 className={`w-5 h-5 ${scoreColor(scan.score)}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-white truncate">{scan.target}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded">
                        {scan.type === "qr" ? "QR Scan" : "URL Scan"}
                      </span>
                      {scan.hasSSL
                        ? <span className="text-xs font-mono text-emerald-500 flex items-center gap-1"><Shield className="w-3 h-3" /> SSL</span>
                        : <span className="text-xs font-mono text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No SSL</span>}
                      <span className="text-xs font-mono text-muted-foreground">{timeAgo(scan.createdAt)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-2xl font-bold font-mono ${scoreColor(scan.score)}`}>{scan.score}</p>
                    <p className="text-xs text-muted-foreground font-mono">/ 100</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Sidebar>
  );
}
