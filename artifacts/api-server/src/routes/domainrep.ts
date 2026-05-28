import { Router } from "express";

const router = Router();

interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, [string, Record<string, unknown>, string, string][]] | unknown;
}

interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

interface RdapResponse {
  ldhName?: string;
  status?: string[];
  entities?: RdapEntity[];
  events?: RdapEvent[];
  nameservers?: { ldhName: string }[];
}

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

function extractVcardFn(entity: RdapEntity): string {
  try {
    const vc = entity.vcardArray as [string, [string, Record<string, unknown>, string, string][]];
    if (!Array.isArray(vc) || vc.length < 2) return "Unknown";
    const fn = vc[1].find((f) => f[0] === "fn");
    return fn ? fn[3] : "Unknown";
  } catch { return "Unknown"; }
}

const DNS_TYPES: Record<number, string> = { 1: "A", 5: "CNAME", 15: "MX", 16: "TXT", 28: "AAAA", 2: "NS" };

async function fetchDns(domain: string, type: string): Promise<string[]> {
  try {
    const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];
    const data = await r.json() as DnsResponse;
    return (data.Answer ?? []).map((a) => a.data);
  } catch { return []; }
}

router.get("/domain-rep", async (req, res) => {
  const raw = (req.query.domain as string | undefined)?.trim();
  if (!raw) { res.status(400).json({ error: "domain is required" }); return; }

  let domain = raw;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `http://${raw}`);
    domain = u.hostname.replace(/^www\./, "");
  } catch { domain = raw.replace(/^www\./, ""); }

  const [rdapRaw, aRecords, mxRecords, txtRecords, nsRecords] = await Promise.allSettled([
    fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.json() as Promise<RdapResponse> : null)
      .catch(() => null),
    fetchDns(domain, "A"),
    fetchDns(domain, "MX"),
    fetchDns(domain, "TXT"),
    fetchDns(domain, "NS"),
  ]);

  const rdap = rdapRaw.status === "fulfilled" ? rdapRaw.value : null;

  let registrar = "Unknown";
  let registeredDate: string | null = null;
  let expiresDate: string | null = null;
  let updatedDate: string | null = null;
  let statuses: string[] = [];
  let nameservers: string[] = [];

  if (rdap) {
    statuses = rdap.status ?? [];
    nameservers = (rdap.nameservers ?? []).map(n => n.ldhName);
    const registrarEntity = (rdap.entities ?? []).find(e => e.roles?.includes("registrar"));
    if (registrarEntity) registrar = extractVcardFn(registrarEntity);
    for (const ev of rdap.events ?? []) {
      if (ev.eventAction === "registration") registeredDate = ev.eventDate;
      else if (ev.eventAction === "expiration") expiresDate = ev.eventDate;
      else if (ev.eventAction === "last changed") updatedDate = ev.eventDate;
    }
  }

  const screenshotUrl = `https://image.thum.io/get/width/800/crop/450/noanimate/${
    raw.startsWith("http") ? raw : `https://${raw}`
  }`;

  res.json({
    domain,
    registrar,
    registeredDate,
    expiresDate,
    updatedDate,
    statuses,
    nameservers,
    dns: {
      a: aRecords.status === "fulfilled" ? aRecords.value : [],
      mx: mxRecords.status === "fulfilled" ? mxRecords.value : [],
      txt: txtRecords.status === "fulfilled" ? txtRecords.value : [],
      ns: nsRecords.status === "fulfilled" ? nsRecords.value : [],
    },
    screenshotUrl,
  });
});

export default router;
