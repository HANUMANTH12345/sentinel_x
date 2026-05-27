import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Globe, Activity, Network } from "lucide-react";
import { Input } from "@/components/ui/input";

const DOMAINS = [
  { d: "auth-update-required-now.com", cat: "Phishing", sev: "Critical", status: "Active" },
  { d: "free-netflix-movies-hd.ru", cat: "Malware", sev: "High", status: "Blocked" },
  { d: "support-apple-device-check.net", cat: "Phishing", sev: "Critical", status: "Active" },
  { d: "crypto-wallet-connect-dapp.io", cat: "Scam", sev: "High", status: "Active" },
  { d: "delivery-package-track-dhl.com", cat: "Phishing", sev: "Medium", status: "Monitoring" },
];

export default function Intelligence() {
  return (
    <Sidebar>
      <div className="p-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" /> Threat Intelligence Center
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Global repository of known malicious indicators.</p>
        </div>

        <div className="relative mb-8 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search domains, IPs, hashes, or campaigns..."
            className="pl-10 h-12 bg-card/50 border-white/10 font-mono"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 bg-card/40 border-white/10">
            <CardHeader>
              <CardTitle className="font-display">Recent Malicious Domains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/40 font-mono">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Domain</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3 rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {DOMAINS.map((d, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{d.d}</td>
                        <td className="px-4 py-3">{d.cat}</td>
                        <td className="px-4 py-3">
                          <span className={d.sev === 'Critical' ? 'text-destructive' : d.sev === 'High' ? 'text-orange-500' : 'text-yellow-500'}>
                            {d.sev}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{d.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card/40 border-white/10">
              <CardHeader>
                <CardTitle className="font-display text-sm text-muted-foreground uppercase tracking-wider">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { n: "Operation Emotet Return", t: "Financial", d: 142 },
                  { n: "Fake Streaming Phish", t: "Consumers", d: 84 },
                  { n: "Crypto Drainer X", t: "Web3", d: 215 },
                ].map((c, i) => (
                  <div key={i} className="p-3 bg-black/30 rounded border border-white/5">
                    <h4 className="font-bold text-primary mb-1">{c.n}</h4>
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>Target: {c.t}</span>
                      <span>{c.d} IOCs</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card className="bg-card/40 border-white/10 overflow-hidden relative min-h-[400px]">
          <div className="absolute top-4 left-4 z-10">
            <CardTitle className="font-display flex items-center gap-2"><Network className="w-5 h-5 text-secondary" /> Attack Relationship Graph</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Simulated Threat Cluster</p>
          </div>
          {/* FAKE GRAPH VISUALIZATION */}
          <div className="absolute inset-0 flex items-center justify-center opacity-50">
            <svg width="100%" height="100%">
               <path d="M 300 200 Q 400 100 500 200 T 700 200" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="5,5" className="animate-pulse" />
               <path d="M 500 200 L 450 350 L 600 300 Z" stroke="hsl(var(--destructive))" strokeWidth="1" fill="none" />
               <circle cx="300" cy="200" r="8" fill="hsl(var(--primary))" />
               <circle cx="500" cy="200" r="15" fill="hsl(var(--destructive))" />
               <circle cx="700" cy="200" r="8" fill="hsl(var(--secondary))" />
               <circle cx="450" cy="350" r="6" fill="hsl(var(--muted-foreground))" />
               <circle cx="600" cy="300" r="10" fill="hsl(var(--primary))" />
               
               <text x="500" y="175" fill="white" fontSize="12" textAnchor="middle" className="font-mono">C2 Server</text>
               <text x="300" y="180" fill="white" fontSize="10" textAnchor="middle" className="font-mono">Payload</text>
            </svg>
          </div>
        </Card>
      </div>
    </Sidebar>
  );
}