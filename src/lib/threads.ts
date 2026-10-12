import { eq, desc } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

// JSON-serializable value type
export type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

export interface ToolCallLogEntry {
    toolName: string;
    args: object;
    status: 'success' | 'error';
    result: string;
}

// Message type for AI conversations
export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
    toolCallLog?: ToolCallLogEntry[];
}

export interface ThreadData {
    title?: string;
    isDev?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    messages: Message[];
}

export interface UploadedFile {
    key: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt?: string;
    extractedText?: string | null;
}

type Thread = InferSelectModel<typeof threadsTable>;

async function getMessages(id: string, isAuthorized?: boolean | null) {
    try {
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));

        if (dbResponse.length === 0) {
            return [];
        }

        const thread = dbResponse[0];

        // Check ownership if isAuthorized is provided
        if (!isAuthorized) {
            return []
        }

        // Handle case where thread data is stored as string instead of object
        let threadData: ThreadData;
        const rawThread = thread?.thread;
        if (typeof rawThread === 'string') {
            // Remove trailing commas before ] or } (invalid JSON but sometimes stored)
            const cleanedJson = rawThread.replace(/,\s*([\]}])/g, '$1');
            threadData = JSON.parse(cleanedJson) as ThreadData;
            // Fix the data in DB
            await db.update(threadsTable).set({ thread: threadData }).where(eq(threadsTable.id, id));
        }
        else {
            threadData = rawThread as ThreadData;
        }
        return threadData?.messages ?? [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getMessagesLength(id: string) {
    try {
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));

        if (dbResponse.length === 0) {
            return 0;
        }

        const thread = dbResponse[0];

        // Handle case where thread data is stored as string instead of object
        let threadData: ThreadData;
        const rawThread = thread?.thread;
        if (typeof rawThread === 'string') {
            // Remove trailing commas before ] or } (invalid JSON but sometimes stored)
            const cleanedJson = rawThread.replace(/,\s*([\]}])/g, '$1');
            threadData = JSON.parse(cleanedJson) as ThreadData;
            // Fix the data in DB
            await db.update(threadsTable).set({ thread: threadData }).where(eq(threadsTable.id, id));
        }
        else {
            threadData = rawThread as ThreadData;
        }
        return threadData?.messages?.length ?? 0;
    } catch (e) {
        console.error(e);
        return 0;
    }
}

async function getThreadByToken(id: string, isAuthorized?: boolean | null) {
    try {
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));

        if (dbResponse.length === 0) {
            return null;
        }

        const thread = dbResponse[0];

        // Check ownership if isAuthorized is provided
        if (!isAuthorized) {
            return null;
        }

        return thread;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function getUserThreads(user_email: string) {
    try {
        const threads: Thread[] = await db
            .select()
            .from(threadsTable)
            .where(eq(threadsTable.email, user_email))
            .orderBy(desc(threadsTable.updatedAt));

        return threads;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export { getMessages, getMessagesLength, getThreadByToken, getUserThreads };
