import type { User } from 'better-auth';
import { checkThreadAccess } from '@/lib/auth/thread-access';
import { getLatestContent } from '@/lib/content/latest/';

export async function getLatestReferenceSheet(threadId: string, user: User | null): Promise<{ content: string | null } | null> {
    if (!await checkThreadAccess(threadId, user)) return null;

    const content = await getLatestContent(threadId, 'reference-sheet');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
