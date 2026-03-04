import { getLatestContent } from './index';

export interface ReferenceSheetResult {
    content: string | null;
}

export async function getLatestReferenceSheet(threadId: string): Promise<ReferenceSheetResult> {
    const content = await getLatestContent(threadId, 'reference-sheet');
    return {
        content: content as string | null
    };
}
