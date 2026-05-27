import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThreatScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 500);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = (s: number) => {
    if (s < 30) return "#10b981"; // green
    if (s < 70) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  const getLabel = (s: number) => {
    if (s < 30) return "CLEAN";
    if (s < 70) return "SUSPICIOUS";
    return "MALICIOUS";
  };

  const color = getColor(score);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-white/10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="drop-shadow-[0_0_8px_currentColor]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-display" style={{ color, textShadow: `0 0 10px ${color}` }}>
          {Math.round(animatedScore)}
        </span>
        <span className="text-xs font-mono font-bold tracking-widest uppercase mt-1" style={{ color }}>
          {getLabel(animatedScore)}
        </span>
      </div>
    </div>
  );
}