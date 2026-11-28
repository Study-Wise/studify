import { z } from 'zod';
import { getLatestContent } from '@/lib/content/latest/';

const stepSchema = z.object({
    description: z.string().describe('One or two sentences of context for this question'),
    question: z.string().describe('The question the student answers'),
    choices: z.array(z.object({
        text: z.string().describe('The answer option'),
        explanation: z.string().describe('Why this option is correct or wrong. It must agree with the correct flag'),
        correct: z.boolean().describe('True for exactly one option per question'),
    })).describe('3 or 4 options. Exactly one is correct, and the correct one is not always first. No two options may be equivalent'),
});

export const practiceQuestionSchema = z.object({
    quiz: z.array(stepSchema).describe('The interactive mock quiz: 3 questions'),
    multipleChoice: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()).describe('Exactly 4 options. Exactly one is correct and the other three are genuinely wrong. No two options may be equivalent'),
        correctIndex: z.number().int().describe('Zero-based index of the correct option'),
        explanation: z.string().describe('Brief explanation of why the correct option is correct'),
    })).describe('5 to 7 multiple choice questions testing conceptual understanding'),
    shortAnswer: z.array(z.object({
        question: z.string(),
        sampleAnswer: z.string().describe('The expected answer or key points'),
    })).describe('4 to 6 short answer questions'),
    problems: z.array(z.object({
        problem: z.string().describe('The problem statement'),
        steps: z.array(stepSchema).describe('The solution as step-by-step questions the student answers in order'),
    })).describe('3 to 5 problem-solving questions at the difficulty discussed in the conversation'),
    trueFalse: z.array(z.object({
        statement: z.string(),
        answer: z.boolean(),
        justification: z.string().describe('Why the statement is true or false'),
    })).describe('4 to 6 true/false statements'),
    challenges: z.array(z.object({
        question: z.string().describe('An advanced question combining several concepts from the conversation'),
        hints: z.array(z.string()).describe('Hints from gentlest to most revealing'),
        solutionApproach: z.string().describe('Brief guidance on how to approach the problem'),
    })).describe('2 or 3 challenge questions'),
});

export type PracticeQuestionData = z.infer<typeof practiceQuestionSchema>;

export interface PracticeQuestionsResult {
    content: PracticeQuestionData | null;
}

export async function getLatestPracticeQuestions(threadId: string): Promise<PracticeQuestionsResult> {
    const parsed = practiceQuestionSchema.safeParse(await getLatestContent(threadId, 'practice-questions'));

    return { content: parsed.success ? parsed.data : null };
}
