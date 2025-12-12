import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';

export interface ResourcesResult {
    content: string | null;
}

export async function getLatestResources(
    threadId: string,
): Promise<ResourcesResult> {
    // Get the resources from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedResources) {
            return {
                content: threads[0].generatedResources
            };
        }
    } catch (error) {
        console.error('Error fetching resources from database:', error);
    }

    // No resources found
    return {
        content: null
    };
}
