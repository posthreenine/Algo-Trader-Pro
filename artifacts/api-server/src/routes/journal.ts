import { Router, type IRouter } from "express";
import { db, journalTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateJournalEntryBody,
  UpdateJournalEntryBody,
  UpdateJournalEntryParams,
  DeleteJournalEntryParams,
  ListJournalEntriesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/journal", async (req, res): Promise<void> => {
  const parsed = ListJournalEntriesQueryParams.safeParse(req.query);
  const userId = parsed.success && parsed.data.userId ? Number(parsed.data.userId) : null;

  const rows = userId
    ? await db.select().from(journalTable).where(eq(journalTable.userId, userId)).orderBy(desc(journalTable.createdAt))
    : await db.select().from(journalTable).orderBy(desc(journalTable.createdAt));

  res.json(rows);
});

router.post("/journal", async (req, res): Promise<void> => {
  const parsed = CreateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db.insert(journalTable).values(parsed.data).returning();
  res.status(201).json(entry);
});

router.patch("/journal/:id", async (req, res): Promise<void> => {
  const params = UpdateJournalEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined && v !== null) updateData[k] = v;
  }

  const [entry] = await db.update(journalTable).set(updateData).where(eq(journalTable.id, params.data.id)).returning();
  if (!entry) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }
  res.json(entry);
});

router.delete("/journal/:id", async (req, res): Promise<void> => {
  const params = DeleteJournalEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(journalTable).where(eq(journalTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
