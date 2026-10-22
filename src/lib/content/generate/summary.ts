import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateText } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import { buildContentSystemPrompt } from '@/lib/content';
import { parseThreadData, type UploadedFile } from '@/lib/threads';
import { saveContent } from '@/lib/content/latest';
import { buildUploadedFilesContext } from '@/lib/content/generate/uploaded-files-context';

import { eq } from 'drizzle-orm';

export async function generateSummary(threadId: string, userPrompt?: string) {
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) throw new Error('Thread not found');

    const thread = threads[0];
    // Always use default model for content generation (more reliable)
    const userModel = config.model;
    const provider = config.provider;

    const threadData = parseThreadData(thread.thread);
    const messages = threadData?.messages ?? [];

    const uploadedFiles = thread.uploadedFiles ?? [];

    if (messages.length === 0) throw new Error('No messages found in thread');

    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    const summaryPrompt =
`${buildContentSystemPrompt('Chat Summary', uploadedFilesContext)}

FAITHFULNESS RULES:
- Summarize ONLY what was actually said in the conversation. Every fact, step, formula, number and result in the summary must appear in the conversation itself.
- Do NOT solve, finish or extend any problem. Do NOT compute or add numeric results, answers or conclusions that were not stated in the conversation.
- If a problem was left unfinished, or a step was left for the student to do, say so plainly (for example, "the final numeric calculation was left to the student") instead of filling it in.

OUTPUT FORMAT:
### Chat Summary

#### Overview
(A concise overview of the entire conversation and the main topics discussed.)

#### Key Points
(Bullet points of the most important takeaways, explanations, or solutions actually given in the conversation.)

#### Next Steps / Recommendations
(Suggest what the student should focus on next or how to further their understanding based on the chat.)

Math formatting: use \`$…$\` for inline math and \`$$…$$\` for block math.

REMEMBER: Output ONLY the Chat Summary in markdown format. No other content types.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const result = await generateText(
        summaryPrompt,
        'Now generate a comprehensive summary based on the above conversation. Include only what was actually said in it; do not solve or add anything that was not. Output ONLY the summary content in markdown format. Do not include any explanations, commentary, or conversation - just the summary.',
        messages,
        userModel,
        provider,
        {},
        config.contentGenerationExcludeTools,
    );

    if (!result.text || result.text.length === 0) throw new Error('Generated summary is empty');

    await saveContent(threadId, 'summary', result.text);

    return result.text;
}
