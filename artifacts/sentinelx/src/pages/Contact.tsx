import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Bug, Lightbulb, CheckCircle2, Shield, Loader2 } from "lucide-react";
import { SiGithub, SiDiscord, SiX } from "react-icons/si";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "feedback", message: "" });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      setIsSuccess(true);
      setForm({ name: "", email: "", subject: "feedback", message: "" });
      setTimeout(() => setIsSuccess(false), 6000);
    } catch {
      toast({ title: "Failed to send message. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sidebar>
      <div className="p-8 pb-20 max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold font-display text-white">Contact & Feedback</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Connect with the SentinelX security team. All messages are stored securely.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 relative">
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-card/90 backdrop-blur-md border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold font-display text-white mb-2">Message Transmitted</h3>
                  <p className="text-muted-foreground">Your message has been saved. Our team will respond shortly.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="bg-card/40 border-white/10 relative overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <CardHeader>
                <CardTitle className="font-display">Secure Communication Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white font-mono uppercase tracking-wider">Operator Name *</label>
                      <Input data-testid="input-contact-name" required placeholder="John Doe"
                        className="bg-black/50 border-white/10 focus-visible:border-primary"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white font-mono uppercase tracking-wider">Email Address *</label>
                      <Input data-testid="input-contact-email" required type="email" placeholder="john@example.com"
                        className="bg-black/50 border-white/10 focus-visible:border-primary"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white font-mono uppercase tracking-wider">Subject Classification</label>
                    <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                      <SelectTrigger data-testid="select-contact-subject" className="bg-black/50 border-white/10 focus-visible:border-primary">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feedback"><div className="flex items-center"><MessageSquare className="w-4 h-4 mr-2" /> General Feedback</div></SelectItem>
                        <SelectItem value="bug"><div className="flex items-center"><Bug className="w-4 h-4 mr-2" /> Bug Report</div></SelectItem>
                        <SelectItem value="feature"><div className="flex items-center"><Lightbulb className="w-4 h-4 mr-2" /> Feature Request</div></SelectItem>
                        <SelectItem value="partner"><div className="flex items-center"><Shield className="w-4 h-4 mr-2" /> Partnership Inquiry</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white font-mono uppercase tracking-wider">Message *</label>
                    <Textarea data-testid="input-contact-message" required placeholder="Enter message details here..."
                      className="h-40 bg-black/50 border-white/10 focus-visible:border-primary"
                      value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>

                  <Button data-testid="button-contact-submit" type="submit" disabled={isSubmitting}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold font-mono uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transmitting...</>
                      : "Transmit Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/40 border-white/10 hover:border-primary/50 transition-colors group cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-black/50 rounded-xl border border-white/10 group-hover:border-primary/50 transition-colors">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white font-display">Email Us</h4>
                  <p className="text-sm text-muted-foreground font-mono mt-1">soc@sentinelx.dev</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-white/10 hover:border-[#5865F2]/50 transition-colors group cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-black/50 rounded-xl border border-white/10 group-hover:border-[#5865F2]/50 transition-colors">
                  <SiDiscord className="w-6 h-6 text-[#5865F2]" />
                </div>
                <div>
                  <h4 className="font-bold text-white font-display">Discord Community</h4>
                  <p className="text-sm text-muted-foreground font-mono mt-1">discord.gg/sentinelx</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-white/10 hover:border-white/50 transition-colors group cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-black/50 rounded-xl border border-white/10 group-hover:border-white/50 transition-colors">
                  <SiGithub className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white font-display">Open Source</h4>
                  <p className="text-sm text-muted-foreground font-mono mt-1">github.com/sentinelx</p>
                </div>
              </CardContent>
            </Card>

            <div className="pt-6 border-t border-border flex justify-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10"><SiX className="w-5 h-5 text-white" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10"><SiGithub className="w-5 h-5 text-white" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10"><SiDiscord className="w-5 h-5 text-white" /></Button>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
