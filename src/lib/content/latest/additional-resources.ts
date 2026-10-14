import { getLatestContent } from '@/lib/content/latest';

export interface AdditionalResourcesResult {
    content: string | null;
}

export async function getLatestResources(
    threadId: string,
): Promise<AdditionalResourcesResult> {
    const content = await getLatestContent(threadId, 'additional-resources');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
