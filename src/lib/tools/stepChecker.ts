import config from '@/lib/config';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const stepCheckerTool = tool({
    description: 'Check a student\'s own working line by line when they type it out in a math or science problem. Call it with the problem and the student\'s working. It returns the first line with an error and what went wrong on that line, without solving or checking the remaining steps, or says every line is correct. Share the result with the student.',
    inputSchema: z.object({
        problem: z.string().describe('The problem the student is working on'),
        studentWork: z.string().describe('The student\'s working, one step per line'),
    }),
    execute: async ({ problem, studentWork }) => {
        try {
            const { text } = await generateText({
                model: `${config.provider}/${config.model}`,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a tutor checking a student\'s working line by line. Mark the first line with an error and explain what went wrong on that line. Do NOT solve or check the remaining steps. If every line is correct, say so. Output only the check.',
                    },
                    {
                        role: 'user',
                        content: `Problem: ${problem}\n\nStudent's working:\n${studentWork}`,
                    },
                ],
            });

            return JSON.stringify({ result: text }, null, 2);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ error: true, message: `Could not check the working: ${errorMessage}` }, null, 2);
        }
    },
});

export default {
    ...stepCheckerTool,
    ready: true,
    label: 'Checking your working',
};
