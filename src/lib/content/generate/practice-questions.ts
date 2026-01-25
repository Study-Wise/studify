import { generateText } from 'ai';
import { getMessages } from '../../threads';
import categories from '../../modes';
import config from '../../config';
import stepByStepHTML from '../../promptTemplates/stepByStepHTML';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';

export async function generatePracticeQuestions(threadId: string, userEmail: string | null) {
    // Fetch the thread from database
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];
    const category = thread.category;
    const mode = thread.mode;
    const userModel = thread.model || config.model;
    const provider = thread.provider || config.provider;

    // Get conversation history
    const messages = await getMessages(threadId, userEmail);

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Get the mode object for the thread's category and mode
    const modeObj = categories[category]?.modes?.[mode];

    // Get the base system prompt
    const baseSystemPrompt = modeObj?.prompt ? await modeObj.prompt : config.systemPrompt;

    // Create a practice questions specific prompt
    const practiceQuestionsPrompt = `${baseSystemPrompt}

IMPORTANT: Generate ONLY Practice Questions based on the conversation history. Do NOT include other sections.

Output the content directly without any wrapping HTML tags or dialog elements.

### Practice Questions

Generate a comprehensive set of practice questions to help reinforce the concepts discussed in this conversation. Include multiple question types to support different learning styles.

#### Multiple Choice Questions
Generate 5-7 multiple choice questions with 4 options each (A, B, C, D). Mark the correct answer clearly. Questions should test conceptual understanding, not just memorization.

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

IMPORTANT: Ensure all questions are directly related to topics discussed in the conversation. Vary difficulty levels to support different learning stages. Make questions engaging and practical.`;

    // Build messages array with system prompt first, then conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForAI = [
        {
            role: 'system' as const,
            content: practiceQuestionsPrompt
        },
        ...conversationMessages
    ];

    // Generate the practice questions
    const result = await generateText({
        model: `${provider}/${userModel}`,
        messages: messagesForAI,
        temperature: 0.7,
    });

    return result.text;
}
