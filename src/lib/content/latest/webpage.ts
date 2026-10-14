import { getLatestContent } from '@/lib/content/latest/';

export interface WebpageResult {
    content: string | null;
}

export async function getLatestWebpage(threadId: string): Promise<WebpageResult> {
    const content = await getLatestContent(threadId, 'webpage');
    return { content };
}
