import { Router, Request, Response } from "express";
import multer from "multer";
import { analyzeUrl } from "../lib/url-analyzer.js";
import { db, qrScansTable } from "@workspace/db";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/analyze-qr", upload.single("image"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file uploaded" });
    return;
  }

  let jsQR: typeof import("jsqr").default;
  let Jimp: typeof import("jimp").Jimp;

  try {
    const jsqrModule = await import("jsqr");
    jsQR = jsqrModule.default;
    const jimpModule = await import("jimp");
    Jimp = jimpModule.Jimp;
  } catch {
    res.status(500).json({ error: "QR decoding library unavailable" });
    return;
  }

  let extractedContent: string | null = null;

  try {
    const image = await Jimp.fromBuffer(req.file.buffer);
    const { data, width, height } = image.bitmap;
    const code = jsQR(new Uint8ClampedArray(data), width, height);
    if (code) {
      extractedContent = code.data;
    }
  } catch {
    res.status(422).json({ error: "Could not read image — please upload a clear QR code image (PNG or JPG)" });
    return;
  }

  if (!extractedContent) {
    res.status(422).json({ error: "No QR code detected in the image. Try a higher-resolution or less obstructed image." });
    return;
  }

  // Check if the content is a URL
  let targetUrl: string;
  try {
    const parsed = new URL(extractedContent.startsWith("http") ? extractedContent : `https://${extractedContent}`);
    targetUrl = parsed.href;
  } catch {
    // Not a URL — return the content anyway with a low-risk report
    res.json({
      rawContent: extractedContent,
      extractedUrl: null,
      score: 5,
      indicators: ["QR code does not contain a URL — plain text payload"],
      aiText: `This QR code encodes plain text content: "${extractedContent.slice(0, 100)}". No URL was found, so no network-level threat analysis was performed.`,
      scamProbability: 5,
      hasSSL: false,
    });
    return;
  }

  const analysis = await analyzeUrl(targetUrl);
  const scamProbability = Math.min(Math.round(analysis.score * 1.05), 99);

  // Persist to DB
  db.insert(qrScansTable).values({
    extractedUrl: targetUrl,
    rawContent: extractedContent,
    score: analysis.score,
    indicators: analysis.indicators,
    aiText: analysis.aiText,
    scamProbability,
    hasSSL: analysis.hasSSL,
  }).catch(() => {});

  res.json({
    rawContent: extractedContent,
    extractedUrl: targetUrl,
    score: analysis.score,
    indicators: analysis.indicators,
    chain: analysis.chain,
    breakdown: analysis.breakdown,
    aiText: analysis.aiText,
    trackers: analysis.trackers,
    scamProbability,
    hasSSL: analysis.hasSSL,
    hasHSTS: analysis.hasHSTS,
    statusCode: analysis.statusCode,
  });
});

export default router;
