import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, QrCode, Scan, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThreatScoreGauge } from "@/components/ui/ThreatScoreGauge";

export default function QrDetector() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setResults(null);
    setTimeout(() => {
      setIsScanning(false);
      setResults({
        url: "https://pay-tm-verify-kyc-now.com",
        score: 92,
        prob: 98,
        alerts: ["Domain registered 2 days ago", "Impersonates financial institution", "Requests immediate payment"]
      });
    }, 2500);
  };

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
            <QrCode className="w-8 h-8 text-primary" /> QR Scam Detector
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Extract and verify QR code destinations securely.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card/40 border-dashed border-2 border-primary/30 hover:border-primary/60 transition-colors">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">
              <AnimatePresence>
                {isScanning && (
                  <motion.div 
                    initial={{ top: "0%" }}
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-1 bg-primary shadow-[0_0_20px_rgba(0,245,255,1)] z-10"
                  />
                )}
              </AnimatePresence>

              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upload or Scan QR Code</h3>
              <p className="text-muted-foreground mb-8 max-w-xs">Drag and drop an image containing a QR code, or use your device camera.</p>
              
              <div className="flex gap-4">
                <Button onClick={handleSimulateScan} disabled={isScanning} className="bg-primary text-primary-foreground">
                  Upload Image
                </Button>
                <Button variant="outline" onClick={handleSimulateScan} disabled={isScanning}>
                  <Scan className="w-4 h-4 mr-2" /> Use Camera
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {!results && !isScanning && (
              <Card className="bg-card/40 border-white/10 h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <ShieldCheck className="w-16 h-16 opacity-20 mb-4" />
                <p>Upload a QR code to begin analysis.</p>
              </Card>
            )}

            {isScanning && (
              <Card className="bg-card/40 border-white/10 h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-mono text-primary animate-pulse">Extracting payload and analyzing...</p>
              </Card>
            )}

            {results && (
              <Card className="bg-card/40 border-destructive/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-destructive mb-6">
                    <AlertTriangle className="w-8 h-8" />
                    <h3 className="text-2xl font-bold font-display uppercase tracking-widest">Scam Detected</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col items-center">
                       <ThreatScoreGauge score={results.score} />
                    </div>
                    <div className="flex flex-col justify-center gap-4">
                      <div className="bg-black/50 p-3 rounded border border-white/5">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Scam Probability</p>
                        <p className="text-3xl font-bold text-destructive font-mono">{results.prob}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Extracted URL</p>
                      <div className="font-mono text-sm p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded break-all">
                        {results.url}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Risk Alerts</p>
                      <ul className="space-y-2">
                        {results.alerts.map((alert: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2 text-white/80">
                            <span className="text-destructive mt-0.5">•</span> {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}