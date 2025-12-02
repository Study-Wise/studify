import { getMessages } from '../threads';
import extract from '../extractPartsofMessage';

export interface StudyGuideResult {
    content: string | null;
    precedingText: string;
    followingText: string;
}

export async function getLatestStudyGuide(
    threadId: string,
    userEmail: string | null
): Promise<StudyGuideResult> {
    // Get messages for the thread
    const messages = await getMessages(threadId, userEmail);

    // Find the latest message with a study guide
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.role === 'assistant') {
            const { obj } = await extract(message.content);
            if (obj.studyGuide) {
                return {
                    content: obj.studyGuide,
                    precedingText: obj.precedingText || '',
                    followingText: obj.followingText || ''
                };
            }
        }
    }

    // No study guide found
    return {
        content: null,
        precedingText: '',
        followingText: ''
    };
}
