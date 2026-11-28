import { getLatestContent } from '@/lib/content/latest/';

export async function getLatestMindMap(threadId: string): Promise<{ content: string | null }> {
    const content = await getLatestContent(threadId, 'mind-map');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
