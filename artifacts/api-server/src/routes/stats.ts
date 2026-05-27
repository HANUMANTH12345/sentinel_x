import { Router } from "express";
import { db, urlScansTable, qrScansTable, communityReportsTable } from "@workspace/db";
import { sql, avg, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const [urlStats] = await db
    .select({
      total: count(),
      avgScore: avg(urlScansTable.score),
    })
    .from(urlScansTable);

  const [qrStats] = await db
    .select({ total: count() })
    .from(qrScansTable);

  const [reportStats] = await db
    .select({ total: count() })
    .from(communityReportsTable);

  const [highRisk] = await db
    .select({ total: count() })
    .from(urlScansTable)
    .where(sql`${urlScansTable.score} >= 70`);

  res.json({
    urlsAnalyzed: Number(urlStats?.total ?? 0),
    qrScanned: Number(qrStats?.total ?? 0),
    communityReports: Number(reportStats?.total ?? 0),
    highRiskDetected: Number(highRisk?.total ?? 0),
    avgThreatScore: Math.round(Number(urlStats?.avgScore ?? 0)),
  });
});

router.get("/history", async (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? "30", 10), 100);

  const urlScans = await db
    .select({
      id: urlScansTable.id,
      type: sql<string>`'url'`,
      target: urlScansTable.url,
      score: urlScansTable.score,
      hasSSL: urlScansTable.hasSSL,
      createdAt: urlScansTable.createdAt,
    })
    .from(urlScansTable)
    .orderBy(sql`${urlScansTable.createdAt} desc`)
    .limit(limit);

  const qrScans = await db
    .select({
      id: qrScansTable.id,
      type: sql<string>`'qr'`,
      target: qrScansTable.extractedUrl,
      score: qrScansTable.score,
      hasSSL: qrScansTable.hasSSL,
      createdAt: qrScansTable.createdAt,
    })
    .from(qrScansTable)
    .orderBy(sql`${qrScansTable.createdAt} desc`)
    .limit(limit);

  const combined = [...urlScans, ...qrScans]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  res.json(combined);
});

export default router;
