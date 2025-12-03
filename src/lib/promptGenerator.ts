/**
 * Generates tutor prompts programmatically based on subject and category
 */

import { MySqlEnumObjectColumn } from "drizzle-orm/mysql-core";
import { singlestoreDatabase } from "drizzle-orm/singlestore-core";

const MATH_CATEGORIES = ['decision-sciences', 'engineering', 'math', 'science'];


export function generateTutorPrompt(subject: string, category: string): string {
    let aiName = 'an expert';
    if (subject) aiName += ` ${subject} `;
    aiName += 'Tutor AI';

    let prompt = `You are ${aiName}. Help students understand their homework by providing clear explanations and guidance. Do NOT directly solve their homework problems, but help them learn the concepts.`;

    // Add formatting instructions based on category
    if (MATH_CATEGORIES.includes(category)) {
        prompt  += `\n\nMath formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.`;
    }
    prompt += `\n\nFormat your responses clearly with proper markdown.`;

    prompt += `\n\nRespond in a conversational, helpful tone. Break down concepts step-by-step and provide examples when helpful.`;

    return prompt;
}
