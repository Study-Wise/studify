import type { StudyGuideResult } from '../types';
import { db } from '../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../db/schema';

export async function getLatestStudyGuide(
    threadId: string,
    userEmail: string | null
): Promise<StudyGuideResult> {
    // Get the study guide from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedStudyGuide) {
            return {
                content: threads[0].generatedStudyGuide
            };
        }
    } catch (error) {
        console.error('Error fetching study guide from database:', error);
    }

    // No study guide found
    return {
        content: null
    };
}
