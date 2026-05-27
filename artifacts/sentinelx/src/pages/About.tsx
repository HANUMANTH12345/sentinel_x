import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, BrainCircuit, Network, Lock, Zap, Server } from "lucide-react";
import { SiReact, SiNodedotjs, SiPython, SiTensorflow, SiPostgresql, SiRedis, SiDocker, SiKubernetes } from "react-icons/si";

export default function About() {
  return (
    <Sidebar>
      <div className="p-8 pb-20 max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-4">About SentinelX</h1>
          <p className="text-xl text-muted-foreground font-mono">Next-Generation Cyber Defense Architecture</p>
        </div>

        <section className="mb-16">
          <Card className="bg-card/40 border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <CardContent className="p-8 md:p-12 text-center relative z-10">
              <h2 className="text-2xl font-bold font-display text-white mb-6">The Problem</h2>
              <div className="text-6xl md:text-8xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 drop-shadow-[0_0_15px_rgba(0,245,255,0.5)] mb-4">
                3.4B+
              </div>
              <p className="text-lg text-primary font-mono uppercase tracking-widest font-bold mb-6">Phishing Emails Sent Daily</p>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Traditional signature-based detection is failing. Threat actors use AI to generate polymorphic payloads and zero-day phishing campaigns that bypass standard email gateways and browser filters.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "$4.8B", desc: "Annual losses to phishing", icon: Shield },
            { title: "27 Days", desc: "Average time to discover a breach", icon: Clock => <BrainCircuit {...Clock} /> },
            { title: "90%", desc: "Attacks start with phishing", icon: Network }
          ].map((item, i) => (
            <Card key={i} className="bg-card/30 border-white/10 text-center hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <item.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white font-mono mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm uppercase tracking-wider">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold font-display text-white mb-8 border-b border-border pb-4">Architecture & Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10 -translate-y-1/2 z-0" />
            {[
              { step: 1, title: "Ingestion", desc: "URLs and payloads enter the proxy layer." },
              { step: 2, title: "Detonation", desc: "Execution in isolated microVMs." },
              { step: 3, title: "AI Analysis", desc: "Behavior scored by neural networks." },
              { step: 4, title: "Action", desc: "Blocked or allowed via firewall policies." }
            ].map((s, i) => (
              <div key={i} className="bg-black/80 border border-primary/30 p-6 rounded-xl relative z-10 flex flex-col items-center text-center shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-mono mb-4 shadow-[0_0_10px_rgba(0,245,255,0.5)]">
                  {s.step}
                </div>
                <h4 className="font-bold text-white mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold font-display text-white mb-8 border-b border-border pb-4">Core Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: SiReact, name: "React", color: "#61DAFB" },
              { icon: SiNodedotjs, name: "Node.js", color: "#339933" },
              { icon: SiPython, name: "Python", color: "#3776AB" },
              { icon: SiTensorflow, name: "TensorFlow", color: "#FF6F00" },
              { icon: SiPostgresql, name: "PostgreSQL", color: "#4169E1" },
              { icon: SiRedis, name: "Redis", color: "#DC382D" },
              { icon: SiDocker, name: "Docker", color: "#2496ED" },
              { icon: SiKubernetes, name: "Kubernetes", color: "#326CE5" },
            ].map((tech, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-6 bg-card/20 border border-white/5 rounded-xl hover:bg-card/40 transition-all group">
                <tech.icon className="w-12 h-12 mb-3 text-muted-foreground group-hover:scale-110 transition-transform duration-300" style={{ color: "var(--hover-color)" }} />
                <span className="font-mono text-sm text-white group-hover:text-primary transition-colors">{tech.name}</span>
                <style>{`.group:hover svg { color: ${tech.color} !important; drop-shadow: 0 0 10px ${tech.color}; }`}</style>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold font-display text-white mb-8 border-b border-border pb-4">Future Scope & Research</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Autonomous Remediation", desc: "Automated playbooks that isolate compromised endpoints without human intervention." },
              { title: "Deepfake Audio Detection", desc: "Real-time analysis of voice streams to prevent vishing and executive impersonation." },
              { title: "Zero-Knowledge Sharing", desc: "Share threat intelligence across organizations without revealing PII." },
              { title: "Quantum-Safe Encryption", desc: "Upgrading internal data stores to resist future cryptographic breaks." }
            ].map((f, i) => (
              <Card key={i} className="bg-card/30 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg font-display text-primary">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Sidebar>
  );
}