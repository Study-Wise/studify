import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../db/schema';
import type { InferSelectModel } from "drizzle-orm";
import type { ThreadData } from './types';

type Thread = InferSelectModel<typeof threadsTable>;

async function getMessages(id: string, user_email?: string | null) {
    try {
        const db = drizzle();
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));
        
        if (dbResponse.length === 0) {
            return [];
        }
        
        const thread = dbResponse[0];
        
        // Check ownership if user_email is provided
        if (user_email && thread.email && thread.email !== user_email) {
            return []
        }
        
        const threadData = thread?.thread as ThreadData;
        return threadData?.messages ?? [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getMessagesLength(id: string) {
    try {
        const db = drizzle();
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));
        
        if (dbResponse.length === 0) {
            return 0;
        }
        
        const thread = dbResponse[0];
        
        const threadData = thread?.thread as ThreadData;
        return threadData?.messages?.length ?? 0;
    } catch (e) {
        console.error(e);
        return 0;
    }
}

async function getThreadByToken(id: string, user_email?: string | null) {
    try {
        const db = drizzle();
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));
        
        if (dbResponse.length === 0) {
            return null;
        }
        
        const thread = dbResponse[0];
        
        // Check ownership if user_email is provided
        if (user_email && thread.email && thread.email !== user_email) {
            return null;
        }
        
        return thread;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export { getMessages, getMessagesLength, getThreadByToken };