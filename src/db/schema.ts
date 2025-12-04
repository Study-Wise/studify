import { pgTable, varchar, timestamp, jsonb, boolean, bigint, text } from 'drizzle-orm/pg-core';

const threadsTable = pgTable('threads', {
    id: text('id').primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    thread: jsonb('thread').notNull().default({}),
    uploadedFiles: text('uploadedFiles').array().default([]),
    email: text('email'),
    category: text('category').notNull(),
    mode: text('mode').notNull(),
    model: text('model'),
    generatedInfographic: jsonb('generatedInfographic').notNull().default({}),
    generatedStudyGuide: text('generatedStudyGuide'),
    generatedReferenceSheet: text('generatedReferenceSheet'),
    isPublic: boolean('isPublic').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    isDev: boolean('isDev').notNull().default(true),
});

export { threadsTable };
