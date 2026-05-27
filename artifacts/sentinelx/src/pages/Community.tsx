import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, Share2, Search, Clock, Shield } from "lucide-react";
import { useState } from "react";

const INITIAL_REPORTS = [
  { id: 1, title: "New sophisticated Netflix billing scam", reporter: "cybernaut_99", type: "Phishing", domain: "netflix-billing-update-secure.com", time: "2h ago", desc: "Found this one bypassing standard filters. Uses a clever iframe injection technique on the payment page to steal CC details. Beware.", status: "Verified", votes: 243, comments: 45 },
  { id: 2, title: "Malicious npm package impersonating 'react-dom'", reporter: "pkg_hunter", type: "Malware", domain: "npmjs.com/react-dom-secure", time: "5h ago", desc: "A typosquatting package that attempts to run a postinstall script to exfiltrate env vars. Do not install.", status: "Investigating", votes: 189, comments: 22 },
  { id: 3, title: "Massive credential stuffing attack from botnet", reporter: "net_admin", type: "Botnet", domain: "Multiple IPs", time: "8h ago", desc: "Seeing massive spikes in failed login attempts across our infrastructure originating from residential proxies.", status: "Pending", votes: 112, comments: 18 },
  { id: 4, title: "Fake DHL tracking SMS campaign", reporter: "sms_watcher", type: "Smishing", domain: "dhl-track-package-7482.ru", time: "12h ago", desc: "Users receiving SMS about a missed delivery. Link leads to a fake login page asking for Apple ID credentials.", status: "Verified", votes: 304, comments: 56 },
];

export default function Community() {
  const [reports, setReports] = useState(INITIAL_REPORTS);

  const handleVote = (id: number, increment: number) => {
    setReports(reports.map(r => r.id === id ? { ...r, votes: r.votes + increment } : r));
  };

  return (
    <Sidebar>
      <div className="p-8 pb-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" /> Community Reports
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">Crowdsourced threat intelligence and analysis.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                Submit Report
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-white">Submit Threat Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Title</label>
                  <Input placeholder="Brief description of the threat" className="bg-black/50 border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Domain / IP</label>
                    <Input placeholder="e.g., malicious-site.com" className="bg-black/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Threat Type</label>
                    <Select>
                      <SelectTrigger className="bg-black/50 border-white/10">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phishing">Phishing</SelectItem>
                        <SelectItem value="malware">Malware</SelectItem>
                        <SelectItem value="scam">Scam / Fraud</SelectItem>
                        <SelectItem value="botnet">Botnet Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Description & Evidence</label>
                  <Textarea placeholder="Provide detailed analysis, IOCs, or behavioral descriptions..." className="h-32 bg-black/50 border-white/10" />
                </div>
                <Button className="w-full bg-primary text-primary-foreground">Submit for Verification</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search reports..." className="pl-10 bg-card/50 border-white/10 font-mono" />
              </div>
              <Select defaultValue="trending">
                <SelectTrigger className="w-[150px] bg-card/50 border-white/10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="top">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reports.map((report) => (
              <Card key={report.id} className="bg-card/40 border-white/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-0 flex">
                  <div className="w-16 bg-black/40 flex flex-col items-center justify-start py-4 border-r border-white/5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleVote(report.id, 1)}>
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <span className="font-mono font-bold my-1 text-sm">{report.votes}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleVote(report.id, -1)}>
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 uppercase">
                        {report.type}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        Posted by <span className="text-white">@{report.reporter}</span>
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {report.time}
                      </span>
                      <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        report.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                        report.status === 'Investigating' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/30'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-white mb-2">{report.title}</h3>
                    <div className="inline-block mb-3 px-3 py-1 rounded bg-black/50 border border-white/5 font-mono text-xs text-muted-foreground">
                      IOC: <span className="text-white">{report.domain}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {report.desc}
                    </p>
                    <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
                      <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-white">
                        <MessageSquare className="w-4 h-4 mr-2" /> {report.comments} Comments
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-white">
                        <Share2 className="w-4 h-4 mr-2" /> Share
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-white">
                        <AlertCircle className="w-4 h-4 mr-2" /> Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="bg-card/40 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display uppercase tracking-wider text-primary">Trending IOCs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                {[
                  { d: "netflix-billing-update.com", c: 142 },
                  { d: "apple-id-verify-alert.net", c: 98 },
                  { d: "dhl-track-package.ru", c: 87 },
                  { d: "paypal-secure-auth.com", c: 65 },
                  { d: "meta-business-support.io", c: 54 },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded bg-black/40 border border-white/5">
                    <span className="truncate text-white pr-2">{item.d}</span>
                    <span className="text-secondary shrink-0">{item.c} rep</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display uppercase tracking-wider text-secondary">Top Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Phishing", pct: 65, color: "bg-destructive" },
                  { name: "Malware", pct: 20, color: "bg-orange-500" },
                  { name: "Scam", pct: 10, color: "bg-yellow-500" },
                  { name: "Botnet", pct: 5, color: "bg-primary" },
                ].map((cat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white">{cat.name}</span>
                      <span className="text-muted-foreground">{cat.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}