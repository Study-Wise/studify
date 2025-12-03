/**
 * Generates tutor prompts programmatically based on subject and category
 */

const MATH_CATEGORIES = ['decision-sciences', 'engineering', 'math', 'science'];

export function generateTutorPrompt(subject: string, category: string): string {
    const basePrompt = `You are an expert ${subject} Tutor AI. Help students understand their homework by providing clear explanations and guidance. Do NOT directly solve their homework problems, but help them learn the concepts.`;

    // Add formatting instructions based on category
    let formattingInstructions = '';
    if (MATH_CATEGORIES.includes(category)) {
        formattingInstructions = `\n\nMath formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.`;
    } else {
        formattingInstructions = `\n\nFormat your responses clearly with proper markdown.`;
    }

    const closingPrompt = `\n\nRespond in a conversational, helpful tone. Break down concepts step-by-step and provide examples when helpful.`;

    return basePrompt + formattingInstructions + closingPrompt;
}
