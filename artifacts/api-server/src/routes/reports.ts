import { Router } from "express";
import { db, communityReportsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/reports", async (req, res) => {
  const reports = await db
    .select()
    .from(communityReportsTable)
    .orderBy(desc(communityReportsTable.votes))
    .limit(50);
  res.json(reports);
});

router.post("/reports", async (req, res) => {
  const { title, reporter, type, domain, description } = req.body as {
    title?: string; reporter?: string; type?: string; domain?: string; description?: string;
  };

  if (!title || !type || !domain || !description) {
    res.status(400).json({ error: "title, type, domain, and description are required" });
    return;
  }

  const [report] = await db
    .insert(communityReportsTable)
    .values({
      title,
      reporter: reporter || "anonymous",
      type,
      domain,
      description,
      status: "pending",
    })
    .returning();

  res.status(201).json(report);
});

router.post("/reports/:id/vote", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { direction } = req.body as { direction?: "up" | "down" };

  if (isNaN(id) || !["up", "down"].includes(direction ?? "")) {
    res.status(400).json({ error: "Valid id and direction ('up'|'down') are required" });
    return;
  }

  const delta = direction === "up" ? 1 : -1;

  const [updated] = await db
    .update(communityReportsTable)
    .set({ votes: sql`${communityReportsTable.votes} + ${delta}` })
    .where(eq(communityReportsTable.id, id))
    .returning({ votes: communityReportsTable.votes });

  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json({ votes: updated.votes });
});

export default router;
