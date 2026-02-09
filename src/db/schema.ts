import { pgTable, varchar, timestamp, jsonb, boolean, text } from 'drizzle-orm/pg-core';

import config from '@/lib/config';

const threadsTable = pgTable('threads', {
    id: text('id').primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    thread: jsonb('thread').notNull().default({}),
    uploadedFiles: jsonb('uploadedFiles').notNull().default([]),
    email: text('email'),
    category: text('category').notNull().default(config.defaultCategory),
    mode: text('mode').notNull().default(config.defaultMode),
    model: text('model').notNull().default(config.model),
    provider: text('provider').notNull().default(config.provider),
    generatedStudyGuide: text('generatedStudyGuide'),
    generatedReferenceSheet: text('generatedReferenceSheet'),
    generatedInfographic: jsonb('generatedInfographic').notNull().default({}),
    generatedWebpage: text('generatedWebpage'),
    generatedMindMap: text('generatedMindMap'),
    generatedAdditionalResources: text('generatedAdditionalResources'),
    generatedFlashcards: text('generatedFlashcards'),
    generatedPracticeQuestions: text('generatedPracticeQuestions'),
    generatedSlideshow: jsonb('generatedSlideshow').notNull().default({}),
    isPublic: boolean('isPublic').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    isDev: boolean('isDev').notNull().default(true),
});

const questionTable = pgTable('questions', {
    id: text('id').primaryKey(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    category: text('category').notNull(),
    mode: text('mode').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    viewCount: text('viewCount').notNull().default('0'),
    isPublic: boolean('isPublic').notNull().default(true),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Export Better Auth tables
export * from '@/db/auth-schema';

export { threadsTable, questionTable };
