import { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, AlertTriangle, Shield, Zap, Activity, RefreshCw } from "lucide-react";
import { useThreatLevel } from "@/contexts/ThreatLevelContext";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MAP_W = 800;
const MAP_H = 450;
const SCALE = MAP_W / (2 * Math.PI);
const TX = MAP_W / 2;
const TY = MAP_H / 2;

function project(lat: number, lon: number): [number, number] {
  const x = TX + SCALE * (lon * Math.PI / 180);
  const y = TY - SCALE * (lat * Math.PI / 180);
  return [Math.max(4, Math.min(MAP_W - 4, x)), Math.max(4, Math.min(MAP_H - 4, y))];
}

function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curve = dist * 0.35;
  const cpx = mx - (dy / dist) * curve;
  const cpy = my + (dx / dist) * curve * 0.5;
  return `M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff2020",
  high: "#ff8c00",
  medium: "#ffcc00",
  low: "#00f5ff",
};

const TYPE_ICONS: Record<string, string> = {
  phishing: "PHISH",
  malware: "MALW",
  credential_theft: "CRED",
  redirect_attack: "REDIR",
  script_injection: "XSS",
  typosquat: "SQUAT",
  qr_phishing: "QR",
  scam: "SCAM",
  demo: "DEMO",
  probe: "PROBE",
};

interface GeoCoord { lat: number; lon: number; country: string; city: string }
interface ThreatEvent {
  id: string;
  source: GeoCoord;
  target: GeoCoord;
  type: string;
  severity: string;
  score: number;
  url: string;
  timestamp: string;
  origin: string;
}

interface Arc {
  event: ThreatEvent;
  src: [number, number];
  tgt: [number, number];
  path: string;
  key: string;
  startedAt: number;
}

export default function ThreatMap() {
  const [isReset, setIsReset] = useState(false);
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<ThreatEvent | null>(null);
  const arcIdxRef = useRef(0);
  const { setThreatLevel } = useThreatLevel();

  const fetchData = async () => {
    if (isReset) return;
    try {
      const res = await fetch("/api/threatmap");
      if (!res.ok) return;
      const data = await res.json() as { events: ThreatEvent[]; total: number };
      setTotal(data.total);
      setEvents(data.events);
      setLastUpdate(new Date());

      const criticalCount = data.events.filter(e => e.severity === "critical").length;
      const highCount = data.events.filter(e => e.severity === "high").length;
      const newLevel = criticalCount > 3 ? 3 : highCount > 5 ? 2 : data.total > 0 ? 1 : 0;
      setThreatLevel(newLevel);

      const newArcs: Arc[] = data.events.slice(0, 25).map((ev, i) => {
        const src = project(ev.source.lat, ev.source.lon);
        const tgt = project(ev.target.lat, ev.target.lon);
        return {
          event: ev,
          src,
          tgt,
          path: arcPath(src[0], src[1], tgt[0], tgt[1]),
          key: `${ev.id}-${arcIdxRef.current++}`,
          startedAt: Date.now() + i * 200,
        };
      });
      setArcs(newArcs);
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => { clearInterval(interval); setThreatLevel(0); };
  }, [setThreatLevel]);

  const criticalCount = events.filter(e => e.severity === "critical").length;
  const highCount = events.filter(e => e.severity === "high").length;
  const mostTargeted = events.length > 0
    ? Object.entries(events.reduce<Record<string, number>>((acc, e) => { acc[e.target.country] = (acc[e.target.country] || 0) + 1; return acc; }, {}))
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";

  return (
    <Sidebar>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-black/30 flex items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-3">
            <Globe2 className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold font-display text-white">Global Threat Map</h1>
              <p className="text-xs text-muted-foreground font-mono">Live attack visualization · Auto-refreshes every 10s</p>
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-bold">{criticalCount}</span>
              <span className="text-white/30">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-orange-400 font-bold">{highCount}</span>
              <span className="text-white/30">High</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white font-bold">{total}</span>
              <span className="text-white/30">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-400">{mostTargeted}</span>
              <span className="text-white/30">Most Targeted</span>
            </div>
            <button
              data-testid="button-refresh-threatmap"
              onClick={() => {
  setIsReset(false);
  fetchData();
}}
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/10 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
            <button
  data-testid="button-reset-threatmap"
 onClick={() => {
  setIsReset(true);
  setEvents([]);
  setArcs([]);
  setTotal(0);
  setHoveredEvent(null);
  setThreatLevel(0);
  setLastUpdate(new Date());
}}
  className="flex items-center gap-1.5 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition-colors text-red-400"
>
  <span>Reset</span>
</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative bg-[#020209] overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-primary font-mono text-sm animate-pulse">LOADING THREAT INTELLIGENCE...</span>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <style>{`
                  @keyframes arc-draw {
                    from { stroke-dashoffset: 800; opacity: 0; }
                    10% { opacity: 1; }
                    80% { opacity: 0.8; }
                    100% { stroke-dashoffset: 0; opacity: 0; }
                  }
                  @keyframes dot-pulse {
                    0%, 100% { r: 3; opacity: 0.9; }
                    50% { r: 5; opacity: 0.4; }
                  }
                  @keyframes origin-pulse {
                    0% { r: 4; opacity: 0; }
                    20% { opacity: 1; }
                    100% { r: 12; opacity: 0; }
                  }
                `}</style>

                <ComposableMap
                  projection="geoEquirectangular"
                  width={MAP_W}
                  height={MAP_H}
                  projectionConfig={{ scale: SCALE, center: [0, 0] }}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#0d1117"
                          stroke="#1e293b"
                          strokeWidth={0.4}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#1e293b", outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {arcs.map((arc) => {
                    const color = SEVERITY_COLORS[arc.event.severity] ?? "#00f5ff";
                    const dur = arc.event.severity === "critical" ? 2.5 : arc.event.severity === "high" ? 3 : 3.5;
                    return (
                      <g key={arc.key}>
                        <path
                          d={arc.path}
                          fill="none"
                          stroke={color}
                          strokeWidth={arc.event.severity === "critical" ? 1.5 : 1}
                          strokeDasharray={800}
                          style={{
                            animation: `arc-draw ${dur}s ease-in-out ${arcs.indexOf(arc) * 0.15}s infinite`,
                            filter: `drop-shadow(0 0 4px ${color})`,
                          }}
                        />
                        <circle
                          cx={arc.src[0]} cy={arc.src[1]}
                          fill={color}
                          style={{ animation: "origin-pulse 2s ease-out infinite" }}
                        />
                        <circle
                          cx={arc.src[0]} cy={arc.src[1]}
                          r={3}
                          fill={color}
                          style={{
                            animation: "dot-pulse 2s ease-in-out infinite",
                            filter: `drop-shadow(0 0 3px ${color})`,
                          }}
                        />
                      </g>
                    );
                  })}

                  {Array.from(new Set(arcs.map(a => `${a.tgt[0]},${a.tgt[1]}`))).map((key) => {
                    const [x, y] = key.split(",").map(Number);
                    const count = arcs.filter(a => `${a.tgt[0]},${a.tgt[1]}` === key).length;
                    return (
                      <Marker key={key} coordinates={[x - TX, -(y - TY)] as [number, number]}>
                        <circle r={2 + count * 0.5} fill="#00f5ff" opacity={0.5} style={{ filter: "drop-shadow(0 0 6px #00f5ff)" }} />
                        <circle r={2} fill="#00f5ff" />
                      </Marker>
                    );
                  })}
                </ComposableMap>

                <div className="absolute bottom-4 left-4 flex items-center gap-4 font-mono text-[10px]">
                  {(["critical", "high", "medium", "low"] as const).map(sev => (
                    <div key={sev} className="flex items-center gap-1.5">
                      <div className="w-6 h-px" style={{ backgroundColor: SEVERITY_COLORS[sev], boxShadow: `0 0 4px ${SEVERITY_COLORS[sev]}` }} />
                      <span className="capitalize" style={{ color: SEVERITY_COLORS[sev] }}>{sev}</span>
                    </div>
                  ))}
                  {lastUpdate && (
                    <span className="text-white/20 ml-4">Updated {lastUpdate.toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-72 border-l border-white/5 bg-black/50 flex flex-col overflow-hidden shrink-0">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                Live Attack Feed
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence initial={false}>
                {events.slice(0, 30).map((ev, i) => {
                  const color = SEVERITY_COLORS[ev.severity] ?? "#00f5ff";
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onMouseEnter={() => setHoveredEvent(ev)}
                      onMouseLeave={() => setHoveredEvent(null)}
                      className="px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors cursor-default"
                      style={{ borderLeftColor: color, borderLeftWidth: 2 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: color + "20", color }}>
                          {TYPE_ICONS[ev.type] ?? ev.type.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-white/25 font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/70 font-mono truncate mb-0.5">{ev.url}</p>
                      <p className="text-[9px] text-white/30 font-mono">
                        {ev.source.city} → {ev.target.city}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {events.length === 0 && !loading && (
                <div className="p-6 text-center text-white/20 font-mono text-xs">
                  No threat events detected
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {hoveredEvent && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 bg-black/90 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs pointer-events-none backdrop-blur-md"
              style={{ borderLeftColor: SEVERITY_COLORS[hoveredEvent.severity], borderLeftWidth: 2 }}
            >
              <p className="text-white font-bold mb-1">{hoveredEvent.url}</p>
              <p className="text-white/50">{hoveredEvent.source.country} → {hoveredEvent.target.country} · Score: {hoveredEvent.score}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sidebar>
  );
}
