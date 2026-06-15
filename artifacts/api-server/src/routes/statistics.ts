import { Router, type IRouter } from "express";
import { db, journalTable, analysesTable, usersTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { GetStatisticsQueryParams, GetDashboardSummaryQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/statistics", async (req, res): Promise<void> => {
  const parsed = GetStatisticsQueryParams.safeParse(req.query);
  const userId = parsed.success && parsed.data.userId ? Number(parsed.data.userId) : null;

  const rows = userId
    ? await db.select().from(journalTable).where(eq(journalTable.userId, userId))
    : await db.select().from(journalTable);

  const totalTrades = rows.length;
  const winningTrades = rows.filter((r) => r.result === "win").length;
  const losingTrades = rows.filter((r) => r.result === "loss").length;
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100 * 10) / 10 : 0;

  const rrs = rows.map((r) => {
    const risk = Math.abs(r.entryPrice - r.stopLoss);
    const reward = Math.abs(r.takeProfit - r.entryPrice);
    return risk > 0 ? reward / risk : 0;
  });
  const avgRR = rrs.length > 0 ? Math.round((rrs.reduce((a, b) => a + b, 0) / rrs.length) * 100) / 100 : 0;

  const winPnls = rows.filter((r) => r.result === "win").map((r) => Math.abs(r.takeProfit - r.entryPrice));
  const lossPnls = rows.filter((r) => r.result === "loss").map((r) => Math.abs(r.entryPrice - r.stopLoss));
  const grossProfit = winPnls.reduce((a, b) => a + b, 0);
  const grossLoss = lossPnls.reduce((a, b) => a + b, 0);
  const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99.99 : 0;

  const allRrs = rrs.filter((r) => r > 0);
  const bestTrade = allRrs.length > 0 ? Math.max(...allRrs) : null;
  const worstTrade = allRrs.length > 0 ? Math.min(...allRrs) : null;

  res.json({ totalTrades, winningTrades, losingTrades, winRate, avgRR, profitFactor, bestTrade, worstTrade });
});

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const parsed = GetDashboardSummaryQueryParams.safeParse(req.query);
  const userId = parsed.success && parsed.data.userId ? Number(parsed.data.userId) : null;

  const [analysesRows, journalRows, recentAnalyses] = await Promise.all([
    userId
      ? db.select().from(analysesTable).where(eq(analysesTable.userId, userId))
      : db.select().from(analysesTable),
    userId
      ? db.select().from(journalTable).where(eq(journalTable.userId, userId))
      : db.select().from(journalTable),
    userId
      ? db.select().from(analysesTable).where(eq(analysesTable.userId, userId)).orderBy(desc(analysesTable.createdAt)).limit(5)
      : db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt)).limit(5),
  ]);

  const totalAnalyses = analysesRows.length;
  const totalTrades = journalRows.length;
  const winningTrades = journalRows.filter((r) => r.result === "win").length;
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100 * 10) / 10 : 0;

  const confidenceScores = analysesRows
    .map((a) => {
      const r = a.result as Record<string, unknown>;
      return typeof r?.confidenceScore === "number" ? r.confidenceScore : 0;
    })
    .filter((s) => s > 0);
  const avgConfidence = confidenceScores.length > 0
    ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
    : 0;

  const pairMap: Record<string, { count: number; wins: number; total: number }> = {};
  for (const entry of journalRows) {
    if (!pairMap[entry.pair]) pairMap[entry.pair] = { count: 0, wins: 0, total: 0 };
    pairMap[entry.pair].count++;
    pairMap[entry.pair].total++;
    if (entry.result === "win") pairMap[entry.pair].wins++;
  }
  for (const analysis of analysesRows) {
    if (!pairMap[analysis.pair]) pairMap[analysis.pair] = { count: 0, wins: 0, total: 0 };
    pairMap[analysis.pair].count++;
  }
  const pairBreakdown = Object.entries(pairMap).map(([pair, data]) => ({
    pair,
    count: data.count,
    winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
  }));

  res.json({ totalAnalyses, totalTrades, winRate, avgConfidence, recentAnalyses, pairBreakdown });
});

export default router;
