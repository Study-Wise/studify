import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import { eq, desc } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

export type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

export interface ToolCallLogEntry {
    toolName: string;
    args: object;
    status: 'success' | 'error';
    result: string;
}

export interface Message {
    id?: string;
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

export function parseThreadData(value: ThreadData | string): ThreadData {
    const raw = typeof value === 'string' ? value.replace(/,\s*([\]}])/g, '$1') : value;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (typeof parsed !== 'object' || parsed === null || !('messages' in parsed) || !Array.isArray(parsed.messages)) {
        throw new Error('Invalid thread data');
    }
    const messages: Message[] = parsed.messages.map((message: Message) => {
        if (typeof message !== 'object' || message === null || Array.isArray(message) || !('role' in message) || !('content' in message)) {
            throw new Error('Invalid thread message');
        }
        if ((message.role !== 'system' && message.role !== 'user' && message.role !== 'assistant') || typeof message.content !== 'string') {
            throw new Error('Invalid thread message');
        }
        return message;
    });
    return { messages };
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

        if (dbResponse.length === 0) return [];

        if (!isAuthorized) return []

        // Handle case where thread data is stored as string instead of object
        const rawThread = dbResponse[0]?.thread;
        if (typeof rawThread === 'string') {
            // Remove trailing commas before ] or } (invalid JSON but sometimes stored)
            const cleanedJson = rawThread.replace(/,\s*([\]}])/g, '$1');
            await db.update(threadsTable).set({ thread: parseThreadData(cleanedJson) }).where(eq(threadsTable.id, id));
            return parseThreadData(cleanedJson)?.messages ?? [];
        }
        return parseThreadData(rawThread)?.messages ?? [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getMessagesLength(id: string) {
    try {
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));

        if (dbResponse.length === 0) return 0;

        // Handle case where thread data is stored as string instead of object
        const rawThread = dbResponse[0]?.thread;
        if (typeof rawThread === 'string') {
            // Remove trailing commas before ] or } (invalid JSON but sometimes stored)
            const cleanedJson = rawThread.replace(/,\s*([\]}])/g, '$1');
            await db.update(threadsTable).set({ thread: parseThreadData(cleanedJson) }).where(eq(threadsTable.id, id));
            return parseThreadData(cleanedJson)?.messages?.length ?? 0;
        }
        return parseThreadData(rawThread)?.messages?.length ?? 0;
    } catch (error) {
        console.error(error);
        return 0;
    }
}

async function getThreadByToken(id: string, isAuthorized?: boolean | null) {
    try {
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));

        if (dbResponse.length === 0) return null;

        if (!isAuthorized) return null;

        return dbResponse[0];
    } catch (error) {
        console.error(error);
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
    } catch (error) {
        console.error(error);
        return [];
    }
}

export { getMessages, getMessagesLength, getThreadByToken, getUserThreads };
