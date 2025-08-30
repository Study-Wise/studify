import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../db/schema';
import type { InferSelectModel } from "drizzle-orm";

type Thread = InferSelectModel<typeof threadsTable>;

interface ThreadData {
    title: string;
    isDev: boolean;
    createdAt: Date;
    updatedAt: Date;
    messages: any[];
}

async function getMessages(token: string, user_email?: string | null) {
    try {
        const db = drizzle();
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.token, token));
        
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

async function getThreadByToken(token: string, user_email?: string | null) {
    try {
        const db = drizzle();
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.token, token));
        
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

export { getMessages, getThreadByToken };