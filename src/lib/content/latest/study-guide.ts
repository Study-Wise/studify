import { getLatestContent } from '@/lib/content/latest/';

export async function getLatestStudyGuide(threadId: string): Promise<{ content: string | null }> {
    const content = await getLatestContent(threadId, 'study-guide');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
