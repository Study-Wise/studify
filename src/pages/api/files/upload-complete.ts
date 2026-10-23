import { nanoid } from 'nanoid';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { chunkedUploads, cleanupStaleUploads } from '@/lib/chunked-upload-store';
import { extractTextFromFile } from '@/lib/file-processing';
import type { UploadedFile } from '@/lib/threads';
import { userFilesUpload } from '@/lib/uploadthing';
import { getUserErrorMessage } from '@/lib/user-errors';

import { eq } from 'drizzle-orm';

import type { APIRoute } from 'astro';

const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'image/bmp', 'image/x-windows-bmp', 'image/tiff', 'image/x-tiff', 'image/apng',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-word.document.macroEnabled.12',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'application/vnd.visio',
    'application/vnd.ms-visio.drawing',
    'application/x-mspublisher',
    'message/rfc822',
    'text/plain', 'text/csv', 'text/html', 'text/markdown'
];

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    try {
        // Use the authenticated session user, never a client-supplied email
        if (!locals.user?.email) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                { status: 401 }
            );
        }

        // Clean up stale uploads periodically
        cleanupStaleUploads();

        const { uploadId } = await request.json();

        if (!uploadId) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Missing uploadId' }),
                { status: 400 }
            );
        }

        const upload = chunkedUploads.get(uploadId);
        if (!upload || upload.email !== locals.user?.email) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Upload not found or expired' }),
                { status: 404 }
            );
        }

        if (upload.receivedChunks !== upload.totalChunks) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    error: `Missing chunks: received ${upload.receivedChunks}/${upload.totalChunks}`
                }),
                { status: 400 }
            );
        }

        if (!allowedTypes.includes(upload.fileType)) {
            chunkedUploads.delete(uploadId);
            return new Response(
                JSON.stringify({ status: 'error', error: 'File type not supported' }),
                { status: 400 }
            );
        }

        const thread = await db
            .select()
            .from(threadsTable)
            .where(eq(threadsTable.id, upload.threadId))
            .limit(1);

        if (!thread.length || thread[0].email !== upload.email) {
            chunkedUploads.delete(uploadId);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Thread not found or unauthorized' }),
                { status: 403 }
            );
        }

        // Reassemble file from chunks
        chunkedUploads.delete(uploadId);

        const file = new File([assembled], upload.fileName, { type: upload.fileType });

        const extractedText = await extractTextFromFile(file);

        const uploadResult = await userFilesUpload.uploadFile(file, {
            metadata: {
                threadId: upload.threadId,
                email: upload.email,
                uploadedAt: new Date().toISOString()
            }
        });

        if (!uploadResult.data) throw new Error('Upload failed');

        const fileMetadata: UploadedFile = {
            key: uploadResult.data.key,
            name: uploadResult.data.name,
            size: uploadResult.data.size,
            type: upload.fileType,
            url: userFilesUpload.getFileUrl(uploadResult.data.key),
            uploadedAt: new Date().toISOString(),
            extractedText: extractedText || null
        };

        const currentFiles = thread[0].uploadedFiles || [];
        const updatedFiles = [...currentFiles, fileMetadata];

        await db
            .update(threadsTable)
            .set({
                uploadedFiles: updatedFiles,
                updatedAt: new Date()
            })
            .where(eq(threadsTable.id, upload.threadId));

        return new Response(
            JSON.stringify({ status: 'success', file: fileMetadata }),
            { status: 200 }
        );
    } catch (error) {
        console.error(`❌ [${requestId}] Upload complete error:`, error);
        return new Response(
            JSON.stringify({
                status: 'error',
                error: getUserErrorMessage(error, 'upload your file', requestId)
            }),
            { status: 500 }
        );
    }
};
