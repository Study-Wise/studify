import type { StudyGuideResult } from '@/lib/types';
import { getLatestContent } from './index';

export async function getLatestStudyGuide(
    threadId: string,
): Promise<StudyGuideResult> {
    const content = await getLatestContent(threadId, 'study-guide');
    return {
        content: content as string | null
    };
}
