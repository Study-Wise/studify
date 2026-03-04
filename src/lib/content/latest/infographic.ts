import { getLatestContent } from './index';

export interface InfographicData {
    imageUrl: string;
    description: string;
    generatedAt: string;
    fileKey: string;
}

export async function getLatestInfographic(threadId: string): Promise<InfographicData | null> {
    const content = await getLatestContent(threadId, 'infographic');
    const infographic = content as InfographicData | null;
    // Check if infographic has actual data (imageUrl property indicates it's been generated)
    if (infographic && typeof infographic === 'object' && 'imageUrl' in infographic) {
        return infographic;
    }
    return null;
}
