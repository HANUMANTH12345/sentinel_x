import { Router } from "express";
import { db, urlScansTable, qrScansTable } from "@workspace/db";
import { desc, sql, gte } from "drizzle-orm";

const router = Router();

router.get("/threat-intel", async (_req, res) => {
  try {
    const urlScans = await db.select().from(urlScansTable);
    const qrScans = await db.select().from(qrScansTable);

    const totalUrlScans = urlScans.length;
    const totalQrScans = qrScans.length;

    const highRiskThreats = urlScans.filter(
      (s) => s.score >= 70,
    ).length;

    const countriesDetected = new Set(
      urlScans
        .map((s) => s.sourceCountry)
        .filter(Boolean),
    ).size;

    const topDomains = await db
      .select({
        url: urlScansTable.url,
        score: urlScansTable.score,
        country: urlScansTable.sourceCountry,
      })
      .from(urlScansTable)
      .orderBy(desc(urlScansTable.score))
      .limit(10);

    const recentThreats = await db
      .select({
        url: urlScansTable.url,
        score: urlScansTable.score,
        country: urlScansTable.sourceCountry,
        createdAt: urlScansTable.createdAt,
      })
      .from(urlScansTable)
      .orderBy(desc(urlScansTable.createdAt))
      .limit(15);

    const countryStats = Object.entries(
  urlScans.reduce((acc: Record<string, number>, scan) => {
    if (scan.sourceCountry) {
      acc[scan.sourceCountry] = (acc[scan.sourceCountry] ?? 0) + 1;
    }
    return acc;
  }, {}),
)
  .map(([country, count]) => ({ country, count }))
  .sort((a, b) => b.count - a.count);

res.json({
  totalUrlScans,
  totalQrScans,
  highRiskThreats,
  countriesDetected,
  topDomains,
  recentThreats,
  countryStats,
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load threat intelligence" });
  }
});

export default router;