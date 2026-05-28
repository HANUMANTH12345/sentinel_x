import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, Search, QrCode, Globe, Globe2, Map, Users, Settings, Info, Mail, History, Layers, Chrome } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sandbox", label: "URL Sandbox", icon: Search },
  { href: "/qr", label: "QR Detector", icon: QrCode },
  { href: "/intelligence", label: "Threat Intel", icon: Globe },
  { href: "/universe", label: "Threat Universe", icon: Globe2 },
  { href: "/threatmap", label: "Threat Map", icon: Map },
  { href: "/bulk", label: "Bulk Scanner", icon: Layers },
  { href: "/browserscan", label: "History Scanner", icon: Chrome },
  { href: "/community", label: "Community", icon: Users },
  { href: "/history", label: "Scan History", icon: History },
  { href: "/admin", label: "Admin Panel", icon: Settings },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col backdrop-blur-sm fixed top-0 left-0 h-full z-40">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]" />
            <span className="text-xl font-bold tracking-tight text-white font-display">Sentinel<span className="text-primary">X</span></span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground")}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(0,245,255,1)]" />}
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]" : "opacity-70 group-hover:opacity-100")} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-border">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Global Threat Level</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
              <span className="text-destructive font-mono font-bold">ELEVATED</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
