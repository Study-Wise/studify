import { db } from '../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../db/schema';

export async function getInfographic(threadId: string): Promise<any | null> {
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0) {
            return threads[0].generatedInfographic || null;
        }
    } catch (error) {
        console.error('Error fetching infographic:', error);
    }
    return null;
}
