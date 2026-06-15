import { Router, type IRouter } from "express";
import { db, analysesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateAnalysisBody, GetAnalysisParams, DeleteAnalysisParams, ListAnalysesQueryParams } from "@workspace/api-zod";
import { runAnalysisEngine } from "../lib/analysis-engine";

const router: IRouter = Router();

router.get("/analyses", async (req, res): Promise<void> => {
  const parsed = ListAnalysesQueryParams.safeParse(req.query);
  const limit = parsed.success && parsed.data.limit ? Number(parsed.data.limit) : 50;
  const offset = parsed.success && parsed.data.offset ? Number(parsed.data.offset) : 0;
  const userId = parsed.success && parsed.data.userId ? Number(parsed.data.userId) : null;

  let query = db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt)).limit(limit).offset(offset);

  const rows = userId
    ? await db.select().from(analysesTable).where(eq(analysesTable.userId, userId)).orderBy(desc(analysesTable.createdAt)).limit(limit).offset(offset)
    : await query;

  res.json(rows);
});

router.post("/analyses", async (req, res): Promise<void> => {
  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { imageBase64, pair, timeframe, userId } = parsed.data;

  const imageSeed = imageBase64.slice(0, 200).split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const result = runAnalysisEngine(pair, timeframe, imageSeed);

  const truncatedImage = imageBase64.length > 2_000_000 ? imageBase64.slice(0, 2_000_000) : imageBase64;

  const [analysis] = await db.insert(analysesTable).values({
    userId: userId ?? null,
    pair,
    timeframe,
    imageBase64: truncatedImage,
    result,
  }).returning();

  res.status(201).json(analysis);
});

router.get("/analyses/:id", async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [analysis] = await db.select().from(analysesTable).where(eq(analysesTable.id, params.data.id)).limit(1);
  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  res.json(analysis);
});

router.delete("/analyses/:id", async (req, res): Promise<void> => {
  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(analysesTable).where(eq(analysesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
