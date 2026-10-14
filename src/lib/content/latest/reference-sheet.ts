import { getLatestContent } from '@/lib/content/latest/';

export interface ReferenceSheetResult {
    content: string | null;
}

export async function getLatestReferenceSheet(threadId: string): Promise<ReferenceSheetResult> {
    const content = await getLatestContent(threadId, 'reference-sheet');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
