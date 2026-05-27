import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Volume2, VolumeX, RotateCcw, Mic } from "lucide-react";

interface AnalysisResult {
  score: number;
  indicators: string[];
  chain: string[];
  aiText?: string;
}

interface VoiceNarratorProps {
  results: AnalysisResult | null;
  score: number;
}

function buildScript(score: number, indicators: string[], chain: string[]): string[] {
  const lines: string[] = [];
  if (score >= 70) {
    lines.push("Attention. Threat analysis complete.");
    lines.push(`Risk level critical. Score ${score} out of one hundred.`);
    if (chain.length > 1) lines.push(`Suspicious redirect chain detected with ${chain.length} hops.`);
    if (indicators[0]) lines.push(indicators[0]);
    if (indicators[1]) lines.push(indicators[1]);
    lines.push("Immediate containment is recommended. Isolating threat signature.");
  } else if (score >= 35) {
    lines.push("Analysis complete. Medium risk profile detected.");
    lines.push(`Score ${score} of one hundred. Exercise caution.`);
    if (indicators[0]) lines.push(indicators[0]);
    lines.push("Continue monitoring this domain.");
  } else {
    lines.push("Analysis complete.");
    lines.push("Low risk profile confirmed.");
    lines.push("No significant threats detected. The domain appears safe.");
  }
  return lines;
}

function getPriority(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 35) return "medium";
  return "low";
}

const RATE_MAP = { critical: 0.85, high: 0.9, medium: 1.0, low: 1.1 };
const PITCH_MAP = { critical: 0.7, high: 0.8, medium: 0.95, low: 1.0 };

export function VoiceNarrator({ results, score }: VoiceNarratorProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem("sentinelx_voice_muted") === "true"; } catch { return false; }
  });
  const [currentLine, setCurrentLine] = useState("");
  const [supported] = useState(() => "speechSynthesis" in window);
  const scriptRef = useRef<string[]>([]);
  const priority = getPriority(score);

  const narrate = useCallback((lines: string[]) => {
    if (!supported || isMuted || lines.length === 0) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const speak = (index: number) => {
      if (index >= lines.length) {
        setIsSpeaking(false);
        setCurrentLine("");
        return;
      }
      const u = new SpeechSynthesisUtterance(lines[index]);
      u.rate = RATE_MAP[priority];
      u.pitch = PITCH_MAP[priority];
      u.volume = 0.85;
      u.onstart = () => { setIsSpeaking(true); setCurrentLine(lines[index]); };
      u.onend = () => speak(index + 1);
      u.onerror = () => speak(index + 1);
      window.speechSynthesis.speak(u);
    };

    speak(0);
  }, [isMuted, priority, supported]);

  useEffect(() => {
    if (!results) return;
    const lines = buildScript(results.score, results.indicators, results.chain);
    scriptRef.current = lines;
    const timer = setTimeout(() => narrate(lines), 600);
    return () => clearTimeout(timer);
  }, [results, narrate]);

  const handleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    try { localStorage.setItem("sentinelx_voice_muted", String(next)); } catch {}
    if (next) { window.speechSynthesis.cancel(); setIsSpeaking(false); setCurrentLine(""); }
  };

  const handleRernarrate = () => {
    if (scriptRef.current.length > 0) narrate(scriptRef.current);
  };

  if (!results) return null;

  const barHeights = [4, 10, 16, 10, 6, 14, 8, 12, 6, 10];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl border font-mono mb-4 ${
          priority === "critical" ? "border-red-500/40 bg-red-500/5" :
          priority === "high" ? "border-orange-500/40 bg-orange-500/5" :
          priority === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
          "border-cyan-500/30 bg-cyan-500/5"
        }`}
      >
        <div className="relative shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
            priority === "critical" ? "border-red-500/50 bg-red-500/10" :
            priority === "high" ? "border-orange-500/50 bg-orange-500/10" :
            priority === "medium" ? "border-yellow-500/40 bg-yellow-500/10" :
            "border-cyan-500/40 bg-cyan-500/10"
          }`}>
            <Shield className={`w-5 h-5 ${
              priority === "critical" ? "text-red-400" :
              priority === "high" ? "text-orange-400" :
              priority === "medium" ? "text-yellow-400" : "text-cyan-400"
            }`} />
          </div>
          {isSpeaking && (
            <div className={`absolute inset-0 rounded-full border-2 animate-ping ${
              priority === "critical" ? "border-red-400/40" :
              priority === "high" ? "border-orange-400/40" :
              "border-cyan-400/40"
            }`} />
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Mic className="w-3 h-3 text-white/40" />
            <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              {isSpeaking ? "SENTINEL AI NARRATING..." : "SENTINEL AI"}
            </span>
            {!supported && (
              <span className="text-[9px] text-white/25">(Voice not supported in this browser)</span>
            )}
          </div>
          {currentLine ? (
            <p className={`text-xs truncate ${
              priority === "critical" ? "text-red-300" :
              priority === "high" ? "text-orange-300" :
              priority === "medium" ? "text-yellow-300" : "text-cyan-300"
            }`}>
              {currentLine}
            </p>
          ) : (
            <p className="text-xs text-white/20 italic">{isMuted ? "Voice muted" : "Ready to narrate"}</p>
          )}
        </div>

        <div className="flex items-end gap-0.5 h-5 shrink-0">
          {barHeights.map((h, i) => (
            <motion.div
              key={i}
              className={`w-0.5 rounded-full ${
                priority === "critical" ? "bg-red-400" :
                priority === "high" ? "bg-orange-400" :
                priority === "medium" ? "bg-yellow-400" : "bg-cyan-400"
              } ${!isSpeaking ? "opacity-20" : ""}`}
              animate={isSpeaking ? {
                height: [h, h * 0.4, h * 1.3, h * 0.7, h],
              } : { height: 3 }}
              transition={{ duration: 0.6 + i * 0.07, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
              style={{ height: h }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            data-testid="button-renerrate"
            onClick={handleRernarrate}
            disabled={isMuted || !supported}
            title="Re-narrate"
            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            data-testid="button-mute-narrator"
            onClick={handleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
