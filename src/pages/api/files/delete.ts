import type { APIRoute } from 'astro';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { userFilesUpload } from '@/lib/uploadthing';
import type { UploadedFile } from '@/lib/threads';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { threadId, email, fileKey } = await request.json();

        if (!threadId || !email || !fileKey) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    error: 'Missing required fields'
                }),
                { status: 400 }
            );
        }

        // Verify thread ownership
        const thread = await db
            .select()
            .from(threadsTable)
            .where(eq(threadsTable.id, threadId))
            .limit(1);

        if (!thread.length || thread[0].email !== email) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    error: 'Thread not found or unauthorized'
                }),
                { status: 403 }
            );
        }

        // Remove file from UploadThing
        try {
            await userFilesUpload.deleteFiles(fileKey);
        } catch (error) {
            console.error('UploadThing deletion error:', error);
            // Continue even if UploadThing deletion fails
        }

        // Remove file from thread metadata
        const currentFiles = (thread[0].uploadedFiles || []) as UploadedFile[];
        const updatedFiles = currentFiles.filter((file) => file.key !== fileKey);

        await db
            .update(threadsTable)
            .set({
                uploadedFiles: updatedFiles,
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
