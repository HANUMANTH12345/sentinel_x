import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, Share2, Search, Clock, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: number;
  title: string;
  reporter: string;
  type: string;
  domain: string;
  description: string;
  status: string;
  votes: number;
  commentsCount: number;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  Verified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  Investigating: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  pending: "bg-blue-500/10 text-blue-500 border-blue-500/30",
};

export default function Community() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({ title: "", reporter: "", type: "", domain: "", description: "" });
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json() as Report[];
      setReports(data);
    } catch {
      toast({ title: "Failed to load reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleVote = async (id: number, direction: "up" | "down") => {
    const res = await fetch(`/api/reports/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    if (res.ok) {
      const { votes } = await res.json() as { votes: number };
      setReports(reports.map((r) => r.id === id ? { ...r, votes } : r));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.type || !form.domain || !form.description) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitSuccess(true);
      setTimeout(() => {
        setDialogOpen(false);
        setSubmitSuccess(false);
        setForm({ title: "", reporter: "", type: "", domain: "", description: "" });
        fetchReports();
      }, 1500);
    } catch {
      toast({ title: "Failed to submit report", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = reports.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.domain.toLowerCase().includes(search.toLowerCase()) ||
    r.type.toLowerCase().includes(search.toLowerCase())
  );

  // Derive trending IOCs from actual reports
  const trendingDomains = [...reports]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)
    .map((r) => ({ d: r.domain, c: r.votes }));

  const categoryMap: Record<string, number> = {};
  for (const r of reports) { categoryMap[r.type] = (categoryMap[r.type] ?? 0) + 1; }
  const topCategories = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, count]) => ({ name, pct: Math.round((count / Math.max(reports.length, 1)) * 100) }));

  return (
    <Sidebar>
      <div className="p-8 pb-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" /> Community Reports
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">Crowdsourced threat intelligence — all reports stored in the database.</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-submit-report" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                Submit Report
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-white">Submit Threat Report</DialogTitle>
              </DialogHeader>
              {submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  <p className="text-white font-bold font-display text-lg">Report Submitted</p>
                  <p className="text-muted-foreground text-sm">Your report has been saved and is pending review.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Title *</label>
                    <Input data-testid="input-report-title" placeholder="Brief description of the threat" className="bg-black/50 border-white/10"
                      value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Your Handle (optional)</label>
                    <Input data-testid="input-report-reporter" placeholder="anonymous" className="bg-black/50 border-white/10"
                      value={form.reporter} onChange={(e) => setForm({ ...form, reporter: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Domain / IP *</label>
                      <Input data-testid="input-report-domain" placeholder="e.g., malicious-site.com" className="bg-black/50 border-white/10"
                        value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Threat Type *</label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                        <SelectTrigger data-testid="select-report-type" className="bg-black/50 border-white/10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phishing">Phishing</SelectItem>
                          <SelectItem value="Malware">Malware</SelectItem>
                          <SelectItem value="Scam">Scam / Fraud</SelectItem>
                          <SelectItem value="Botnet">Botnet Activity</SelectItem>
                          <SelectItem value="Smishing">Smishing / SMS</SelectItem>
                          <SelectItem value="QR Scam">QR Code Scam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Description & Evidence *</label>
                    <Textarea data-testid="input-report-description" placeholder="Provide detailed analysis, IOCs, or behavioral descriptions..."
                      className="h-32 bg-black/50 border-white/10" value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <Button data-testid="button-submit-report-form" type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground">
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit for Verification"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input data-testid="input-search-reports" placeholder="Search by title, domain, or type..." className="pl-10 bg-card/50 border-white/10 font-mono"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={fetchReports} data-testid="button-refresh-reports">Refresh</Button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="font-mono text-sm">Loading reports from database...</p>
              </div>
            ) : filtered.length === 0 ? (
              <Card className="bg-card/40 border-white/10 p-12 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto opacity-20 mb-4" />
                <p className="font-mono">{search ? "No reports match your search." : "No reports yet. Be the first to submit one."}</p>
              </Card>
            ) : (
              filtered.map((report) => (
                <Card key={report.id} data-testid={`card-report-${report.id}`} className="bg-card/40 border-white/10 hover:border-primary/30 transition-colors">
                  <CardContent className="p-0 flex">
                    <div className="w-16 bg-black/40 flex flex-col items-center justify-start py-4 border-r border-white/5 shrink-0">
                      <Button data-testid={`button-upvote-${report.id}`} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleVote(report.id, "up")}>
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <span className="font-mono font-bold my-1 text-sm">{report.votes}</span>
                      <Button data-testid={`button-downvote-${report.id}`} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleVote(report.id, "down")}>
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-6 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 uppercase">{report.type}</span>
                        <span className="text-xs text-muted-foreground font-mono">by <span className="text-white">@{report.reporter}</span></span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono"><Clock className="w-3 h-3" /> {timeAgo(report.createdAt)}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${STATUS_COLORS[report.status] ?? STATUS_COLORS.pending}`}>
                          {report.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold font-display text-white mb-2">{report.title}</h3>
                      <div className="inline-block mb-3 px-3 py-1 rounded bg-black/50 border border-white/5 font-mono text-xs text-muted-foreground">
                        IOC: <span className="text-white">{report.domain}</span>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{report.description}</p>
                      <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
                        <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-white"><MessageSquare className="w-4 h-4 mr-2" /> {report.commentsCount} Comments</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-white"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-white"><AlertCircle className="w-4 h-4 mr-2" /> Report</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card/40 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display uppercase tracking-wider text-primary">Top Reported IOCs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                {trendingDomains.length === 0
                  ? <p className="text-muted-foreground text-xs">No reports yet</p>
                  : trendingDomains.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-black/40 border border-white/5">
                      <span className="truncate text-white pr-2 text-xs">{item.d}</span>
                      <span className="text-secondary shrink-0 text-xs">{item.c} votes</span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display uppercase tracking-wider text-secondary">Top Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCategories.length === 0
                  ? <p className="text-muted-foreground text-xs font-mono">No data yet</p>
                  : topCategories.map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white">{cat.name}</span>
                        <span className="text-muted-foreground">{cat.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${cat.pct}%` }} />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-white/10 p-4">
              <p className="text-xs font-mono text-muted-foreground uppercase font-bold mb-2">Total Reports</p>
              <p className="text-4xl font-bold font-display text-primary">{reports.length}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">stored in database</p>
            </Card>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
