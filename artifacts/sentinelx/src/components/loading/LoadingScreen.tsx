import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("hasLoaded");
    if (hasLoaded) {
      setLoading(false);
      return;
    }

    const steps = [
      { t: "ESTABLISHING SECURE CONNECTION...", delay: 200 },
      { t: "INITIALIZING SENTINELX CORE...", delay: 800 },
      { t: "LOADING THREAT MODULES...", delay: 1500 },
      { t: "DECRYPTING NEURAL MODELS...", delay: 2200 },
      { t: "SYSTEM READY.", delay: 3000 },
    ];

    const stepTimeouts: ReturnType<typeof setTimeout>[] = steps.map((step) =>
      setTimeout(() => setText(step.t), step.delay)
    );

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return p + 2;
      });
    }, 50);

    const finishTimeout = setTimeout(() => {
      sessionStorage.setItem("hasLoaded", "true");
      setLoading(false);
    }, 3500);

    return () => {
      stepTimeouts.forEach(t => clearTimeout(t));
      clearInterval(progressInterval);
      clearTimeout(finishTimeout);
    };
  }, []);

  if (!loading) return null;

  return (
    <AnimatePresence>
      <motion.div
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center font-mono"
      >
        <div className="w-full max-w-md p-8">
          <div className="text-primary text-4xl mb-8 text-center font-display tracking-widest drop-shadow-[0_0_15px_rgba(0,245,255,0.8)]">
            SENTINEL<span className="text-white">X</span>
          </div>
          
          <div className="h-2 w-full bg-white/10 rounded overflow-hidden mb-4">
            <div 
              className="h-full bg-primary shadow-[0_0_10px_rgba(0,245,255,1)] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-muted-foreground text-sm h-6 flex items-center justify-between">
            <span className="animate-pulse">{text}</span>
            <span>{progress}%</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}