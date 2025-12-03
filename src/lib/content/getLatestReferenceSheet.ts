import { getMessages } from '../threads';
import extract from '../extractPartsofMessage';
import type { ReferenceSheetResult } from '../types';
import { db } from '../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../db/schema';

export async function getLatestReferenceSheet(
    threadId: string,
    userEmail: string | null
): Promise<ReferenceSheetResult> {
    // First, try to get the reference sheet from the database
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

    // Fallback: Get messages for the thread and search for reference sheet
    const messages = await getMessages(threadId, userEmail);

    // Find the latest message with a reference sheet
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.role === 'assistant') {
            const { obj } = await extract(message.content);
            if (obj.referenceSheet) {
                return {
                    content: obj.referenceSheet
                };
            }
        }
    }

    // No reference sheet found
    return {
        content: null
    };
}
