import type { PracticeQuestionsResult } from '../../types';
import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';

export async function getLatestPracticeQuestions(
    threadId: string,
): Promise<PracticeQuestionsResult> {
    // Get the practice questions from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedPracticeQuestions) {
            return {
                content: threads[0].generatedPracticeQuestions
            };
        }
    } catch (error) {
        console.error('Error fetching practice questions from database:', error);
    }

    // No practice questions found
    return {
        content: null
    };
}
