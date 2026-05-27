import { useEffect, useRef } from "react";
import { useThreatLevel } from "@/contexts/ThreatLevelContext";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

const LEVEL_COLORS = ["#00f5ff", "#ff8c00", "#ff2020", "#ff0000"];
const LEVEL_SPEEDS = [0.3, 0.7, 1.5, 2.5];
const LEVEL_OPACITY = [0.3, 0.45, 0.6, 0.75];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function CyberStorm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { threatLevel } = useThreatLevel();
  const threatRef = useRef(threatLevel);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const scanlineYRef = useRef(0);
  const lastLightningRef = useRef(0);
  const lastFlashRef = useRef(0);
  const flashOpacityRef = useRef(0);

  useEffect(() => {
    threatRef.current = threatLevel;
  }, [threatLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    const spawnParticles = (count: number) => {
      const arr: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const level = threatRef.current;
        const speed = LEVEL_SPEEDS[level] * (0.5 + Math.random());
        const angle = Math.random() * Math.PI * 2;
        arr.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1 + Math.random() * (level === 0 ? 1.5 : level === 1 ? 3 : 4),
          opacity: LEVEL_OPACITY[level] * (0.5 + Math.random() * 0.5),
          color: LEVEL_COLORS[level],
          life: Math.random(),
          maxLife: 0.8 + Math.random() * 0.2,
        });
      }
      return arr;
    };

    particlesRef.current = spawnParticles(150);

    const draw = (ts: number) => {
      frameRef.current = requestAnimationFrame(draw);
      const level = threatRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (level >= 3) {
        ctx.fillStyle = "rgba(255,0,0,0.025)";
        ctx.fillRect(0, 0, w, h);
      }

      const gridAlpha = 0.02 + level * 0.015;
      const gridColor = level >= 2 ? `rgba(255,50,50,${gridAlpha})` : `rgba(0,245,255,${gridAlpha})`;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        const targetColor = LEVEL_COLORS[level];
        const targetSpeed = LEVEL_SPEEDS[level];
        p.color = targetColor;
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > 0) {
          const factor = lerp(currentSpeed, targetSpeed, 0.02) / currentSpeed;
          p.vx *= factor;
          p.vy *= factor;
        }
        p.x += p.vx + Math.sin(ts * 0.0005 + i) * 0.2;
        p.y += p.vy + Math.cos(ts * 0.0005 + i) * 0.2;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        p.opacity = LEVEL_OPACITY[level] * (0.6 + 0.4 * Math.sin(ts * 0.001 + i));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, "0");
        ctx.fill();
        if (level >= 1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color + "0a";
          ctx.fill();
        }
      }

      if (level >= 2 && ts - lastLightningRef.current > 200) {
        if (Math.random() < 0.15) {
          lastLightningRef.current = ts;
          ctx.strokeStyle = level >= 3 ? "rgba(255,80,80,0.8)" : "rgba(255,120,0,0.6)";
          ctx.lineWidth = 1;
          ctx.shadowColor = level >= 3 ? "#ff2020" : "#ff8c00";
          ctx.shadowBlur = 8;
          let lx = Math.random() * w;
          let ly = 0;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          for (let s = 0; s < 8; s++) {
            lx += (Math.random() - 0.5) * 80;
            ly += Math.random() * (h / 8);
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      scanlineYRef.current += 0.5 + level * 0.3;
      if (scanlineYRef.current > h) scanlineYRef.current = 0;
      const scanColor = level >= 2 ? "rgba(255,60,60,0.06)" : "rgba(0,245,255,0.04)";
      ctx.fillStyle = scanColor;
      ctx.fillRect(0, scanlineYRef.current, w, 2);

      if (level >= 3 && ts - lastFlashRef.current > 5000) {
        lastFlashRef.current = ts;
        flashOpacityRef.current = 0.15;
      }
      if (flashOpacityRef.current > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashOpacityRef.current})`;
        ctx.fillRect(0, 0, w, h);
        flashOpacityRef.current = Math.max(0, flashOpacityRef.current - 0.008);
      }

      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, Math.max(w, h) * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, `rgba(0,0,0,${0.5 + level * 0.1})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
}
