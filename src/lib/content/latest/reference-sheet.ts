import { getLatestContent } from '@/lib/content/latest/';

export async function getLatestReferenceSheet(threadId: string): Promise<{ content: string | null }> {
    const content = await getLatestContent(threadId, 'reference-sheet');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
