import type { ThreadContentStatus } from '@/lib/types';
import { getLatestReferenceSheet } from './reference-sheet';
import { getLatestStudyGuide } from './study-guide';
import { getLatestInfographic } from './infographic';
import { getLatestWebpage } from './webpage';
import { getLatestMindMap } from './mind-map';
import { getLatestResources } from './additional-resources';
import { getLatestFlashcards } from './flashcards';
import { getLatestPracticeQuestions } from './practice-questions';
import { getLatestSlideshow } from './slideshow';
import { getLatestSummary } from './summary';

export async function getThreadContentStatus(
    threadId: string,
    isAuthorized: boolean,
    isPublic: boolean
): Promise<ThreadContentStatus> {
    const isNewChat = (threadId === 'new');
    
    let status: ThreadContentStatus = {
        hasReferenceSheet: false,
        hasStudyGuide: false,
        hasInfographic: false,
        hasWebpage: false,
        hasMindMap: false,
        hasAdditionalResources: false,
        hasFlashcard: false,
        hasPracticeQuestions: false,
        hasSlideshow: false,
        hasSummary: false,
    };

    if (!isNewChat && (isAuthorized || isPublic) && threadId) {
        const [
            referenceSheetResult,
            studyGuideResult,
            infographic,
            webpageResult,
            mindMapResult,
            additionalResourcesResult,
            flashcardResult,
            practiceQuestionsResult,
            slideshowResult,
            summaryResult
        ] = await Promise.all([
            getLatestReferenceSheet(threadId),
            getLatestStudyGuide(threadId),
            getLatestInfographic(threadId),
            getLatestWebpage(threadId),
            getLatestMindMap(threadId),
            getLatestResources(threadId),
            getLatestFlashcards(threadId),
            getLatestPracticeQuestions(threadId),
            getLatestSlideshow(threadId),
            getLatestSummary(threadId),
        ]);

        status = {
            hasReferenceSheet: !!referenceSheetResult.content,
            hasStudyGuide: !!studyGuideResult.content,
            hasInfographic: !!infographic,
            hasWebpage: !!webpageResult.content,
            hasMindMap: !!mindMapResult.content,
            hasAdditionalResources: !!additionalResourcesResult.content,
            hasFlashcard: !!flashcardResult.content,
            hasPracticeQuestions: !!practiceQuestionsResult.content,
            hasSlideshow: !!slideshowResult.content,
            hasSummary: !!summaryResult.content,
        };
    }

    return status;
}
