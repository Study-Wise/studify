import { getLatestContent } from '@/lib/content/latest/';

export async function getLatestWebpage(threadId: string): Promise<{ content: string | null }> {
    const content = await getLatestContent(threadId, 'webpage');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
