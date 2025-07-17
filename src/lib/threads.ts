<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../db/schema';
import type { InferSelectModel } from "drizzle-orm";

type Thread = InferSelectModel<typeof threadsTable>;

async function getMessages(token: string) {
    try {
        const db = drizzle();
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.token, token));
        if (dbResponse && dbResponse[0] && dbResponse[0].thread) {
            return (dbResponse[0].thread as { messages: any[] }).messages;
        }
        return [];
    }
    catch (e) {
        console.error(e);
        return [];
    }
}

=======
=======
>>>>>>> Stashed changes
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../db/schema';
import type { InferSelectModel } from "drizzle-orm";

type Thread = InferSelectModel<typeof threadsTable>;

async function getMessages(token: string) {
    try {
        const db = drizzle();
        const dbResponse: Thread[] = await db.select().from(threadsTable).where(eq(threadsTable.token, Number(token)));
        if (dbResponse && dbResponse[0] && dbResponse[0].thread) {
            return (dbResponse[0].thread as { messages: any[] }).messages;
        }
        return [];
    }
    catch (e) {
        console.error(e);
        return [];
    }
}

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
export { getMessages };