import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, MemoryStick, Globe, Code2, Layers, Terminal, Activity, Zap } from "lucide-react";

type BlockStatus = "idle" | "active" | "suspicious" | "infected" | "clean";

interface MemoryBlock {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  usage: number;
  pid: number;
  status: BlockStatus;
  threads: number;
}

const BLOCKS: Omit<MemoryBlock, "status" | "usage">[] = [
  { id: "browser-core", name: "Browser Core", icon: Cpu, pid: 1001, threads: 8 },
  { id: "tab-process", name: "Tab Process", icon: Layers, pid: 1042, threads: 4 },
  { id: "js-engine", name: "JS Engine", icon: Code2, pid: 1078, threads: 6 },
  { id: "network-layer", name: "Network Layer", icon: Globe, pid: 1099, threads: 3 },
  { id: "dom-parser", name: "DOM Parser", icon: Terminal, pid: 1134, threads: 2 },
  { id: "memory-heap", name: "Memory Heap", icon: MemoryStick, pid: 1156, threads: 4 },
  { id: "script-sandbox", name: "Script Sandbox", icon: Zap, pid: 1180, threads: 2 },
  { id: "event-loop", name: "Event Loop", icon: Activity, pid: 1201, threads: 1 },
];

const STATUS_COLORS: Record<BlockStatus, string> = {
  idle: "border-white/10 bg-white/2",
  active: "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(0,245,255,0.1)]",
  suspicious: "border-yellow-500/60 bg-yellow-500/8 shadow-[0_0_20px_rgba(234,179,8,0.15)]",
  infected: "border-red-500/70 bg-red-500/10 shadow-[0_0_25px_rgba(239,68,68,0.2)]",
  clean: "border-green-500/40 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
};

const STATUS_TEXT_COLORS: Record<BlockStatus, string> = {
  idle: "text-white/30",
  active: "text-cyan-400",
  suspicious: "text-yellow-400",
  infected: "text-red-400",
  clean: "text-green-400",
};

const STATUS_BAR_COLORS: Record<BlockStatus, string> = {
  idle: "bg-white/20",
  active: "bg-cyan-400",
  suspicious: "bg-yellow-400",
  infected: "bg-red-500",
  clean: "bg-green-400",
};

