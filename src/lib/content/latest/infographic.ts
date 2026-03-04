import { getLatestContent } from './index';

export async function getLatestInfographic(threadId: string): Promise<any | null> {
    const content = await getLatestContent(threadId, 'infographic');
    // Check if infographic has actual data (imageUrl property indicates it's been generated)
    if (content && typeof content === 'object' && 'imageUrl' in content) {
        return content;
    }
    return null;
}
