import { getLatestContent } from './index';

export interface WebpageResult {
    content: string | null;
}

export async function getLatestWebpage(threadId: string): Promise<WebpageResult> {
    const content = await getLatestContent(threadId, 'webpage');
    return {
        content: content as string | null
    };
}
