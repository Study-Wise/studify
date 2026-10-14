import { getLatestContent } from '@/lib/content/latest/';

export interface MindMapResult {
    content: string | null;
}

export async function getLatestMindMap(threadId: string): Promise<MindMapResult> {
    const content = await getLatestContent(threadId, 'mind-map');
    return { content };
}
