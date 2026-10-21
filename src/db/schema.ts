import config from '@/lib/config';
import type { ThreadData, UploadedFile } from '@/lib/threads';
import type { ThreadContent } from '@/lib/content/latest/index';

import { pgTable, varchar, timestamp, jsonb, boolean, text } from 'drizzle-orm/pg-core';

const threadsTable = pgTable('threads', {
    id: text('id').primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    thread: jsonb('thread').$type<ThreadData | string>().notNull().default({ messages: [] }),
    uploadedFiles: jsonb('uploadedFiles').$type<UploadedFile[]>().notNull().default([]),
    content: jsonb('content').$type<ThreadContent>().notNull().default({}),
    email: text('email'),
    category: text('category').notNull().default(config.defaultCategory),
    mode: text('mode').notNull().default(config.defaultMode),
    model: text('model').notNull().default(config.model),
    provider: text('provider').notNull().default(config.provider),
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

export { threadsTable, questionTable };
