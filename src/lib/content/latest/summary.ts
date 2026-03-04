import type { SummaryResult } from '@/lib/types';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';

export async function getLatestSummary(
    threadId: string,
): Promise<SummaryResult> {
    // Get the summary from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && (threads[0] as any).generatedSummary) {
            return {
                content: (threads[0] as any).generatedSummary
            };
        }
    } catch (error) {
        console.error('Error fetching summary from database:', error);
    }

    // No summary found
    return {
        content: null
    };
}
