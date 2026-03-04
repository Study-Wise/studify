import type { ThreadContentStatus } from '@/lib/types';
import { db } from '@/db/initialize';
import { eq, sql } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import { getContentTypesList } from '../get-types';

export async function getThreadContentStatus(
    threadId: string,
    isAuthorized: boolean,
    isPublic: boolean
): Promise<ThreadContentStatus> {
    const isNewChat = (threadId === 'new');
    
    // Default status with all known types set to false
    const contentTypes = getContentTypesList();
    const status: any = {};
    
    // Initialize status with camelCase has* keys
    contentTypes.forEach(type => {
        const camelCase = type.split('-').map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('');
        const key = `has${camelCase.charAt(0).toUpperCase()}${camelCase.slice(1)}`;
        status[key] = false;
    });

    if (!isNewChat && (isAuthorized || isPublic) && threadId) {
        try {
            const threads = await db.select({ content: threadsTable.content }).from(threadsTable).where(eq(threadsTable.id, threadId));
            
            if (threads.length > 0) {
                const content = (threads[0].content as any) || {};
                
                contentTypes.forEach(type => {
                    const camelCase = type.split('-').map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('');
                    const key = `has${camelCase.charAt(0).toUpperCase()}${camelCase.slice(1)}`;
                    
                    // Check if content exists for this type in the JSON column
                    const contentValue = content[type];
                    if (contentValue) {
                        // For special types like infographic or flashcards that might be objects
                        if (typeof contentValue === 'object') {
                            if (type === 'infographic') {
                                status[key] = !!contentValue.imageUrl;
                            } else if (type === 'flashcards') {
                                status[key] = !!contentValue.questions;
                            } else if (type === 'slideshow') {
                                status[key] = !!contentValue.content;
                            } else {
                                status[key] = Object.keys(contentValue).length > 0;
                            }
                        } else {
                            status[key] = !!contentValue;
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching thread content status:', error);
        }
    }

    return status as ThreadContentStatus;
}

/**
 * Gets the latest content for a specific type from the thread's content JSON column.
 */
export async function getLatestContent(threadId: string, type: string): Promise<any> {
    try {
        const threads = await db.select({ content: threadsTable.content }).from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0) {
            const content = (threads[0].content as any) || {};
            return content[type] || null;
        }
    } catch (error) {
        console.error(`Error fetching ${type} from database:`, error);
    }
    return null;
}

/**
 * Saves content for a specific type into the thread's content JSON column.
 */
export async function saveContent(threadId: string, type: string, data: any): Promise<void> {
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
