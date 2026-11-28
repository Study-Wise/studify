import type { User } from 'better-auth';
import { checkThreadAccess } from '@/lib/auth/thread-access';
import { getLatestContent } from '@/lib/content/latest/';

export interface FlashcardData {
    text: string;
    questions: { front: string; back: string }[];
}

export async function getLatestFlashcards(threadId: string, user: User | null): Promise<{ content: FlashcardData | string | null } | null> {
    if (!await checkThreadAccess(threadId, user)) return null;

    const content = await getLatestContent(threadId, 'flashcards');

    if (content) {
        if (typeof content === 'object' && content !== null && 'text' in content && typeof content.text === 'string' && 'questions' in content && Array.isArray(content.questions)) {
            return {
                content: {
                    text: content.text,
                    questions: content.questions.flatMap(question => {
                        if (typeof question === 'object' && question !== null && !Array.isArray(question) && 'front' in question && typeof question.front === 'string' && 'back' in question && typeof question.back === 'string') return [{ front: question.front, back: question.back }];
                        return [];
                    })
                }
            };
        }
        if (typeof content === 'string') return { content };
    }

    return { content: null };
}
