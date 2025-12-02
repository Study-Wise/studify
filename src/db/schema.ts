import { pgTable, varchar, timestamp, jsonb, boolean, bigint, text } from 'drizzle-orm/pg-core';

const threadsTable = pgTable('threads', {
    id: text('id').primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    thread: jsonb().notNull().default({}),
    uploadedFiles: text('uploadedFiles').array().default([]),
    email: text('email'),
    generatedInfographic: jsonb().notNull().default({}),
    isPublic: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
    isDev: boolean().notNull().default(true),
});

export { threadsTable };