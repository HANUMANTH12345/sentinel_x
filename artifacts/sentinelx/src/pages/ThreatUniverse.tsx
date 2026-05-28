import { Suspense, useState, useMemo, useRef, useEffect, Component } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Billboard, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { Sidebar } from "@/components/layout/Sidebar";
import { Link } from "wouter";
import { Search, X, ExternalLink, Globe2, AlertTriangle, Info, Wifi, RotateCcw } from "lucide-react";
import { useThreatLevel } from "@/contexts/ThreatLevelContext";
import { useUserScans } from "@/contexts/UserScansContext";

// ─── Data ──────────────────────────────────────────────────────────────────────

interface ThreatNode {
  id: number;
  name: string;
  type: "domain" | "ip" | "cluster" | "apt" | "phishing_kit";
  threat: "critical" | "high" | "medium" | "info";
  score: number;
  position: [number, number, number];
  radius: number;
  country: string;
  hostingProvider: string;
  malwareFamilies: string[];
  connectedNodes: number[];
  sslReuse: boolean;
  campaigns: string[];
}

const THREAT_COLORS: Record<string, number> = {
  critical: 0xff2020, high: 0xff8000, medium: 0xffcc00, info: 0x00f5ff, apt: 0x9f00ff,
};
const THREAT_CSS: Record<string, string> = {
  critical: "#ff2020", high: "#ff8000", medium: "#ffcc00", info: "#00f5ff", apt: "#9f00ff",
};
const COUNTRIES = ["Russia", "China", "North Korea", "Ukraine", "Romania", "Brazil", "Nigeria", "Iran", "USA", "Germany"];
const PROVIDERS = ["Cloudflare", "DigitalOcean", "AWS", "Hetzner", "OVH", "Linode", "Vultr", "Namecheap", "GoDaddy", "HostGator"];
const MALWARE = ["Emotet", "TrickBot", "Ryuk", "Cobalt Strike", "Mimikatz", "Formbook", "AgentTesla", "RedLine", "AsyncRAT", "NjRAT"];
const CAMPAIGNS = ["Operation Sandworm", "APT28 Phishing", "FIN7 Spear", "Lazarus Supply Chain", "TA505 Campaign", "Scattered Spider"];
const NAMES = [
  "secure-login-paypal.ru", "verify-account-amazon.xyz", "192.168.43.22", "185.220.101.47",
  "bankofamerica-security.com", "docusign-verify.net", "office365-reset.cc", "10.0.23.154",
  "facebook-login-secure.tk", "microsoft-support.xyz", "paypal-resolution.ru", "apple-icloud.cc",
  "coinbase-verify.net", "netflix-billing.xyz", "dhl-tracking-parcel.eu", "fedex-delivery.cc",
  "amazon-order-confirm.ru", "steam-trade-offer.tk", "google-security-alert.xyz", "irs-refund.cc",
  "bitcoin-invest-now.com", "crypto-double.xyz", "nft-mint-free.io", "defi-protocol.cc",
  "zoom-meeting-invite.net", "teams-share.xyz", "dropbox-document.ru", "wetransfer-file.cc",
  "195.133.18.11", "91.108.4.55", "77.88.21.3", "194.165.16.23",
  "malware-c2-server.net", "phish-kit-v3.ru", "credential-harvester.xyz", "ransomware-panel.cc",
  "apt-infrastructure.net", "botnet-controller.io", "exploit-kit-landing.cc", "trojan-dropper.xyz",
];

