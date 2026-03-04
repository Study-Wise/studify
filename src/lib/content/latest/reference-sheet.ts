import type { ReferenceSheetResult } from '@/lib/types';
import { getLatestContent } from './index';

export async function getLatestReferenceSheet(
    threadId: string,
): Promise<ReferenceSheetResult> {
    const content = await getLatestContent(threadId, 'reference-sheet');
    return {
        content: content as string | null
    };
}
