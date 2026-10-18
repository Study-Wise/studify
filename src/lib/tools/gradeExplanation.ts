import config from '@/lib/config';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const gradeExplanationTool = tool({
    description: 'Grade a student\'s explanation of a concept in their own words (explain it back, or Feynman mode). Call it with the concept and the student\'s explanation. It returns what they got right, plus any gaps and misconceptions, which you then share with the student.',
    inputSchema: z.object({
        concept: z.string().describe('The concept the student was asked to explain'),
        explanation: z.string().describe('The student\'s explanation, in their own words'),
    }),
    execute: async ({ concept, explanation }) => {
        try {
            const { text } = await generateText({
                model: `${config.provider}/${config.model}`,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a tutor grading a student\'s explanation of a concept. First say what they got right. Then point out any gaps and misconceptions. Do NOT simply re-explain the whole concept. If the explanation is fully correct, say so. Output only the grading.',
                    },
                    {
                        role: 'user',
                        content: `Concept: ${concept}\n\nStudent's explanation: ${explanation}`,
                    },
                ],
            });

            return JSON.stringify({ grading: text }, null, 2);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ error: true, message: `Could not grade the explanation: ${errorMessage}` }, null, 2);
        }
    },
});

export default {
    ...gradeExplanationTool,
    ready: true,
    label: 'Grading your explanation',
};
