import type { User } from 'better-auth';
import { checkThreadAccess } from '@/lib/auth/check-thread-access';
import { getLatestContent } from '@/lib/content/latest';

export async function getLatestResources(
    threadId: string,
    user: User | null,
): Promise<{ content: string | null } | null> {
    const access = await checkThreadAccess(threadId, user);
    if (!access.isAuthorized && !access.isPublic) return null;

    const content = await getLatestContent(threadId, 'additional-resources');
    return { content: typeof content === 'string' ? content : content === null ? null : JSON.stringify(content) ?? null };
}
