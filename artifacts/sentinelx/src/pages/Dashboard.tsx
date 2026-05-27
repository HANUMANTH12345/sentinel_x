import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ShieldAlert, Zap, Target, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { useThreatLevel } from "@/contexts/ThreatLevelContext";

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

export default function Dashboard() {
  const [trafficData, setTrafficData] = useState(Array.from({length: 20}, (_, i) => ({ time: i, value: Math.floor(Math.random() * 1000) })));
  const { setThreatLevel } = useThreatLevel();
  
  useEffect(() => {
    setThreatLevel(2);
    const interval = setInterval(() => {
      setTrafficData(prev => {
        const newData = [...prev.slice(1), { time: prev[prev.length-1].time + 1, value: Math.floor(Math.random() * 1000) }];
        return newData;
      });
    }, 3000);
    return () => { clearInterval(interval); setThreatLevel(0); };
  }, [setThreatLevel]);

  const pieData = [
    { name: 'Critical', value: 400 },
    { name: 'High', value: 300 },
    { name: 'Medium', value: 300 },
    { name: 'Low', value: 200 },
  ];

  return (
    <Sidebar>
      <div className="p-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-white">Live Threat Operations</h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">NOC Dashboard / View: Global</p>
          </div>
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            <Download className="w-4 h-4 mr-2" /> Export Logs
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Threats", value: "1,248", icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Blocked Today", value: "34,921", icon: Target, color: "text-primary", bg: "bg-primary/10" },
            { label: "Avg Response", value: "12ms", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
            { label: "Threat Index", value: "84.2", icon: Activity, color: "text-secondary", bg: "bg-secondary/10" },
          ].map((stat, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-sm border-white/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold font-mono">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Live Network Traffic
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis stroke="#666" fontSize={12} tickFormatter={(val) => `${val}mb`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-display">Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-display">Active Malicious Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 font-mono">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">IP Address</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Threat Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3 rounded-tr-lg">Last Active</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white">192.168.{Math.floor(Math.random()*255)}.{Math.floor(Math.random()*255)}</td>
                      <td className="px-4 py-3">🇷🇺 RU</td>
                      <td className="px-4 py-3">C2 Beacon</td>
                      <td className="px-4 py-3"><span className="text-destructive font-bold">CRITICAL</span></td>
                      <td className="px-4 py-3 text-muted-foreground">Just now</td>
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