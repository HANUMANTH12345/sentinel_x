import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, QrCode, Scan, ShieldCheck, AlertTriangle, Shield, Wifi, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThreatScoreGauge } from "@/components/ui/ThreatScoreGauge";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface QrResult {
  rawContent: string;
  extractedUrl: string | null;
  score: number;
  indicators: string[];
  chain?: string[];
  breakdown?: Record<string, number>;
  aiText: string;
  trackers?: string[];
  scamProbability: number;
  hasSSL: boolean;
  hasHSTS?: boolean;
  statusCode?: number | null;
}

const SCAM_EXAMPLES = [
  { title: "UPI Payment Fraud", desc: "Fake payment QR redirecting to look-alike banking page", risk: "Critical" },
  { title: "Fake Government Portal", desc: "QR on flyer leading to cloned government site harvesting Aadhaar data", risk: "Critical" },
  { title: "Phishing WiFi", desc: "QR in hotel lobby pointing to credential-stealing captive portal", risk: "High" },
  { title: "Fake Delivery Notification", desc: "Parcel delivery QR redirecting to malicious APK download", risk: "High" },
];

export default function QrDetector() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<QrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, or WebP)");
      return;
    }
    setFileName(file.name);
    setIsScanning(true);
    setResults(null);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/analyze-qr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as QrResult & { error?: string };
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyzeFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) analyzeFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const breakdownData = results?.breakdown
    ? Object.entries(results.breakdown).map(([name, val]) => ({ name, val }))
    : [];

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
            <QrCode className="w-8 h-8 text-primary" /> QR Scam Detector
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            Upload a QR code image — the backend decodes it, extracts the embedded URL, and runs live threat analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Upload zone */}
          <Card
            className={`border-dashed border-2 transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-primary/30 hover:border-primary/60 bg-card/40"}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <CardContent className="p-12 flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ top: "0%" }}
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-1 bg-primary shadow-[0_0_20px_rgba(0,245,255,1)] z-10"
                  />
                )}
              </AnimatePresence>

              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border transition-colors ${isDragging ? "bg-primary/20 border-primary" : "bg-primary/10 border-primary/20"}`}>
                <Upload className="w-10 h-10 text-primary" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {isScanning ? "Decoding & Analyzing..." : isDragging ? "Drop to Analyze" : "Upload QR Code Image"}
              </h3>
              <p className="text-muted-foreground mb-2 max-w-xs text-sm">
                {isScanning
                  ? `Processing ${fileName}...`
                  : "Drag and drop a QR code image here, or click to browse"}
              </p>
              {isScanning && (
                <p className="text-primary font-mono text-xs animate-pulse mb-6">Extracting payload and running threat analysis...</p>
              )}

              {error && (
                <div className="mb-4 flex items-center gap-2 text-destructive font-mono text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2 w-full">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                data-testid="input-qr-file"
                onChange={handleFileChange}
              />

              <div className="flex gap-4 mt-4">
                <Button
                  data-testid="button-upload-qr"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload Image
                </Button>
                <Button
                  data-testid="button-camera-qr"
                  variant="outline"
                  disabled
                  title="Camera scanner coming soon"
                >
                  <Scan className="w-4 h-4 mr-2" /> Use Camera
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-mono">Supports PNG, JPG, WebP — max 5MB</p>
            </CardContent>
          </Card>

          {/* Results panel */}
          <div className="space-y-4">
            {!results && !isScanning && !error && (
              <Card className="bg-card/40 border-white/10 h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[400px]">
                <ShieldCheck className="w-16 h-16 opacity-20 mb-4" />
                <p className="font-mono text-sm">Upload a QR code image to begin real-time analysis.</p>
                <p className="text-xs mt-2 opacity-60">Results include redirect chain, threat score, AI explanation, and risk breakdown.</p>
              </Card>
            )}

            {isScanning && (
              <Card className="bg-card/40 border-primary/20 h-full flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                <p className="font-mono text-primary animate-pulse text-sm">Decoding QR payload...</p>
                <div className="mt-6 space-y-3 text-left w-full max-w-xs font-mono text-xs text-muted-foreground">
                  {["Parsing image buffer", "Running QR decoder", "Extracting embedded URL", "Running threat analysis", "Checking redirect chain"].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                      {step}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {results && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Score + status badges */}
                <Card className={`border ${results.score >= 70 ? "border-destructive/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : results.score >= 35 ? "border-yellow-500/30" : "border-green-500/30"} bg-card/50`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {results.score >= 70
                        ? <AlertTriangle className="w-7 h-7 text-destructive" />
                        : results.score >= 35
                        ? <AlertTriangle className="w-7 h-7 text-yellow-500" />
                        : <CheckCircle2 className="w-7 h-7 text-green-500" />}
                      <h3 className={`text-xl font-bold font-display uppercase tracking-widest ${results.score >= 70 ? "text-destructive" : results.score >= 35 ? "text-yellow-500" : "text-green-500"}`}>
                        {results.score >= 70 ? "High Risk Detected" : results.score >= 35 ? "Suspicious QR Code" : "QR Code Appears Safe"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mb-4">
                      <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border ${results.hasSSL ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                        {results.hasSSL ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {results.hasSSL ? "SSL" : "No SSL"}
                      </div>
                      <span className="px-3 py-1 text-xs font-mono rounded-full border border-secondary/30 bg-secondary/10 text-secondary">
                        Scam Prob: {results.scamProbability}%
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <ThreatScoreGauge score={results.score} />
                    </div>
                  </CardContent>
                </Card>

                {/* Extracted URL */}
                <Card className="bg-card/50 border-white/10 p-4">
                  <p className="text-xs text-muted-foreground uppercase font-bold font-mono mb-2">Extracted URL</p>
                  <div className={`font-mono text-sm p-3 rounded border break-all ${results.score >= 70 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                    {results.extractedUrl ?? results.rawContent}
                  </div>
                </Card>

                {/* Redirect chain */}
                {results.chain && results.chain.length > 0 && (
                  <Card className="bg-card/50 border-white/10 p-4">
                    <p className="text-xs text-muted-foreground uppercase font-bold font-mono mb-3">Redirect Chain</p>
                    <div className="flex flex-col gap-2 font-mono text-xs">
                      {results.chain.map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`px-3 py-1.5 rounded border truncate max-w-[300px] ${i === 0 ? "bg-primary/10 border-primary/20 text-primary" : "bg-black/40 border-white/10 text-muted-foreground"}`} title={link}>{link}</div>
                          {i < results.chain!.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Reset */}
                <Button
                  data-testid="button-scan-another-qr"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setResults(null); setError(null); setFileName(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                >
                  Scan Another QR Code
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* AI explanation & breakdown — shown when results available */}
        {results && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Card className="bg-card/50 border-white/10 p-6">
              <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> AI Risk Assessment
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{results.aiText}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {results.indicators.map((ind, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-mono rounded bg-destructive/10 text-destructive border border-destructive/20">{ind}</span>
                ))}
              </div>
            </Card>
            {breakdownData.length > 0 && (
              <Card className="bg-card/50 border-white/10 p-6">
                <h3 className="font-display font-bold text-lg mb-3">Risk Breakdown</h3>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdownData}>
                      <XAxis dataKey="name" stroke="#666" fontSize={12} />
                      <Tooltip cursor={{ fill: "#1a1a2e" }} contentStyle={{ backgroundColor: "#0d0d1a", borderColor: "#333", borderRadius: 8 }} formatter={(val: number) => [`${val}`, "Risk"]} />
                      <Bar dataKey="val" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Known scam examples */}
        <div className="mt-4">
          <h2 className="text-xl font-bold font-display text-white mb-6">Known QR Scam Patterns</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCAM_EXAMPLES.map((ex, i) => (
              <Card key={i} className="bg-card/40 border-white/10 hover:border-destructive/40 transition-colors p-5">
                <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded mb-3 inline-block ${ex.risk === "Critical" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"}`}>
                  {ex.risk}
                </div>
                <h4 className="font-bold text-white text-sm mb-2">{ex.title}</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">{ex.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Safety tips */}
        <Card className="mt-8 bg-card/40 border-primary/20 p-6">
          <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" /> QR Safety Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Always verify the URL before entering any personal or financial data",
              "Be suspicious of QR codes placed on top of official stickers",
              "Legitimate services rarely ask for payment via QR in public spaces",
              "Check if the domain matches the organization's official website",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {tip}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Sidebar>
  );
}
