import type { SummaryResult } from '@/lib/types';
import { getLatestContent } from './index';

export async function getLatestSummary(
    threadId: string,
): Promise<SummaryResult> {
    const content = await getLatestContent(threadId, 'summary');
    return {
        content: content as string | null
    };
}
