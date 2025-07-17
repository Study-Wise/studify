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

async function getMessages(token: string) {
    try {
        const db = drizzle();
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.token, token));
        const threadData = dbResponse?.[0]?.thread as ThreadData;
        return threadData?.messages ?? [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

export { getMessages };