import { getMessages } from '../threads';
import extract from '../extractPartsofMessage';
import type { StudyGuideResult } from '../types';
import { db } from '../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../db/schema';

export async function getLatestStudyGuide(
    threadId: string,
    userEmail: string | null
): Promise<StudyGuideResult> {
    // First, try to get the study guide from the database
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

    // Fallback: Get messages for the thread and search for study guide
    const messages = await getMessages(threadId, userEmail);

    // Find the latest message with a study guide
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.role === 'assistant') {
            const { obj } = await extract(message.content);
            if (obj.studyGuide) {
                return {
                    content: obj.studyGuide
                };
            }
        }
    }

    // No study guide found
    return {
        content: null
    };
}
