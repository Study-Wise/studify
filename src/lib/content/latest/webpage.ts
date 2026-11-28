import type { User } from 'better-auth';
import { checkThreadAccess } from '@/lib/auth/thread-access';
import { getLatestContent } from '@/lib/content/latest/';

export async function getLatestWebpage(threadId: string, user: User | null): Promise<{ content: string | null } | null> {
    if (!await checkThreadAccess(threadId, user)) return null;

    const content = await getLatestContent(threadId, 'webpage');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
