import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateObject } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import { buildContentSystemPrompt } from '@/lib/content';
import { parseThreadData } from '@/lib/threads';
import { saveContent } from '@/lib/content/latest';
import { buildUploadedFilesContext } from '@/lib/content/uploaded-files-context';
import { practiceQuestionSchema, type PracticeQuestionData } from '@/lib/content/latest/practice-questions';

import { eq } from 'drizzle-orm';

export async function generatePracticeQuestions(threadId: string, userPrompt?: string): Promise<PracticeQuestionData> {
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) throw new Error('Thread not found');

    const messages = parseThreadData(threads[0].thread)?.messages ?? [];

    if (messages.length === 0) throw new Error('No messages found in thread');

    const practiceQuestionsPrompt =
`${buildContentSystemPrompt('Practice Questions', buildUploadedFilesContext(threads[0].uploadedFiles ?? []))}

Generate a comprehensive set of practice questions to help reinforce the concepts discussed in this conversation. Include multiple question types to support different learning styles. Return them as structured data only; do not write any HTML or layout markup.

Write every text field as plain text or markdown. Math formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.

Ensure all questions are directly related to topics discussed in the conversation. Vary difficulty levels to support different learning stages. Make questions engaging and practical. Return an empty array for a section that is not relevant to the topic.

Rules for answer options, in the quiz, the problem steps and the multiple choice questions:
- Exactly one option is correct; the other options must be genuinely wrong.
- No two options may be equivalent, for example the same expression written differently or rewritten with a substitution. If an option is equivalent to the correct one, replace it with a different wrong answer.
- Do not always make the correct option the first one.
- Each explanation must agree with how its option is marked: never explain a wrong option as if it were correct.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const generated = await generateObject(
        practiceQuestionsPrompt,
        'Now generate the practice questions based on the above conversation. Return ONLY the structured practice question data. Do not include any explanations or commentary.',
        messages,
        config.model,
        config.provider,
        practiceQuestionSchema,
    );

    if (generated.quiz.length + generated.multipleChoice.length + generated.shortAnswer.length + generated.problems.length + generated.trueFalse.length + generated.challenges.length === 0) throw new Error('Generated practice questions are empty');

    await saveContent(threadId, 'practice-questions', generated);

    return generated;
}
