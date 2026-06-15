import { Router, type IRouter } from "express";
import { db, usersTable, analysesTable, journalTable } from "@workspace/db";
import { desc, gte, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/users", async (_req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    username: usersTable.username,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users);
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalAnalyses] = await db.select({ count: count() }).from(analysesTable);
  const [totalJournalEntries] = await db.select({ count: count() }).from(journalTable);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [analysesToday] = await db.select({ count: count() }).from(analysesTable).where(gte(analysesTable.createdAt, startOfDay));

  res.json({
    totalUsers: Number(totalUsers?.count ?? 0),
    totalAnalyses: Number(totalAnalyses?.count ?? 0),
    totalJournalEntries: Number(totalJournalEntries?.count ?? 0),
    analysesToday: Number(analysesToday?.count ?? 0),
  });
});

export default router;