function generateNodes(): ThreatNode[] {
  return NAMES.map((name, i) => {
    const phi = Math.acos(-1 + (2 * i) / NAMES.length);
    const theta = Math.sqrt(NAMES.length * Math.PI) * phi;
    const r = 20 + (i % 5) * 3;
    const type = i % 5 === 0 ? "cluster" : i % 7 === 0 ? "apt" : i % 3 === 0 ? "ip" : i % 9 === 0 ? "phishing_kit" : "domain";
    const threat = i % 7 === 0 ? "critical" : i % 4 === 0 ? "high" : i % 2 === 0 ? "medium" : "info";
    return {
      id: i, name, type, threat,
      score: threat === "critical" ? 80 + (i % 20) : threat === "high" ? 55 + (i % 25) : threat === "medium" ? 30 + (i % 25) : 5 + (i % 25),
      position: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)],
      radius: type === "apt" ? 1.4 : type === "cluster" ? 1.2 : 0.35 + (i % 8) * 0.1,
      country: COUNTRIES[i % COUNTRIES.length],
      hostingProvider: PROVIDERS[i % PROVIDERS.length],
      malwareFamilies: [MALWARE[i % MALWARE.length], MALWARE[(i + 3) % MALWARE.length]].slice(0, 1 + (i % 2)),
      connectedNodes: [(i + 3) % NAMES.length, (i + 7) % NAMES.length].slice(0, i % 3 === 0 ? 2 : 1),
      sslReuse: i % 3 === 0,
      campaigns: [CAMPAIGNS[i % CAMPAIGNS.length]],
    };
  });
}

// ─── WebGL check ───────────────────────────────────────────────────────────────

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch { return false; }
}

// ─── Error boundary ────────────────────────────────────────────────────────────

interface EBState { hasError: boolean }
class WebGLErrorBoundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// ─── Node info panel (shared between 2D and 3D views) ─────────────────────────

