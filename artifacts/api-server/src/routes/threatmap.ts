import { Router } from "express";
import { db, urlScansTable, qrScansTable, communityReportsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// Geographic data for source countries based on TLD / threat patterns
const TLD_GEO: Record<string, { lat: number; lon: number; country: string; city: string }> = {
  ru: { lat: 55.75, lon: 37.62, country: "Russia", city: "Moscow" },
  cn: { lat: 39.90, lon: 116.41, country: "China", city: "Beijing" },
  ir: { lat: 35.69, lon: 51.39, country: "Iran", city: "Tehran" },
  kp: { lat: 39.04, lon: 125.76, country: "North Korea", city: "Pyongyang" },
  ua: { lat: 50.45, lon: 30.52, country: "Ukraine", city: "Kyiv" },
  ro: { lat: 44.43, lon: 26.10, country: "Romania", city: "Bucharest" },
  ng: { lat: 6.45, lon: 3.40, country: "Nigeria", city: "Lagos" },
  br: { lat: -15.78, lon: -47.93, country: "Brazil", city: "Brasilia" },
  in: { lat: 28.61, lon: 77.21, country: "India", city: "New Delhi" },
  pk: { lat: 33.72, lon: 73.06, country: "Pakistan", city: "Islamabad" },
  ph: { lat: 14.60, lon: 120.98, country: "Philippines", city: "Manila" },
  vn: { lat: 21.03, lon: 105.83, country: "Vietnam", city: "Hanoi" },
  cc: { lat: 55.75, lon: 37.62, country: "Russia", city: "Moscow" },
  tk: { lat: 39.90, lon: 116.41, country: "China", city: "Shanghai" },
  xyz: { lat: 50.45, lon: 30.52, country: "Ukraine", city: "Kharkiv" },
  io: { lat: 6.45, lon: 3.40, country: "Nigeria", city: "Abuja" },
  net: { lat: 44.43, lon: 26.10, country: "Romania", city: "Cluj" },
  eu: { lat: 52.52, lon: 13.40, country: "Germany", city: "Berlin" },
};

const DEFAULT_SOURCES = [
  { lat: 55.75, lon: 37.62, country: "Russia", city: "Moscow" },
  { lat: 39.90, lon: 116.41, country: "China", city: "Beijing" },
  { lat: 35.69, lon: 51.39, country: "Iran", city: "Tehran" },
  { lat: 44.43, lon: 26.10, country: "Romania", city: "Bucharest" },
  { lat: 6.45, lon: 3.40, country: "Nigeria", city: "Lagos" },
  { lat: -15.78, lon: -47.93, country: "Brazil", city: "Sao Paulo" },
  { lat: 50.45, lon: 30.52, country: "Ukraine", city: "Kyiv" },
];

const TARGETS = [
  { lat: 37.09, lon: -95.71, country: "United States", city: "Washington DC" },
  { lat: 51.51, lon: -0.13, country: "United Kingdom", city: "London" },
  { lat: 48.86, lon: 2.35, country: "France", city: "Paris" },
  { lat: 52.52, lon: 13.40, country: "Germany", city: "Berlin" },
  { lat: 35.68, lon: 139.69, country: "Japan", city: "Tokyo" },
  { lat: 43.65, lon: -79.38, country: "Canada", city: "Toronto" },
  { lat: -33.87, lon: 151.21, country: "Australia", city: "Sydney" },
  { lat: 37.57, lon: 126.98, country: "South Korea", city: "Seoul" },
  { lat: 59.33, lon: 18.07, country: "Sweden", city: "Stockholm" },
  { lat: 1.35, lon: 103.82, country: "Singapore", city: "Singapore" },
];

function getTld(url: string): string {
  try {
    const hostname = new URL(url.startsWith("http") ? url : `http://${url}`).hostname;
    const parts = hostname.split(".");
    return parts[parts.length - 1].toLowerCase();
  } catch { return "com"; }
}

function getSource(url: string, idx: number) {
  const tld = getTld(url);
  if (TLD_GEO[tld]) return TLD_GEO[tld];
  return DEFAULT_SOURCES[idx % DEFAULT_SOURCES.length];
}

function getTarget(idx: number) {
  return TARGETS[idx % TARGETS.length];
}

function severityFromScore(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function typeFromIndicators(indicators: string[]): string {
  if (!indicators || indicators.length === 0) return "probe";
  const text = indicators.join(" ").toLowerCase();
  if (text.includes("phish")) return "phishing";
  if (text.includes("malware") || text.includes("malicious")) return "malware";
  if (text.includes("redirect")) return "redirect_attack";
  if (text.includes("credential") || text.includes("harvest")) return "credential_theft";
  if (text.includes("javascript") || text.includes("script")) return "script_injection";
  if (text.includes("squat")) return "typosquat";
  return "phishing";
}

router.get("/threatmap", async (req, res) => {
  const limit = 40;

  const [urlScans, qrScans, reports] = await Promise.all([
    db.select().from(urlScansTable).orderBy(sql`${urlScansTable.createdAt} desc`).limit(limit),
    db.select().from(qrScansTable).orderBy(sql`${qrScansTable.createdAt} desc`).limit(limit / 2),
    db.select().from(communityReportsTable).orderBy(sql`${communityReportsTable.createdAt} desc`).limit(limit / 2),
  ]);

  console.log("URL SCANS FOUND:", urlScans.length);

if (urlScans.length > 0) {
  console.log("FIRST URL SCAN:", urlScans[0]);
}

  const events: object[] = [];

  urlScans.forEach((scan, i) => {
    if (scan.score < 20) return;
    events.push({
      id: `url-${scan.id}`,
      source: getSource(scan.url, i),
      target: getTarget(i),
      type: typeFromIndicators(scan.indicators),
      severity: severityFromScore(scan.score),
      score: scan.score,
      url: scan.url,
      timestamp: scan.createdAt,
      origin: "url_scan",
    });
  });

  qrScans.forEach((scan, i) => {
    if (scan.score < 20) return;
    events.push({
      id: `qr-${scan.id}`,
      source: getSource(scan.extractedUrl, i + 10),
      target: getTarget(i + 3),
      type: "qr_phishing",
      severity: severityFromScore(scan.score),
      score: scan.score,
      url: scan.extractedUrl,
      timestamp: scan.createdAt,
      origin: "qr_scan",
    });
  });

  reports.forEach((report, i) => {
    const geo = getSource(report.domain, i + 5);
    events.push({
      id: `report-${report.id}`,
      source: geo,
      target: getTarget(i + 1),
      type: report.type || "phishing",
      severity: report.votes > 5 ? "high" : "medium",
      score: Math.min(95, 50 + report.votes * 5),
      url: report.domain,
      timestamp: report.createdAt,
      origin: "community_report",
    });
  });

  // If DB is empty (dev/demo), seed with simulated events so the map looks alive
 /* if (events.length === 0) {
    const DEMO_ATTACKS = [
      { url: "secure-login-paypal.ru", score: 89, type: "phishing" },
      { url: "verify-account-amazon.xyz", score: 82, type: "credential_theft" },
      { url: "free-crypto-giveaway-now.ru", score: 95, type: "malware" },
      { url: "facebook-login-secure.tk", score: 77, type: "phishing" },
      { url: "microsoft-support.xyz", score: 73, type: "typosquat" },
      { url: "apple-icloud.cc", score: 85, type: "credential_theft" },
      { url: "irs-refund.cc", score: 91, type: "phishing" },
      { url: "bitcoin-invest-now.com", score: 68, type: "scam" },
      { url: "steam-trade-offer.tk", score: 80, type: "phishing" },
      { url: "dhl-tracking-parcel.eu", score: 72, type: "redirect_attack" },
      { url: "zoom-meeting-invite.net", score: 65, type: "script_injection" },
      { url: "coinbase-verify.net", score: 78, type: "credential_theft" },
      { url: "office365-reset.cc", score: 88, type: "phishing" },
      { url: "docusign-verify.net", score: 75, type: "credential_theft" },
      { url: "netflix-billing.xyz", score: 70, type: "phishing" },
    ];
    DEMO_ATTACKS.forEach((a, i) => {
      events.push({
        id: `demo-${i}`,
        source: getSource(a.url, i),
        target: getTarget(i),
        type: a.type,
        severity: severityFromScore(a.score),
        score: a.score,
        url: a.url,
        timestamp: new Date(Date.now() - i * 180000).toISOString(),
        origin: "demo",
      });
    });
  }*/

  events.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
    new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime()
  );

  res.json({ events, total: events.length });
});

export default router;