function MemoryBlock({ block, index }: { block: MemoryBlock; index: number }) {
  const Icon = block.icon;
  const isInfected = block.status === "infected";
  const dotColors = block.status === "idle" ? "bg-white/20" :
    block.status === "active" ? "bg-cyan-400" :
    block.status === "suspicious" ? "bg-yellow-400" :
    block.status === "infected" ? "bg-red-400" : "bg-green-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.07 }}
      className={`relative rounded-lg border p-4 font-mono transition-all duration-500 overflow-hidden ${STATUS_COLORS[block.status]}`}
    >
      {isInfected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-red-500/60"
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 3) * 20}%`,
                animation: `float-up ${1.5 + i * 0.3}s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${STATUS_TEXT_COLORS[block.status]}`} />
          <span className={`text-xs font-bold ${STATUS_TEXT_COLORS[block.status]}`}>{block.name}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold tracking-wider ${
          block.status === "idle" ? "border-white/10 text-white/30" :
          block.status === "active" ? "border-cyan-500/30 text-cyan-400" :
          block.status === "suspicious" ? "border-yellow-500/30 text-yellow-400" :
          block.status === "infected" ? "border-red-500/30 text-red-400 animate-pulse" :
          "border-green-500/30 text-green-400"
        }`}>
          {block.status.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${STATUS_BAR_COLORS[block.status]}`}
            animate={{ width: `${block.usage}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
        <span className="text-[10px] text-white/40 w-8 text-right">{block.usage}%</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[9px] text-white/25">PID:{block.pid} · {block.threads}T</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((d) => (
            <div
              key={d}
              className={`w-1 h-1 rounded-full ${dotColors}`}
              style={{
                animation: block.status !== "idle" ? `pulse-dot 1.2s ease-in-out infinite` : "none",
                animationDelay: `${d * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface MemoryVisualizerProps {
  isScanning: boolean;
  isComplete: boolean;
  threatScore: number;
  indicators: string[];
}

export function MemoryVisualizer({ isScanning, isComplete, threatScore, indicators }: MemoryVisualizerProps) {
  const [blocks, setBlocks] = useState<MemoryBlock[]>(
    BLOCKS.map((b) => ({ ...b, status: "idle", usage: Math.floor(Math.random() * 20 + 5) }))
  );
  const usageRef = useRef(BLOCKS.map(() => Math.floor(Math.random() * 20 + 5)));

  const setBlockStatus = (ids: string[], status: BlockStatus, usageBoost = 0) => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        ids.includes(b.id)
          ? { ...b, status, usage: Math.min(99, usageRef.current[i] + usageBoost) }
          : b
      )
    );
  };

  useEffect(() => {
    if (!isScanning && !isComplete) {
      setBlocks(BLOCKS.map((b, i) => ({ ...b, status: "idle", usage: usageRef.current[i] })));
      return;
    }
    if (!isScanning && !isComplete) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      setBlocks(BLOCKS.map((b, i) => ({ ...b, status: "active", usage: Math.min(90, usageRef.current[i] + 30) })));
    }, 300));

    timers.push(setTimeout(() => {
      setBlockStatus(["network-layer", "tab-process"], "active", 50);
    }, 1200));

    timers.push(setTimeout(() => {
      const hasJs = indicators.some(s => s.toLowerCase().includes("javascript") || s.toLowerCase().includes("script"));
      if (hasJs || threatScore > 40) {
        setBlockStatus(["js-engine", "script-sandbox"], "suspicious", 60);
      }
    }, 2200));

    timers.push(setTimeout(() => {
      if (threatScore >= 70) {
        setBlockStatus(["js-engine", "script-sandbox", "memory-heap"], "infected", 80);
        setBlockStatus(["tab-process"], "suspicious", 50);
      } else if (threatScore >= 35) {
        setBlockStatus(["js-engine"], "suspicious", 50);
      }
    }, 3200));

    timers.push(setTimeout(() => {
      if (isComplete || !isScanning) {
        setBlocks((prev) =>
          prev.map((b) => ({
            ...b,
            status: b.status === "infected" ? "infected" : b.status === "suspicious" ? "suspicious" : "clean",
            usage: b.status === "infected"
              ? Math.min(99, b.usage)
              : Math.max(5, usageRef.current[BLOCKS.findIndex((bb) => bb.id === b.id)] + (b.status === "suspicious" ? 30 : 0)),
          }))
        );
      }
    }, 4500));

    return () => timers.forEach(clearTimeout);
  }, [isScanning, isComplete, threatScore, indicators]);

  const cleanCount = blocks.filter((b) => b.status === "clean").length;
  const infectedCount = blocks.filter((b) => b.status === "infected").length;
  const suspiciousCount = blocks.filter((b) => b.status === "suspicious").length;

  return (
    <div className="relative bg-black/90 border border-white/10 rounded-xl overflow-hidden">
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isScanning ? "bg-cyan-400 animate-pulse" : isComplete ? "bg-green-400" : "bg-white/20"}`} />
          <span className="text-xs font-mono font-bold text-white/70 tracking-widest uppercase">
            Browser Memory Visualizer
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/30">8 processes · PID 1001-1201</span>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {blocks.map((block, i) => (
          <MemoryBlock key={block.id} block={block} index={i} />
        ))}
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-4 py-3 border-t border-white/5 font-mono text-xs"
          >
            <span className="text-green-400">{cleanCount} Clean</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="text-red-400">{infectedCount} Infected</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="text-yellow-400">{suspiciousCount} Suspicious</span>
            <span className="ml-auto text-white/25">Analysis complete · Memory snapshot saved</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