function NodeInfoPanel({ node, onClose }: { node: ThreatNode; onClose: () => void }) {
  const color = node.type === "apt" ? THREAT_CSS.apt : THREAT_CSS[node.threat];
  return (
    <div className="absolute top-20 right-6 z-20 w-80 bg-black/90 border border-white/10 rounded-xl overflow-hidden font-mono text-sm backdrop-blur-md shadow-[0_0_40px_rgba(0,245,255,0.07)]"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Threat Node</p>
          <p className="text-white font-bold truncate text-sm">{node.name}</p>
        </div>
        <button data-testid="button-close-node-panel" onClick={onClose} className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs">Threat Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${node.score}%`, backgroundColor: color }} />
            </div>
            <span className="text-white font-bold text-xs">{node.score}/100</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs">Threat Level</span>
          <span className="text-xs px-2 py-0.5 rounded font-bold capitalize" style={{ backgroundColor: color + "20", color }}>
            {node.type === "apt" ? "APT" : node.threat}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs flex items-center gap-1"><Globe2 className="w-3 h-3" /> Country</span>
          <span className="text-white/80 text-xs">{node.country}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs flex items-center gap-1"><Wifi className="w-3 h-3" /> Hosting</span>
          <span className="text-white/80 text-xs">{node.hostingProvider}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs flex items-center gap-1"><Info className="w-3 h-3" /> SSL Reuse</span>
          <span className={`text-xs font-bold ${node.sslReuse ? "text-red-400" : "text-green-400"}`}>
            {node.sslReuse ? "YES — Shared cert detected" : "No reuse detected"}
          </span>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Malware Families</p>
          <div className="flex flex-wrap gap-1">
            {node.malwareFamilies.map(m => (
              <span key={m} className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px]">{m}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1.5">Campaigns</p>
          <div className="flex flex-wrap gap-1">
            {node.campaigns.map(c => (
              <span key={c} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px]">{c}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs">Connected Nodes</span>
          <span className="text-cyan-400 text-xs font-bold">{node.connectedNodes.length}</span>
        </div>
      </div>
      <div className="px-4 pb-4">
        <Link href={`/sandbox`}>
          <button data-testid="button-analyze-node" className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors text-xs font-bold">
            <ExternalLink className="w-3.5 h-3.5" /> Analyze in Sandbox
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── 2D canvas fallback visualization ─────────────────────────────────────────

function ThreatUniverse2D({ nodes, search, selectedId, onSelect }: {
  nodes: ThreatNode[];
  search: string;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rotationRef = useRef(0);
  const hoveredRef = useRef<number | null>(null);
  const projectedRef = useRef<{ id: number; x: number; y: number; r: number }[]>([]);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraThetaRef = useRef(0.3);
  const cameraPhiRef = useRef(0.5);
  const zoomRef = useRef(14);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.5,
      o: 0.2 + Math.random() * 0.6,
    }));

    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);
      rotationRef.current += 0.002;
      const w = canvas.width, h = canvas.height;
      if (w === 0 || h === 0) return;

      ctx.fillStyle = "#020209";
      ctx.fillRect(0, 0, w, h);

      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`;
        ctx.fill();
      });

      const cx = w / 2, cy = h / 2;
      const zoom = zoomRef.current;
      const theta = cameraThetaRef.current + rotationRef.current;
      const phi = cameraPhiRef.current;
      const cosT = Math.cos(theta), sinT = Math.sin(theta);
      const cosP = Math.cos(phi), sinP = Math.sin(phi);

      const project = (pos: [number, number, number]): { x: number; y: number; z: number } => {
        const [px, py, pz] = pos;
        const rx = px * cosT - pz * sinT;
        const rz = px * sinT + pz * cosT;
        const ry2 = py * cosP - rz * sinP;
        const rz2 = py * sinP + rz * cosP;
        const fov = 300;
        const scale = fov / (fov + rz2 + 40);
        return { x: cx + rx * scale * zoom, y: cy - ry2 * scale * zoom, z: rz2 };
      };

      const projected = nodes.map(n => ({ ...project(n.position), id: n.id, node: n }))
        .sort((a, b) => a.z - b.z);

      nodes.forEach(n => {
        n.connectedNodes.forEach(cid => {
          const a = project(n.position);
          const b = project(nodes[cid].position);
          const matched = !search || n.name.toLowerCase().includes(search.toLowerCase());
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          const col = n.type === "apt" ? THREAT_CSS.apt : THREAT_CSS[n.threat];
          ctx.strokeStyle = matched ? col + "40" : col + "15";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      });

      const newProjected: { id: number; x: number; y: number; r: number }[] = [];

      projected.forEach(({ x, y, z, id, node }) => {
        const fov = 300;
        const scale = fov / (fov + z + 40);
        const baseR = (node.radius * zoom * scale * 0.8);
        const r = Math.max(3, baseR);
        const color = node.type === "apt" ? THREAT_CSS.apt : THREAT_CSS[node.threat];
        const isHovered = hoveredRef.current === id;
        const isSelected = selectedId === id;
        const matched = !search || node.name.toLowerCase().includes(search.toLowerCase());
        const alpha = matched ? 1 : 0.25;

        ctx.save();
        ctx.globalAlpha = alpha;
        if (isHovered || isSelected) {
          const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
          grad.addColorStop(0, color + "40");
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        grad.addColorStop(0, color + "ff");
        grad.addColorStop(0.6, color + "cc");
        grad.addColorStop(1, color + "44");
        ctx.shadowColor = color;
        ctx.shadowBlur = isHovered ? 20 : 10;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (node.type === "cluster" || node.type === "apt") {
          ctx.beginPath();
          ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
          ctx.strokeStyle = color + "40";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        if (r > 5) {
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = `${Math.max(8, Math.min(11, r * 1.4))}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText(node.name.length > 18 ? node.name.slice(0, 18) + "…" : node.name, x, y + r + 10);
        }
        ctx.restore();
        newProjected.push({ id, x, y, r });
      });

      projectedRef.current = newProjected;
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); ro.disconnect(); };
  }, [nodes, search, selectedId]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      cameraThetaRef.current += dx * 0.005;
      cameraPhiRef.current = Math.max(-1.2, Math.min(1.2, cameraPhiRef.current - dy * 0.005));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const hit = projectedRef.current.find(p => Math.hypot(p.x - mx, p.y - my) < p.r + 8);
    hoveredRef.current = hit ? hit.id : null;
    (e.target as HTMLCanvasElement).style.cursor = hit ? "pointer" : "grab";
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLCanvasElement).style.cursor = "grabbing";
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    (e.target as HTMLCanvasElement).style.cursor = "grab";
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const hit = projectedRef.current.find(p => Math.hypot(p.x - mx, p.y - my) < p.r + 8);
    onSelect(hit ? (selectedId === hit.id ? null : hit.id) : null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    zoomRef.current = Math.max(6, Math.min(30, zoomRef.current - e.deltaY * 0.02));
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: "grab" }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  );
}

