import { getMessages } from '../threads';
import extract from '../extractPartsofMessage';

export interface ReferenceSheetResult {
    content: string | null;
    precedingText: string;
    followingText: string;
}

export async function getLatestReferenceSheet(
    threadId: string,
    userEmail: string | null
): Promise<ReferenceSheetResult> {
    // Get messages for the thread
    const messages = await getMessages(threadId, userEmail);

    // Find the latest message with a reference sheet
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.role === 'assistant') {
            const { obj } = await extract(message.content);
            if (obj.referenceSheet) {
                return {
                    content: obj.referenceSheet,
                    precedingText: obj.precedingText || '',
                    followingText: obj.followingText || ''
                };
            }
        }
    }

    // No reference sheet found
    return {
        content: null,
        precedingText: '',
        followingText: ''
    };
}
