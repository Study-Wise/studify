import type { MindMapResult } from '@/lib/types';
import { getLatestContent } from './index';

export async function getLatestMindMap(
    threadId: string,
): Promise<MindMapResult> {
    const content = await getLatestContent(threadId, 'mind-map');
    return {
        content: content as string | null
    };
}
