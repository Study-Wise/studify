import { getLatestContent } from '@/lib/content/latest/';

export interface StudyGuideResult {
    content: string | null;
}

export async function getLatestStudyGuide(threadId: string): Promise<StudyGuideResult> {
    const content = await getLatestContent(threadId, 'study-guide');
    return { content };
}