// ─── 3D components ─────────────────────────────────────────────────────────────

function PlanetNode({ node, isHighlighted, onClick }: { node: ThreatNode; isHighlighted: boolean; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const color = new THREE.Color(node.type === "apt" ? THREAT_COLORS.apt : THREAT_COLORS[node.threat]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.005;
    meshRef.current.rotation.x += 0.002;
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.5 + node.id) * 0.04;
    meshRef.current.scale.setScalar(pulse * (isHighlighted ? 1.25 : 1));
    if (lightRef.current) {
      lightRef.current.intensity = (isHighlighted ? 1.2 : 0.45) * 3 * (0.8 + 0.2 * Math.sin(clock.elapsedTime * 2 + node.id));
    }
  });

  return (
    <group position={node.position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[node.radius, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHighlighted ? 1.2 : 0.45} roughness={0.3} metalness={0.6} />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={(isHighlighted ? 1.2 : 0.45) * 3} distance={8} decay={2} />
      {node.type === "cluster" && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[node.radius * 1.6, node.radius * 1.9, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}
      {isHighlighted && (
        <mesh><sphereGeometry args={[node.radius * 2, 16, 16]} /><meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.BackSide} /></mesh>
      )}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.28} color="#ffffff" anchorX="center" anchorY="bottom" position={[0, node.radius + 0.5, 0]} outlineWidth={0.02} outlineColor="#000000" fillOpacity={isHighlighted ? 1 : 0.7}>
          {node.name.length > 24 ? node.name.slice(0, 24) + "…" : node.name}
        </Text>
      </Billboard>
    </group>
  );
}

function ConnectionLines3D({ nodes }: { nodes: ThreatNode[] }) {
  const lines = useMemo(() => {
    const result: { from: [number,number,number]; to: [number,number,number]; color: THREE.Color }[] = [];
    const seen = new Set<string>();
    nodes.forEach(n => {
      n.connectedNodes.forEach(cid => {
        const key = [Math.min(n.id, cid), Math.max(n.id, cid)].join("-");
        if (!seen.has(key) && nodes[cid]) {
          seen.add(key);
          result.push({ from: n.position, to: nodes[cid].position, color: new THREE.Color(THREAT_COLORS[n.threat]) });
        }
      });
    });
    return result;
  }, [nodes]);

  return (
    <>
      {lines.map((line, i) => (
        <Line key={i} points={[line.from, line.to]} color={line.color} lineWidth={0.5} transparent opacity={0.25} />
      ))}
    </>
  );
}

function SceneSetup() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x020209, 0.012);
    scene.background = new THREE.Color(0x020209);
    return () => { scene.fog = null; };
  }, [scene]);
  return null;
}

