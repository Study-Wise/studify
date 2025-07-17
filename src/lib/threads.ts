import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../db/schema';
import type { InferSelectModel } from "drizzle-orm";

type Thread = InferSelectModel<typeof threadsTable>;

async function getMessages(token: string) {
    try {
        const db = drizzle();
        // Accept both string and number tokens
        const whereToken = isNaN(Number(token)) ? token : Number(token);
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.token, whereToken));
        return dbResponse?.[0]?.thread?.messages ?? [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

export { getMessages };