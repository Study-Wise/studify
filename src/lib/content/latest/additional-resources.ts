import { getLatestContent } from '@/lib/content/latest';

export async function getLatestResources(
    threadId: string,
): Promise<{ content: string | null }> {
    const content = await getLatestContent(threadId, 'additional-resources');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
