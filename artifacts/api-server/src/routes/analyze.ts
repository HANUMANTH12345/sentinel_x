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
  }).catch(() => {});

  res.json(result);
});

export default router;
