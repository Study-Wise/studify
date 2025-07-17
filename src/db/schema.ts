<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { bigint, pgTable, varchar, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const threadsTable = pgTable('threads', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  token: varchar('token', { length: 255 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  thread: jsonb().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  isDev: boolean().notNull().default(true),
=======
=======
>>>>>>> Stashed changes
import { bigint, pgTable, varchar, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const threadsTable = pgTable('threads', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  token: bigint('token', { mode: 'number' }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  thread: jsonb().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  isDev: boolean().notNull().default(true),
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
});