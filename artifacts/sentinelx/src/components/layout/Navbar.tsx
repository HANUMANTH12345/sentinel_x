import { Link } from "wouter";
import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight text-white font-display">Sentinel<span className="text-primary">X</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/sandbox" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Sandbox</Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Live Dashboard</Link>
          <Link href="/intelligence" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Intelligence</Link>
          <Link href="/community" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Community</Link>
          <Button asChild variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,245,255,0.5)]">
            <Link href="/dashboard">Launch Console</Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </nav>
  );
}