function ThreatScene3D({ nodes, search, selectedId, onSelect }: { nodes: ThreatNode[]; search: string; selectedId: number | null; onSelect: (id: number | null) => void }) {
  return (
    <>
      <SceneSetup />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} color="#00f5ff" intensity={2} />
      <pointLight position={[-10, -5, -10]} color="#7c3aed" intensity={1.5} />
      <Stars radius={200} depth={60} count={5000} factor={4} saturation={0} fade speed={1} />
      <OrbitControls autoRotate autoRotateSpeed={0.25} enableDamping dampingFactor={0.05} minDistance={5} maxDistance={80} makeDefault />
      <ConnectionLines3D nodes={nodes} />
      {nodes.map((node) => {
        const matched = !search || node.name.toLowerCase().includes(search.toLowerCase());
        return (
          <PlanetNode key={node.id} node={node} isHighlighted={matched && (!!search || selectedId === node.id)} onClick={() => onSelect(selectedId === node.id ? null : node.id)} />
        );
      })}
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ThreatUniverse() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);
  const { setThreatLevel } = useThreatLevel();
  const { scans, clearScans } = useUserScans();

  const staticNodes = useMemo(() => generateNodes(), []);

  const userNodes = useMemo<ThreatNode[]>(() => {
    const base = staticNodes.length;
    return scans.map((scan, i) => {
      const seed = (scan.timestamp % 1000) / 1000;
      const phi = Math.acos(-1 + seed * 2);
      const theta = (i + seed) * 2.4;
      const r = 24 + (i % 4) * 2;
      const threat: ThreatNode["threat"] =
        scan.score >= 70 ? "critical" : scan.score >= 50 ? "high" : scan.score >= 30 ? "medium" : "info";
      return {
        id: base + i,
        name: scan.url,
        type: "domain" as const,
        threat,
        score: scan.score,
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ] as [number, number, number],
        radius: 0.55,
        country: "Scanned by You",
        hostingProvider: scan.hasSSL ? "SSL Verified" : "No SSL",
        malwareFamilies: scan.indicators.slice(0, 2),
        connectedNodes: [],
        sslReuse: !scan.hasSSL,
        campaigns: ["Live User Scan"],
      };
    });
  }, [scans, staticNodes.length]);

  const nodes = useMemo(() => [...staticNodes, ...userNodes], [staticNodes, userNodes]);
  const selectedNode = selectedId !== null ? nodes.find(n => n.id === selectedId) ?? null : null;
  const criticalCount = nodes.filter(n => n.threat === "critical").length;
  const highCount = nodes.filter(n => n.threat === "high").length;

  useEffect(() => {
    setHasWebGL(checkWebGL());
    setThreatLevel(2);
    return () => setThreatLevel(0);
  }, [setThreatLevel]);

  return (
    <Sidebar>
      <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh)" }}>

        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-4 px-6 py-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="pointer-events-auto flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input data-testid="input-universe-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search domains, IPs..."
              className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-black/70 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50" />
          </div>
          <div className="pointer-events-auto flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/40 inline-block" /><span className="text-white/50">{nodes.length} nodes</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /><span className="text-red-400">{criticalCount} critical</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /><span className="text-orange-400">{highCount} high</span></div>
            {userNodes.length > 0 && (
              <button
                onClick={() => { clearScans(); setSelectedId(null); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all duration-200"
                title="Remove your scanned nodes from the universe"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
                <span className="text-white/25">({userNodes.length})</span>
              </button>
            )}
          </div>
          <div className="pointer-events-auto hidden lg:flex items-center gap-3 font-mono text-[10px] text-white/30">
            {(["critical", "high", "medium", "info"] as const).map(t => (
              <div key={t} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THREAT_CSS[t] }} /><span className="capitalize">{t}</span>
              </div>
            ))}
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /><span>APT</span></div>
          </div>
        </div>

        {hasWebGL === null ? (
          <div className="w-full h-full flex items-center justify-center bg-[#020209]">
            <span className="text-primary font-mono text-sm animate-pulse">INITIALIZING THREAT UNIVERSE...</span>
          </div>
        ) : hasWebGL ? (
          <WebGLErrorBoundary fallback={
            <ThreatUniverse2D nodes={nodes} search={search} selectedId={selectedId} onSelect={setSelectedId} />
          }>
            <Canvas className="w-full h-full" camera={{ position: [0, 0, 45], fov: 60 }} gl={{ antialias: true, failIfMajorPerformanceCaveat: false }} onPointerMissed={() => setSelectedId(null)}>
              <Suspense fallback={null}>
                <ThreatScene3D nodes={nodes} search={search} selectedId={selectedId} onSelect={setSelectedId} />
              </Suspense>
            </Canvas>
          </WebGLErrorBoundary>
        ) : (
          <ThreatUniverse2D nodes={nodes} search={search} selectedId={selectedId} onSelect={setSelectedId} />
        )}

        {selectedNode && <NodeInfoPanel node={selectedNode} onClose={() => setSelectedId(null)} />}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] text-white/20 text-center pointer-events-none">
          {hasWebGL ? "Drag to rotate · Scroll to zoom · Click nodes to inspect" : "Click nodes to inspect · Drag to rotate · Scroll to zoom"}
        </div>
      </div>
    </Sidebar>
  );
}
