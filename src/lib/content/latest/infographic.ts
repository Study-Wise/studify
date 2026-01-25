import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';

export async function getLatestInfographic(threadId: string): Promise<any | null> {
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0) {
            const infographic = threads[0].generatedInfographic;
            // Check if infographic has actual data (imageUrl property indicates it's been generated)
            if (infographic && typeof infographic === 'object' && 'imageUrl' in infographic) {
                return infographic;
            }
        }
    } catch (error) {
        console.error('Error fetching infographic:', error);
    }
    return null;
}
