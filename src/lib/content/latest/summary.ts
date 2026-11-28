import { getLatestContent } from '@/lib/content/latest/';

export async function getLatestSummary(threadId: string): Promise<{ content: string | null }> {
    const content = await getLatestContent(threadId, 'summary');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
