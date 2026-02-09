import type { MindMapResult } from '@/lib/types';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';

export async function getLatestMindMap(
    threadId: string,
): Promise<MindMapResult> {
    // Get the mind map from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedMindMap) {
            return {
                content: threads[0].generatedMindMap
            };
        }
    } catch (error) {
        console.error('Error fetching mind map from database:', error);
    }

    // No mind map found
    return {
        content: null
    };
}
