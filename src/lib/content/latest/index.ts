import type { ThreadContentStatus, ThreadContent, InfographicData, FlashcardData, SlideshowData } from '@/lib/types';
import { db } from '@/db/initialize';
import { eq, sql } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import { getContentTypesList } from '../get-types';

/**
 * Mapping between content type IDs (kebab-case) and their status keys (camelCase)
 */
const typeToKeyMap: Record<string, keyof ThreadContentStatus> = {
    'reference-sheet': 'hasReferenceSheet',
    'study-guide': 'hasStudyGuide',
    'infographic': 'hasInfographic',
    'webpage': 'hasWebpage',
    'mind-map': 'hasMindMap',
    'additional-resources': 'hasAdditionalResources',
    'flashcards': 'hasFlashcard',
    'practice-questions': 'hasPracticeQuestions',
    'slideshow': 'hasSlideshow',
    'summary': 'hasSummary',
};

export async function getThreadContentStatus(
    threadId: string,
    isAuthorized: boolean,
    isPublic: boolean
): Promise<ThreadContentStatus> {
    const isNewChat = (threadId === 'new');
    
    // Default status with all known types set to false
    const status: ThreadContentStatus = {
        hasReferenceSheet: false,
        hasStudyGuide: false,
        hasInfographic: false,
        hasWebpage: false,
        hasMindMap: false,
        hasAdditionalResources: false,
        hasFlashcard: false,
        hasPracticeQuestions: false,
        hasSlideshow: false,
        hasSummary: false,
    };

    if (!isNewChat && (isAuthorized || isPublic) && threadId) {
        try {
            const threads = await db.select({ content: threadsTable.content }).from(threadsTable).where(eq(threadsTable.id, threadId));
            
            if (threads.length > 0) {
                const content = threads[0].content || {};
                const contentTypes = getContentTypesList();
                
                contentTypes.forEach(type => {
                    const key = typeToKeyMap[type];
                    if (!key) return;
                    
                    // Check if content exists for this type in the JSON column
                    const contentValue = content[type as keyof ThreadContent];
                    if (contentValue) {
                        // For special types like infographic or flashcards that might be objects
                        if (typeof contentValue === 'object' && contentValue !== null) {
                            if (type === 'infographic') {
                                status[key] = !!(contentValue as InfographicData).imageUrl;
                            }
                            else if (type === 'flashcards') {
                                status[key] = !!(contentValue as FlashcardData).questions;
                            }
                            else if (type === 'slideshow') {
                                status[key] = !!(contentValue as SlideshowData).content;
                            }
                            else {
                                status[key] = Object.keys(contentValue as object).length > 0;
                            }
                        }
                        else {
                            status[key] = !!contentValue;
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching thread content status:', error);
        }
    }

    return status;
}

/**
 * Gets the latest content for a specific type from the thread's content JSON column.
 */
export async function getLatestContent<T = string>(threadId: string, type: string): Promise<T | null> {
    try {
        const threads = await db.select({ content: threadsTable.content }).from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0) {
            const content = threads[0].content || {};
            return (content[type as keyof ThreadContent] as T) || null;
        }
    } catch (error) {
        console.error(`Error fetching ${type} from database:`, error);
    }
    return null;
}

/**
 * Saves content for a specific type into the thread's content JSON column.
 */
export async function saveContent<T>(threadId: string, type: string, data: T): Promise<void> {
    try {
        // Use JSONB concatenation/update to update only the specific key
        // This is more efficient than fetching, updating in JS, and saving back
        await db.update(threadsTable)
            .set({ 
                content: sql`${threadsTable.content} || jsonb_build_object(${type}, ${JSON.stringify(data)}::jsonb)`,
                updatedAt: new Date() 
            })
            .where(eq(threadsTable.id, threadId));
    } catch (error) {
        console.error(`Error saving ${type} to database:`, error);
        throw error;
    }
}
