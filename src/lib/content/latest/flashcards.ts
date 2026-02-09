import type { FlashcardResult, FlashcardData } from '@/lib/types';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';

export async function getLatestFlashcards(
    threadId: string,
): Promise<FlashcardResult> {
    // Get the flashcards from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedFlashcards) {
            const flashcardsData = threads[0].generatedFlashcards;

            // Try to parse as JSON object (new structured format)
            try {
                const parsed = JSON.parse(flashcardsData);
                // Check if it's the new format with text and questions
                if (parsed && typeof parsed === 'object' && 'text' in parsed) {
                    return {
                        content: parsed as FlashcardData
                    };
                }
            } catch {
                // Not valid JSON, treat as legacy markdown string
            }

            // Legacy string format (markdown)
            return {
                content: flashcardsData
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
