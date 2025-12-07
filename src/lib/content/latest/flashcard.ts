import type { FlashcardResult } from '../../types';
import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';

export async function getLatestFlashcard(
    threadId: string,
): Promise<FlashcardResult> {
    // Get the flashcard from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedFlashcard) {
            return {
                content: threads[0].generatedFlashcard
            };
        }
    } catch (error) {
        console.error('Error fetching flashcard from database:', error);
    }

    // No flashcard found
    return {
        content: null
    };
}
