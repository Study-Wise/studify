const MATH_CATEGORIES = ['decision-sciences', 'engineering', 'math', 'science'];

export function generateModePrompt(subject: string, category: string): string {
    // Base prompt
    let prompt = `You are an expert ${subject} Tutor AI. Help students understand their homework by providing clear explanations and guidance. Do NOT directly solve their homework problems, but help them learn the concepts.`;

    // Formatting instructions
    if (MATH_CATEGORIES.includes(category)) {
        prompt += `\n\nMath formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.`;
    }
    prompt += `\n\nFormat your responses clearly with proper markdown.`;

    // Closing
    prompt += `\n\nRespond in a conversational, helpful tone. Break down concepts step-by-step and provide examples when helpful.`;

    return prompt;
}
