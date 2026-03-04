import type { FlashcardResult, FlashcardData } from '@/lib/types';
import { getLatestContent } from './index';

export async function getLatestFlashcards(
    threadId: string,
): Promise<FlashcardResult> {
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
