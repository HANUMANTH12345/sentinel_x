import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";


interface ThreatIntelData {
  totalUrlScans: number;
  totalQrScans: number;
  highRiskThreats: number;
  countriesDetected: number;
  topDomains: {
    url: string;
    score: number;
    country: string | null;
  }[];
  recentThreats: {
    url: string;
    score: number;
    country: string | null;
    createdAt: string;
  }[];
  countryStats: {
    country: string;
    count: number;
  }[];
}


function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();

  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) return `${hrs}h ago`;

  return `${Math.floor(hrs / 24)}d ago`;
}
export default function Intelligence() {

  const [data, setData] = useState<ThreatIntelData | null>(null);

useEffect(() => {
  const load = async () => {
    try {
      const res = await fetch("/api/threat-intel");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  load();

  const interval = setInterval(load, 30000);

  return () => clearInterval(interval);
}, []);
  return (
    <Sidebar>
      <div className="p-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" /> Threat Intelligence Center 
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Global repository of known malicious indicators.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
  <Card className="bg-card/40 border-white/10 p-4">
    <p className="text-2xl font-bold">{data?.totalUrlScans ?? 0}</p>
    <p className="text-xs text-muted-foreground">URL Scans</p>
  </Card>

  <Card className="bg-card/40 border-white/10 p-4">
    <p className="text-2xl font-bold">{data?.totalQrScans ?? 0}</p>
    <p className="text-xs text-muted-foreground">QR Scans</p>
  </Card>

  <Card className="bg-card/40 border-white/10 p-4">
    <p className="text-2xl font-bold">{data?.highRiskThreats ?? 0}</p>
    <p className="text-xs text-muted-foreground">High Risk Threats</p>
  </Card>

  <Card className="bg-card/40 border-white/10 p-4">
    <p className="text-2xl font-bold">{data?.countriesDetected ?? 0}</p>
    <p className="text-xs text-muted-foreground">Countries</p>
  </Card>
</div>
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
                      <th className="px-4 py-3 rounded-tr-lg">Country</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
  {data?.topDomains?.map((d, i) => (
    <tr key={i} className="border-b border-border/50 hover:bg-white/5">
      <td className="px-4 py-3 text-white font-mono text-xs">
  {d.url}
</td>

      <td className="px-4 py-3">
        {d.score >= 70
          ? "Phishing"
          : d.score >= 40
          ? "Suspicious"
          : "Low Risk"}
      </td>

   <td className="px-4 py-3">
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold ${
      d.score >= 70
        ? "bg-red-500/20 text-red-400"
        : d.score >= 40
        ? "bg-orange-500/20 text-orange-400"
        : "bg-emerald-500/20 text-emerald-400"
    }`}
  >
    {d.score >= 70
      ? "Critical"
      : d.score >= 40
      ? "High"
      : "Low"}
  </span>
</td>

      <td className="px-4 py-3 text-muted-foreground">
        {d.country ?? "Unknown"}
      </td>
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
      <CardTitle className="font-display">
  Recent Threats
</CardTitle>
    </CardHeader>

    <CardContent className="space-y-3">
     {data?.recentThreats?.slice(0, 5).map((t, i) => (
        <div
          key={i}
          className="p-3 rounded border border-white/10"
        >
          <p className="text-sm text-white truncate">
            {t.url}
          </p>

          <div className="flex justify-between mt-2 text-xs">
            <span
  className={`px-2 py-1 rounded text-xs ${
    t.score >= 70
      ? "bg-red-500/20 text-red-400"
      : t.score >= 40
      ? "bg-orange-500/20 text-orange-400"
      : "bg-emerald-500/20 text-emerald-400"
  }`}
>
  Score: {t.score}
</span>
            <span className="text-muted-foreground">
  {timeAgo(t.createdAt)}
</span>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
<Card className="bg-card/40 border-white/10 mt-6">
  <CardHeader>
    <CardTitle className="font-display">
      Latest Threat Activity
    </CardTitle>
  </CardHeader>

  <CardContent className="space-y-3">
    {data?.recentThreats?.slice(0, 6).map((t, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-3 rounded border border-white/10"
      >
        <div className="min-w-0">
          <p className="text-sm text-white truncate">
            {t.url}
          </p>

          <p className="text-xs text-muted-foreground">
            {timeAgo(t.createdAt)}
          </p>
        </div>

        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            t.score >= 70
              ? "bg-red-500/20 text-red-400"
              : t.score >= 40
              ? "bg-orange-500/20 text-orange-400"
              : "bg-emerald-500/20 text-emerald-400"
          }`}
        >
          {t.score >= 70
            ? "CRITICAL"
            : t.score >= 40
            ? "HIGH"
            : "LOW"}
        </span>
      </div>
    ))}
  </CardContent>
</Card>

</div>
          
        </div>
        <Card className="bg-card/40 border-white/10">
  <CardHeader>
    <CardTitle className="font-display">
  Threat Origin Countries
</CardTitle>
  </CardHeader>

  <CardContent>
    <div className="space-y-4">
      {data?.countryStats?.map((c, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span className="font-medium">
  {c.country}
</span>
           <span className="text-primary font-mono">
  {c.count} threats
</span>
          </div>

          <div className="w-full h-2 bg-black/40 rounded">
           <div
  className={`h-2 rounded ${
    c.count >= 5
      ? "bg-red-500"
      : c.count >= 2
      ? "bg-orange-500"
      : "bg-primary"
  }`}
  style={{
    width: `${Math.min(c.count * 30, 100)}%`
  }}
/>
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
        
      </div>
    </Sidebar>
  );
}