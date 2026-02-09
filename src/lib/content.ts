import { getExclusionList } from './config';

// Maps content type name to its specific "Generate ONLY ..." instruction
const contentTypeDescriptions: Record<string, string> = {
    'Study Guide': 'the Study Guide sections listed below',
    'Reference Sheet': 'a Reference Sheet',
    'Flashcards': 'Flashcards',
    'Practice Questions': 'Practice Questions',
    'Mind Map': 'a Mind Map (as interactive HTML)',
    'Webpage': 'a complete, interactive webpage (HTML with embedded CSS/JS)',
    'Infographic': 'a description for an educational infographic image',
    'Slideshow': 'Slidev-format markdown for the slideshow',
};

/**
 * Generates the common system prompt header for content generation.
 * Each content generator should prepend this to its specific instructions.
 */
export function buildContentSystemPrompt(contentTypeName: string, uploadedFilesContext: string): string {
    const description = contentTypeDescriptions[contentTypeName] || contentTypeName.toLowerCase();

    return `You are a ${contentTypeName.toLowerCase()} generator. Generate ONLY ${description} - nothing else.
${uploadedFilesContext}

STRICT RULES - FOLLOW EXACTLY:
1. Generate ONLY ${description}
2. Use BOTH the conversation history AND any uploaded files content (if any) provided above as source material, unless the user's additional instructions say otherwise
3. Do NOT respond to or continue any conversation
4. Do NOT generate ANY of the following content types (they are generated separately by other systems):
${getExclusionList(contentTypeName)}`;
}
