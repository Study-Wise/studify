import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { userFilesUpload } from '@/lib/uploadthing';

import { eq } from 'drizzle-orm';

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // Use the authenticated session user, never a client-supplied email
        if (!locals.user?.email) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                { status: 401 }
            );
        }

        const { threadId, fileKey } = await request.json();

        if (!threadId || !fileKey) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    error: 'Missing required fields'
                }),
                { status: 400 }
            );
        }

        const thread = await db
            .select()
            .from(threadsTable)
            .where(eq(threadsTable.id, threadId))
            .limit(1);

        if (!thread.length || thread[0].email !== locals.user?.email) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    error: 'Thread not found or unauthorized'
                }),
                { status: 403 }
            );
        }

        try {
            await userFilesUpload.deleteFiles(fileKey);
        } catch (error) {
            console.error('UploadThing deletion error:', error);
            // Continue even if UploadThing deletion fails
        }

        await db
            .update(threadsTable)
            .set({
                uploadedFiles: (thread[0].uploadedFiles || []).filter(file => file.key !== fileKey),
                updatedAt: new Date()
            })
            .where(eq(threadsTable.id, threadId));

        return new Response(
            JSON.stringify({
                status: 'success',
                message: 'File deleted successfully'
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('File deletion error:', error);
        return new Response(
            JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : 'Deletion failed'
            }),
            { status: 500 }
        );
    }
};
