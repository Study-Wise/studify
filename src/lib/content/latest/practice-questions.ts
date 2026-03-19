import { getLatestContent } from '@/lib/content/latest/';

export interface PracticeQuestionsResult {
    content: string | null;
}

export async function getLatestPracticeQuestions(threadId: string): Promise<PracticeQuestionsResult> {
    const content = await getLatestContent(threadId, 'practice-questions');
    return {
        content: content as string | null
    };
}
