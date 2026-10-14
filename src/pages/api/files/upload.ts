import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { extractTextFromFile } from '@/lib/file-processing';
import type { UploadedFile } from '@/lib/threads';
import { userFilesUpload } from '@/lib/uploadthing';
import { getUserErrorMessage } from '@/lib/user-errors';
import { nanoid } from 'nanoid';

import { eq } from 'drizzle-orm';

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    try {
        const email = locals.user?.email;
        if (!email) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const threadId = formData.get('threadId');

        if (!(file instanceof File) || typeof threadId !== 'string' || !threadId || !email) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    error: 'Missing required fields'
                }),
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    error: 'File size exceeds 10MB limit'
                }),
                { status: 400 }
            );
        }

        const allowedTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'image/bmp', 'image/x-windows-bmp', 'image/tiff', 'image/x-tiff', 'image/apng',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-word.document.macroEnabled.12',
            // PowerPoint
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
            // Excel
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel.sheet.macroEnabled.12',
            // Visio
            'application/vnd.visio',
            'application/vnd.ms-visio.drawing',
            // Publisher
            'application/x-mspublisher',
            // Email
            'message/rfc822',
            // Text
            'text/plain', 'text/csv', 'text/html', 'text/markdown'
        ];

        if (!allowedTypes.includes(file.type)) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    error: 'File type not supported'
                }),
                { status: 400 }
            );
        }

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

        const extractedText = await extractTextFromFile(file);

        const uploadResult = await userFilesUpload.uploadFile(file, {
            metadata: {
                threadId,
                email,
                uploadedAt: new Date().toISOString()
            }
        });

        if (!uploadResult.data) {
            throw new Error('Upload failed');
        }

        const fileMetadata: UploadedFile = {
            key: uploadResult.data.key,
            name: uploadResult.data.name,
            size: uploadResult.data.size,
            type: file.type,
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
            .where(eq(threadsTable.id, threadId));

        return new Response(
            JSON.stringify({
                status: 'success',
                file: fileMetadata
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error(`❌ [${requestId}] File upload error:`, error);
        return new Response(
            JSON.stringify({
                status: 'error',
                error: getUserErrorMessage(error, 'upload your file', requestId)
            }),
            { status: 500 }
        );
    }
};
