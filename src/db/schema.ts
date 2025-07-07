import { bigint, pgTable, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const threadsTable = pgTable('threads', {
  token: bigint('token', { mode: 'number' }).primaryKey().notNull(),
  title: varchar({ length: 255 }).notNull(),
  thread: jsonb().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});