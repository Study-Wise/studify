import type { PracticeQuestionsResult } from '@/lib/types';
import { getLatestContent } from './index';

export async function getLatestPracticeQuestions(
    threadId: string,
): Promise<PracticeQuestionsResult> {
    const content = await getLatestContent(threadId, 'practice-questions');
    return {
        content: content as string | null
    };
}
