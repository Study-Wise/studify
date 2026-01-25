import type { ReferenceSheetResult } from '../../types';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';

export async function getLatestReferenceSheet(
    threadId: string,
): Promise<ReferenceSheetResult> {
    // Get the reference sheet from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedReferenceSheet) {
            return {
                content: threads[0].generatedReferenceSheet
            };
        }
    } catch (error) {
        console.error('Error fetching reference sheet from database:', error);
    }

    // No reference sheet found
    return {
        content: null
    };
}
