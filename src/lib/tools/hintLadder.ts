import config from '@/lib/config';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const levels: Record<1 | 2 | 3, string> = {
    1: 'a nudge: point the student toward where to look, without naming the method or any part of the answer',
    2: 'the key idea: name the concept or method that unlocks the problem, without applying it',
    3: 'the first step: show only the first step of the solution, and stop there',
};

const hintLadderTool = tool({
    description: 'Give a student graded help when they are stuck, one level at a time, without revealing the solution. Level 1 is a nudge, level 2 is the key idea and level 3 is the first step. Call it with the next level each time the student asks for more help, starting at 1. Show the student the hint and the count it returns, for example "Hint 2 of 3". Only after level 3, if they still ask, work through the problem with them.',
    inputSchema: z.object({
        problem: z.string().describe('The problem the student is stuck on'),
        studentWork: z.string().optional().describe('What the student has tried so far, if anything'),
        level: z.union([z.literal(1), z.literal(2), z.literal(3)]).describe('Which hint level to give: 1 (nudge), 2 (key idea) or 3 (first step)'),
    }),
    execute: async ({ problem, studentWork, level }) => {
        try {
            const { text } = await generateText({
                model: `${config.provider}/${config.model}`,
                messages: [
                    {
                        role: 'system',
                        content: `You are a tutor giving one hint to a student who is stuck. Give ${levels[level]}. Do NOT solve the problem or reveal the answer. Keep it to a few sentences and output only the hint.`,
                    },
                    {
                        role: 'user',
                        content: `Problem: ${problem}${studentWork ? `\n\nWhat the student has tried: ${studentWork}` : ''}`,
                    },
                ],
            });

            return JSON.stringify({ hint: text, count: `Hint ${level} of 3` }, null, 2);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ error: true, message: `Could not generate a hint: ${errorMessage}` }, null, 2);
        }
    },
});

export default {
    ...hintLadderTool,
    ready: true,
    label: 'Preparing a hint',
};
