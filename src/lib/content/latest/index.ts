import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import { getContentTypesList } from '../get-types';
import type { JSONValue } from '@/lib/threads';

import type { InfographicData } from '@/lib/content/latest/infographic';
import type { FlashcardData } from '@/lib/content/latest/flashcards';
import type { SlideshowData } from '@/lib/content/latest/slideshow';

export interface ThreadContentStatus {
    hasReferenceSheet: boolean;
    hasStudyGuide: boolean;
    hasInfographic: boolean;
    hasWebpage: boolean;
    hasMindMap: boolean;
    hasAdditionalResources: boolean;
    hasFlashcards: boolean;
    hasPracticeQuestions: boolean;
    hasSlideshow: boolean;
    hasSummary: boolean;
}

export interface ThreadContent {
    [key: string]: string | InfographicData | FlashcardData | SlideshowData | undefined | JSONValue;
    studyGuide?: string;
    referenceSheet?: string;
    infographic?: InfographicData;
    webpage?: string;
    mindMap?: string;
    additionalResources?: string;
    flashcards?: FlashcardData | string;
    practiceQuestions?: string;
    slideshow?: SlideshowData;
    summary?: string;
}

// Converts kebab-case to camelCase
function toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, p1) => p1.toUpperCase());
}

// Mapping between content type IDs (kebab-case) and their status keys (camelCase)
function typeToKey(type: string): keyof ThreadContentStatus {
    const camel = toCamelCase(type);
    const pascalCase = camel.charAt(0).toUpperCase() + camel.slice(1);
    return `has${pascalCase}` as keyof ThreadContentStatus;
}

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
        hasFlashcards: false,
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
                    const statusKey = typeToKey(type);
                    const contentKey = toCamelCase(type);

                    // Check if content exists for this type in the JSON column
                    const contentValue = content[contentKey as keyof ThreadContent];
                    if (contentValue) {
                        // For special types like infographic or flashcards that might be objects
                        if (typeof contentValue === 'object' && contentValue !== null) {
                            if (type === 'infographic') {
                                status[statusKey] = !!(contentValue as InfographicData).imageUrl;
                            }
                            else if (type === 'flashcards') {
                                status[statusKey] = !!(contentValue as FlashcardData).questions;
                            }
                            else if (type === 'slideshow') {
                                status[statusKey] = !!(contentValue as SlideshowData).content;
                            }
                            else {
                                status[statusKey] = Object.keys(contentValue as object).length > 0;
                            }
                        }
                        else {
                            status[statusKey] = !!contentValue;
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

// Gets the latest content for a specific type from the thread's content JSON column.
export async function getLatestContent<T = string>(threadId: string, type: string): Promise<T | null> {
    try {
        const threads = await db.select({ content: threadsTable.content }).from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0) {
            const content = threads[0].content || {};
            const contentKey = toCamelCase(type);
            return (content[contentKey as keyof ThreadContent] as T) || null;
        }
    } catch (error) {
        console.error(`Error fetching ${type} from database:`, error);
    }
    return null;
}

// Saves content for a specific type into the thread's content JSON column.
export async function saveContent<T>(threadId: string, type: string, data: T): Promise<void> {
    try {
        const contentKey = toCamelCase(type);
        // Use JSONB concatenation/update to update only the specific key
        // This is more efficient than fetching, updating in JS, and saving back
        await db.update(threadsTable)
            .set({
                content: sql`${threadsTable.content} || jsonb_build_object(${sql.raw(`'${contentKey}'`)}, ${JSON.stringify(data)}::jsonb)`,
                updatedAt: new Date()
            })
            .where(eq(threadsTable.id, threadId));
    } catch (error) {
        console.error(`Error saving ${type} to database:`, error);
        throw error;
    }
}
