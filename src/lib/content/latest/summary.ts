import { getLatestContent } from './index';

export interface SummaryResult {
    content: string | null;
}

export async function getLatestSummary(threadId: string): Promise<SummaryResult> {
    const content = await getLatestContent(threadId, 'summary');
    return {
        content: content as string | null
    };
}
