import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const journalTable = pgTable("journal", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  pair: text("pair").notNull(),
  timeframe: text("timeframe").notNull(),
  bias: text("bias").notNull(),
  entryPrice: real("entry_price").notNull(),
  stopLoss: real("stop_loss").notNull(),
  takeProfit: real("take_profit").notNull(),
  result: text("result"),
  notes: text("notes"),
  tradeDate: date("trade_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJournalSchema = createInsertSchema(journalTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type JournalEntry = typeof journalTable.$inferSelect;
