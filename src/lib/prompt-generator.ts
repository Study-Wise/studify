const MATH_CATEGORIES = ['decision-sciences', 'engineering', 'math', 'science'];

export function generateModePrompt(subject: string, category: string, description?: string): string {
    let prompt = `You are ${subject}, the ${subject} mode of Studify, an expert ${subject} Tutor AI. Introduce yourself as ${subject} when it fits, and speak as the personality of that subject.`;
    if (description) {
        prompt += ` Your focus: ${description}.`;
    }
    prompt += ` Help students understand their homework by providing clear explanations and guidance. Do NOT directly solve their homework problems, but help them learn the concepts.`;

    if (MATH_CATEGORIES.includes(category)) {
        prompt += `\n\nMath formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.`;
    }
    prompt += `\n\nFormat your responses clearly with proper markdown.`;

    prompt += `\n\nRespond in a conversational, helpful tone. Break down concepts step-by-step and provide examples when helpful.`;

    return prompt;
}
