import dns from "dns/promises";
//import geoip from "geoip-lite";
import { Router } from "express";
import { URL } from "url";
import { analyzeUrl } from "../lib/url-analyzer.js";
import { db, urlScansTable } from "@workspace/db";

const router = Router();

router.post("/analyze-url", async (req, res) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing or invalid url field" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url.startsWith("http") ? url : `http://${url}`);
  } catch {
    res.status(400).json({ error: "Cannot parse URL" });
    return;
  }

  const result = await analyzeUrl(parsed.href);
  let sourceIp: string | null = null;
let sourceCountry: string | null = null;
let sourceCity: string | null = null;
let sourceLat: number | null = null;
let sourceLon: number | null = null;
try {
  const { address } = await dns.lookup(parsed.hostname);

  sourceIp = address;

  const response = await fetch(`http://ip-api.com/json/${address}`);
  const geo: any = await response.json();

  if (geo?.status === "success") {
    sourceCountry = geo.country ?? null;
    sourceCity = geo.city ?? null;
    sourceLat = geo.lat ?? null;
    sourceLon = geo.lon ?? null;
  }
} catch (err) {
  console.error("Geo lookup failed:", err);
}

  console.log("SCAN SCORE:", result.score);

  // Persist to DB (non-blocking)
db.insert(urlScansTable).values({
  url: parsed.href,
  score: result.score,
  indicators: result.indicators,
  chain: result.chain,
  breakdown: result.breakdown,
  aiText: result.aiText,
  trackers: result.trackers,
  hasSSL: result.hasSSL,
  hasHSTS: result.hasHSTS,
  statusCode: result.statusCode,

  sourceIp,
  sourceCountry,
  sourceCity,
  sourceLat,
  sourceLon,
})
.then(() => console.log("SCAN SAVED"))
.catch((err) => console.error("SCAN SAVE FAILED:", err));

  res.json(result);
});

export default router;
