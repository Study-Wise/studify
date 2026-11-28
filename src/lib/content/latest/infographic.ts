import { getLatestContent } from '@/lib/content/latest/';

export interface InfographicData {
    imageUrl: string;
    description: string;
    generatedAt: string;
    fileKey: string;
}

export async function getLatestInfographic(threadId: string): Promise<InfographicData | null> {
    const content = await getLatestContent(threadId, 'infographic');
    if (typeof content === 'object' && content !== null && 'imageUrl' in content && typeof content.imageUrl === 'string' && 'description' in content && typeof content.description === 'string' && 'generatedAt' in content && typeof content.generatedAt === 'string' && 'fileKey' in content && typeof content.fileKey === 'string') {
        return {
            imageUrl: content.imageUrl,
            description: content.description,
            generatedAt: content.generatedAt,
            fileKey: content.fileKey,
        };
    }
    return null;
}
