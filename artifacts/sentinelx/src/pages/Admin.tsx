import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ScanLine, Webhook, Activity } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";

const PIE_COLORS = ['#00f5ff', '#7c3aed', '#ef4444', '#eab308'];

const RADAR_DATA = [
  { subject: 'Phishing', A: 98, fullMark: 100 },
  { subject: 'Malware', A: 95, fullMark: 100 },
  { subject: 'Botnet', A: 88, fullMark: 100 },
  { subject: 'Ransomware', A: 92, fullMark: 100 },
  { subject: 'DDoS', A: 85, fullMark: 100 },
  { subject: 'SQLi', A: 99, fullMark: 100 },
];

export default function Admin() {
  return (
    <Sidebar>
      <div className="p-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white">Admin Analytics</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Platform performance and system health.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: "12,847", change: "+12%", icon: Users },
            { label: "Scans Today", value: "34,291", change: "+5.2%", icon: ScanLine },
            { label: "API Calls", value: "891K", change: "+18%", icon: Webhook },
            { label: "Accuracy Rate", value: "97.3%", change: "+0.4%", icon: Activity },
          ].map((stat, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-sm border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                    {stat.change}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold font-display text-white mb-1">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-card/40 border-white/10">
            <CardHeader>
              <CardTitle className="font-display">User Growth (12 Months)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { m: 'Jan', v: 4000 }, { m: 'Feb', v: 4500 }, { m: 'Mar', v: 5200 }, { m: 'Apr', v: 6800 },
                  { m: 'May', v: 7400 }, { m: 'Jun', v: 8100 }, { m: 'Jul', v: 9500 }, { m: 'Aug', v: 10200 },
                  { m: 'Sep', v: 11500 }, { m: 'Oct', v: 12100 }, { m: 'Nov', v: 12500 }, { m: 'Dec', v: 12847 }
                ]}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="m" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                  <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/10">
            <CardHeader>
              <CardTitle className="font-display">API Usage by Endpoint</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: '/v1/scan', val: 450000 },
                  { name: '/v1/intel', val: 280000 },
                  { name: '/v1/qr', val: 120000 },
                  { name: '/v1/report', val: 41000 }
                ]} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#666" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#ccc" fontSize={12} />
                  <RechartsTooltip cursor={{fill: '#222'}} contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                  <Bar dataKey="val" fill="hsl(var(--secondary))" radius={[0,4,4,0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-1 bg-card/40 border-white/10">
            <CardHeader>
              <CardTitle className="font-display">Detection Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RADAR_DATA}>
                  <PolarGrid stroke="#444" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#ccc', fontSize: 10, fontFamily: 'monospace' }} />
                  <Radar name="Accuracy" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-card/40 border-white/10 flex flex-col">
            <CardHeader>
              <CardTitle className="font-display">Server Health Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center gap-6">
              {[
                { label: "CPU Usage", val: "23%", status: "healthy", pct: 23 },
                { label: "Memory", val: "67%", status: "warning", pct: 67 },
                { label: "DB Latency", val: "12ms", status: "healthy", pct: 15 },
                { label: "Uptime", val: "99.97%", status: "healthy", pct: 99 }
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-mono text-muted-foreground uppercase">{m.label}</div>
                  <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full ${m.status === 'healthy' ? 'bg-primary' : 'bg-yellow-500'}`} 
                      style={{ width: `${m.pct}%` }} 
                    />
                  </div>
                  <div className="w-16 text-right font-mono font-bold text-white">{m.val}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/40 border-white/10">
          <CardHeader>
            <CardTitle className="font-display">System Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-black/40 font-mono">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">User/System</th>
                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {[
                    { t: "10:42:05", a: "Model Weights Updated", u: "System", s: "Success" },
                    { t: "10:35:12", a: "API Rate Limit Exceeded", u: "org_49281", s: "Blocked" },
                    { t: "10:15:00", a: "Manual Threat Override", u: "admin_sarah", s: "Success" },
                    { t: "09:55:33", a: "Database Backup", u: "System", s: "Success" },
                    { t: "09:20:11", a: "Failed Login Attempt", u: "admin_david", s: "Warning" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-white/5">
                      <td className="px-4 py-3 text-muted-foreground">{row.t}</td>
                      <td className="px-4 py-3 text-white">{row.a}</td>
                      <td className="px-4 py-3 text-primary">{row.u}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${
                          row.s === 'Success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                          row.s === 'Warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                          'bg-destructive/10 text-destructive border-destructive/30'
                        }`}>
                          {row.s}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}