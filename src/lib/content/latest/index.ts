import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import type { JSONValue } from '@/lib/threads';
import type { FlashcardData } from '@/lib/content/latest/flashcards';
import type { InfographicData } from '@/lib/content/latest/infographic';
import type { SlideshowData } from '@/lib/content/latest/slideshow';

import { eq, sql } from 'drizzle-orm';

import { getContentTypesList } from '../get-types';

export type ThreadContentStatus = Record<string, boolean>;

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

function toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, p1) => p1.toUpperCase());
}

const CONTENT_TYPE_KEYS: Record<string, string> = Object.fromEntries(
    getContentTypesList()
        .filter(type => type !== 'index')
        .map(type => [type, `has${toCamelCase(type).charAt(0).toUpperCase()}${toCamelCase(type).slice(1)}`]),
);

export async function getThreadContentStatus(
    threadId: string,
    isAuthorized: boolean,
    isPublic: boolean
): Promise<ThreadContentStatus> {
    const status: ThreadContentStatus = Object.fromEntries(Object.values(CONTENT_TYPE_KEYS).map(statusKey => [statusKey, false]));

    if (threadId !== 'new' && (isAuthorized || isPublic) && threadId) {
        try {
            const threads = await db.select({ content: threadsTable.content }).from(threadsTable).where(eq(threadsTable.id, threadId));

            if (threads.length > 0) {
                Object.entries(CONTENT_TYPE_KEYS).forEach(([type, statusKey]) => {
                    const contentValue = (threads[0].content || {})[toCamelCase(type)];
                    if (contentValue) {
                        if (typeof contentValue === 'object' && contentValue !== null) {
                            if (type === 'infographic') status[statusKey] = 'imageUrl' in contentValue && typeof contentValue.imageUrl === 'string' && !!contentValue.imageUrl;
                            else if (type === 'flashcards') status[statusKey] = 'questions' in contentValue && Array.isArray(contentValue.questions) && contentValue.questions.length > 0;
                            else if (type === 'slideshow') status[statusKey] = 'content' in contentValue && typeof contentValue.content === 'string' && !!contentValue.content;
                            else status[statusKey] = Object.keys(contentValue).length > 0;
                        }
                        else status[statusKey] = !!contentValue;
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching thread content status:', error);
        }
    }

    return status;
}

export async function getLatestContent(threadId: string, type: string): Promise<ThreadContent[keyof ThreadContent] | null> {
    try {
        const threads = await db.select({ content: threadsTable.content }).from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0) {
            const content = threads[0].content || {};
            const contentKey = toCamelCase(type);
            return content[contentKey] || null;
        }
    } catch (error) {
        console.error(`Error fetching ${type} from database:`, error);
    }
    return null;
}

export async function saveContent<T>(threadId: string, type: string, data: T): Promise<void> {
    try {
        await db.update(threadsTable)
            .set({
                content: sql`${threadsTable.content} || jsonb_build_object(${sql.raw(`'${toCamelCase(type)}'`)}, ${JSON.stringify(data)}::jsonb)`,
                updatedAt: new Date()
            })
            .where(eq(threadsTable.id, threadId));
    } catch (error) {
        console.error(`Error saving ${type} to database:`, error);
        throw error;
    }
}
