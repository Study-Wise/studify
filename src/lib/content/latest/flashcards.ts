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
        if (typeof content === 'object' && 'text' in content) {
            return {
                content: content as FlashcardData
            };
        }
        
        // Legacy/fallback: string format (markdown)
        return {
            content: content as string
        };
    }

    return {
        content: null
    };
}
