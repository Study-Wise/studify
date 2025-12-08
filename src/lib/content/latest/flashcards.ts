import type { FlashcardResult } from '../../types';
import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';

export async function getLatestFlashcards(
    threadId: string,
): Promise<FlashcardResult> {
    // Get the flashcards from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedFlashcards) {
            return {
                content: threads[0].generatedFlashcards
            };
        }
    } catch (error) {
        console.error('Error fetching flashcards from database:', error);
    }

    // No flashcards found
    return {
        content: null
    };
}
