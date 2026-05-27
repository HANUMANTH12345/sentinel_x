import { Router } from "express";
import { db, contactSubmissionsTable } from "@workspace/db";

const router = Router();

router.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body as {
    name?: string; email?: string; subject?: string; message?: string;
  };

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "name, email, subject, and message are required" });
    return;
  }

  const [submission] = await db
    .insert(contactSubmissionsTable)
    .values({ name, email, subject, message })
    .returning({ id: contactSubmissionsTable.id });

  res.status(201).json({ success: true, id: submission.id });
});

export default router;
