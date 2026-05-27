import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, isBot: boolean}[]>([
    { text: "Hello analyst. I am the SentinelX AI assistant. How can I help you investigate threats today?", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { text: input, isBot: false }]);
    setInput("");
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: "I have analyzed your request. As a simulation, I cannot perform actual backend analysis, but I recommend checking the Live Dashboard or the URL Sandbox for more simulated threat intelligence.", isBot: true }]);
    }, 1500);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-[0_0_20px_rgba(0,245,255,0.4)] bg-primary text-primary-foreground hover:bg-primary/90 z-50 p-0"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="bg-muted p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-display font-bold">Sentinel AI</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto h-80 flex flex-col gap-3 font-mono text-sm">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg ${m.isBot ? "bg-muted text-foreground rounded-tl-sm border border-border" : "bg-primary/20 text-primary border border-primary/30 rounded-tr-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground p-3 rounded-lg rounded-tl-sm border border-border flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-75" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-150" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-border bg-background flex gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask Sentinel AI..."
                className="bg-card font-mono text-sm"
              />
              <Button size="icon" onClick={handleSend} className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}