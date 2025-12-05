import { pgTable, varchar, timestamp, jsonb, boolean, bigint, text } from 'drizzle-orm/pg-core';

import config from '../lib/config';

const threadsTable = pgTable('threads', {
    id: text('id').primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    thread: jsonb('thread').notNull().default({}),
    uploadedFiles: text('uploadedFiles').array().default([]),
    email: text('email'),
    category: text('category').notNull().default(config.defaultCategory),
    mode: text('mode').notNull().default(config.defaultMode),
    model: text('model').notNull().default(config.model),
    provider: text('provider').notNull().default(config.provider),
    generatedStudyGuide: text('generatedStudyGuide'),
    generatedReferenceSheet: text('generatedReferenceSheet'),
    generatedInfographic: jsonb('generatedInfographic').notNull().default({}),
    generatedWebpage: text('generatedWebpage'),
    isPublic: boolean('isPublic').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    isDev: boolean('isDev').notNull().default(true),
});

export { threadsTable };
