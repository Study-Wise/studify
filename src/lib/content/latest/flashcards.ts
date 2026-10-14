import { getLatestContent } from '@/lib/content/latest/';

// Structured flashcard type for generateObject output
export interface Flashcard {
    front: string;
    back: string;
}

// Flashcard data stored in database - includes both text summary and structured questions
export interface FlashcardData {
    text: string;
    questions: Flashcard[];
}

export interface FlashcardResult {
    content: FlashcardData | string | null;
}

export async function getLatestFlashcards(threadId: string): Promise<FlashcardResult> {
    const content = await getLatestContent(threadId, 'flashcards');

    if (content) {
        // New format: structured object
        if (typeof content === 'object' && content !== null && 'text' in content && typeof content.text === 'string' && 'questions' in content && Array.isArray(content.questions)) {
            return {
                content: {
                    text: content.text,
                    questions: content.questions.flatMap(question => {
                        if (typeof question === 'object' && question !== null && !Array.isArray(question) && 'front' in question && typeof question.front === 'string' && 'back' in question && typeof question.back === 'string') {
                            return [{ front: question.front, back: question.back }];
                        }
                        return [];
                    })
                }
            };
        }
        if (typeof content === 'string') return { content };
    }

    return { content: null };
}
