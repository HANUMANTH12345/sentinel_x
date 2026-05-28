import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Globe2, Calendar, Server, FileText, Monitor, Loader2, AlertTriangle } from "lucide-react";

interface DnsData { a: string[]; mx: string[]; txt: string[]; ns: string[]; }
interface DomainRepData {
  domain: string;
  registrar: string;
  registeredDate: string | null;
  expiresDate: string | null;
  updatedDate: string | null;
  statuses: string[];
  nameservers: string[];
  dns: DnsData;
  screenshotUrl: string;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return iso; }
}

function ageWarning(iso: string | null): string | null {
  if (!iso) return null;
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (days < 30) return `Only ${Math.round(days)} days old — newly registered domain`;
  return null;
}

function DnsSection({ label, records, icon: Icon }: { label: string; records: string[]; icon: React.FC<{ className?: string }> }) {
  if (records.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3 h-3" />{label}
      </p>
      <div className="space-y-1">
        {records.slice(0, 5).map((r, i) => (
          <p key={i} className="font-mono text-[11px] text-cyan-300/80 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10 truncate">{r}</p>
        ))}
        {records.length > 5 && <p className="text-[10px] text-white/25 font-mono">+{records.length - 5} more</p>}
      </div>
    </div>
  );
}

export function DomainRepCard({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<DomainRepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    setError(null);
    fetch(`/api/domain-rep?domain=${encodeURIComponent(url)}`)
      .then(r => r.ok ? r.json() : r.json().then((e: { error?: string }) => Promise.reject(e.error ?? "Failed")))
      .then((d: DomainRepData) => { setData(d); setLoading(false); })
      .catch((e: unknown) => { setError(String(e)); setLoading(false); });
  }, [open, url, data]);

  const warning = data ? ageWarning(data.registeredDate) : null;
  const isExpiringSoon = data?.expiresDate
    ? (new Date(data.expiresDate).getTime() - Date.now()) / 86400000 < 30
    : false;

  return (
    <div className="rounded-xl border border-white/8 bg-black/40 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2.5 font-mono text-sm text-white/70">
          <Globe2 className="w-4 h-4 text-cyan-400" />
          <span>Domain Reputation</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">WHOIS · DNS · Preview</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 p-5">
              {loading && (
                <div className="flex items-center gap-2 text-white/40 font-mono text-sm py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching WHOIS · DNS · Screenshot...
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-red-400 font-mono text-sm py-4">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}
              {data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    {(warning || isExpiringSoon) && (
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{warning ?? "Domain expires within 30 days"}</span>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />Registration
                      </p>
                      <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                        {([
                          ["Registered", fmt(data.registeredDate)],
                          ["Expires", fmt(data.expiresDate)],
                          ["Updated", fmt(data.updatedDate)],
                        ] as [string, string][]).map(([label, val]) => (
                          <div key={label} className="bg-white/3 rounded-lg px-3 py-2 border border-white/5">
                            <p className="text-white/30 text-[10px] mb-0.5">{label}</p>
                            <p className={`text-white font-bold text-[11px] ${label === "Expires" && isExpiringSoon ? "text-orange-400" : ""}`}>{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Server className="w-3 h-3" />Registrar
                      </p>
                      <p className="font-mono text-sm text-white/80 bg-white/3 rounded-lg px-3 py-2 border border-white/5">{data.registrar}</p>
                    </div>

                    {data.statuses.length > 0 && (
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Status Flags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.statuses.map(s => (
                            <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-white/3 text-white/60">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />DNS Records
                      </p>
                      <DnsSection label="A (IPv4)" records={data.dns.a} icon={Server} />
                      <DnsSection label="MX (Mail)" records={data.dns.mx} icon={FileText} />
                      <DnsSection label="TXT" records={data.dns.txt} icon={FileText} />
                      <DnsSection label="NS (Nameservers)" records={data.dns.ns} icon={Server} />
                      {!data.dns.a.length && !data.dns.mx.length && !data.dns.txt.length && (
                        <p className="text-white/25 font-mono text-xs">No DNS records found</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Monitor className="w-3 h-3" />Page Preview
                    </p>
                    <div className="relative rounded-lg overflow-hidden border border-white/8 bg-black/60 aspect-[16/9]">
                      {!imgLoaded && !imgError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                        </div>
                      )}
                      {imgError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2">
                          <Monitor className="w-8 h-8" />
                          <span className="font-mono text-xs">Preview unavailable</span>
                        </div>
                      ) : (
                        <img
                          src={data.screenshotUrl}
                          alt={`Preview of ${data.domain}`}
                          className="w-full h-full object-cover object-top"
                          style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s" }}
                          onLoad={() => setImgLoaded(true)}
                          onError={() => { setImgError(true); setImgLoaded(false); }}
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="font-mono text-[10px] text-white/50 truncate">{data.domain}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
