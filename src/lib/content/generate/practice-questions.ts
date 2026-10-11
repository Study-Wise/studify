import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import config from '@/lib/config';
import { generateText } from '@/lib/ai-service';
import { buildContentSystemPrompt } from '@/lib/content';
import stepByStepHTML from '@/lib/prompt-templates/step-by-step-html';
import type { ThreadData, UploadedFile } from '@/lib/threads';
import { saveContent } from '@/lib/content/latest';

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

const answerKeyReviewPrompt =
`You review practice questions for answer-key mistakes. Check every multiple-choice question, both the interactive HTML quiz questions (options are <label class="step-question-choice"> elements and the correct one has data-type="correct") and the markdown multiple-choice questions.

For each question:
- Exactly one option must be correct. If an option marked wrong is actually correct, or is equivalent to the correct option (the same expression written differently, rewritten with a substitution, or the same answer with an added note), replace that option with a different, clearly wrong answer and rewrite its explanation.
- If the option marked correct is actually wrong, fix the marking so the truly correct option is marked.
- Every explanation must agree with how its option is marked.
- The Answer Key Summary must match the corrected answers.

Change nothing else. Output the full corrected content in the same format, with no commentary.`;

// Every interactive quiz question must have exactly one option marked correct
function hasSingleCorrectAnswerPerQuestion(content: string): boolean {
    const questions = content.split('class="step-question-choices"').slice(1);
    return questions.every(question => {
        const choices = question.split(/class="step"|class="step-question-choices"/)[0];
        return (choices.match(/data-type="correct"/g) ?? []).length === 1;
    });
}

async function reviewAnswerKey(content: string, userModel: string, provider: string): Promise<string> {
    const result = await generateText(
        answerKeyReviewPrompt,
        content,
        [],
        userModel,
        provider,
        {},
        config.contentGenerationExcludeTools,
    );

    return result.text;
}

export async function generatePracticeQuestions(threadId: string, userPrompt?: string) {
    // Fetch the thread from database
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];
    // Always use default model for content generation (more reliable)
    const userModel = config.model;
    const provider = config.provider;

    // Get conversation history directly from thread data
    const threadData = thread.thread as ThreadData;
    const messages = threadData?.messages ?? [];

    // Get uploaded files
    const uploadedFiles = (thread.uploadedFiles as UploadedFile[]) ?? [];

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Build uploaded files context
    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    // Create a practice questions specific prompt
    const practiceQuestionsPrompt =
`${buildContentSystemPrompt('Practice Questions', uploadedFilesContext)}

Output the content directly without any wrapping HTML tags or dialog elements.

### Practice Questions

Generate a comprehensive set of practice questions to help reinforce the concepts discussed in this conversation. Include multiple question types to support different learning styles.

#### Interactive Mock Quiz
Create a 3-question interactive quiz based on the concepts:
${stepByStepHTML}

---

#### Multiple Choice Questions
Generate 5-7 multiple choice questions with 4 options each (A, B, C, D). Mark the correct answer clearly. Exactly one option must be correct; the other three must be genuinely wrong, and no two options may be equivalent (for example the same expression written differently or rewritten with a substitution). Questions should test conceptual understanding, not just memorization.

Format:
**Question 1:** [Question text here]

A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

*Correct Answer: [Letter]*
*Explanation:* [Brief explanation of why this is correct]

---

#### Short Answer Questions
Generate 4-6 short answer questions that require students to explain concepts in their own words or solve problems with brief responses.

Format:
**Question [#]:** [Question text here]

*Sample Answer:* [Expected answer or key points]

---

#### Problem-Solving Questions
Generate 3-5 detailed problem-solving questions that require step-by-step solutions. These should be at the same difficulty level as discussed in the conversation.

Format:
**Problem [#]:** [Problem statement here]

*Solution:*
${stepByStepHTML}

---

#### True/False with Justification
Generate 4-6 true/false questions where students must explain their reasoning.

Format:
**Statement [#]:** [Statement here]

*Answer:* [True/False]
*Justification:* [Why this is true or false]

---

#### Challenge Questions
Generate 2-3 advanced questions that combine multiple concepts from the conversation. These are for students who want extra practice.

Format:
**Challenge [#]:** [Challenging question here]

*Hints:*
- [Hint 1]
- [Hint 2]

*Solution Approach:* [Brief guidance on how to approach this problem]

---

#### Answer Key Summary
Provide a quick reference answer key at the end for easy checking.

**Multiple Choice:** 1-[A/B/C/D], 2-[A/B/C/D], etc.

Math formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.

Ensure all questions are directly related to topics discussed in the conversation. Vary difficulty levels to support different learning stages. Make questions engaging and practical.

You may remove or modify sections as you see fit based on relevance to the topic.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;


    // Generate the practice questions
    const result = await generateText(
        practiceQuestionsPrompt,
        'Now generate the practice questions based on the above conversation. Output ONLY the practice questions content in markdown format. Do not include any explanations, commentary, or conversation - just the practice questions.',
        messages,
        userModel,
        provider,
        {},
        config.contentGenerationExcludeTools,
    );

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated practice questions are empty');
    }

    // Validation pass: make sure each question has exactly one correct, non-equivalent answer
    const reviewed = await reviewAnswerKey(result.text, userModel, provider);
    const practiceQuestions = reviewed.length > 0 ? reviewed : result.text;

    if (!hasSingleCorrectAnswerPerQuestion(practiceQuestions)) {
        throw new Error('Generated practice questions have a quiz question without exactly one correct answer');
    }

    // Save to database
    await saveContent(threadId, 'practice-questions', practiceQuestions);

    return practiceQuestions;
}
