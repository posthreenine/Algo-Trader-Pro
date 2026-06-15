import { Router, type IRouter } from "express";
import { db, watchlistTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { AddToWatchlistBody, RemoveFromWatchlistParams, ListWatchlistQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/watchlist", async (req, res): Promise<void> => {
  const parsed = ListWatchlistQueryParams.safeParse(req.query);
  const userId = parsed.success && parsed.data.userId ? Number(parsed.data.userId) : null;

  const rows = userId
    ? await db.select().from(watchlistTable).where(eq(watchlistTable.userId, userId)).orderBy(desc(watchlistTable.createdAt))
    : await db.select().from(watchlistTable).orderBy(desc(watchlistTable.createdAt));

  res.json(rows);
});

router.post("/watchlist", async (req, res): Promise<void> => {
  const parsed = AddToWatchlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(watchlistTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.delete("/watchlist/:id", async (req, res): Promise<void> => {
  const params = RemoveFromWatchlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(watchlistTable).where(eq(watchlistTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Watchlist item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
