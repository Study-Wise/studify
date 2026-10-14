import { chunkedUploads } from '@/lib/chunked-upload-store';

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const email = locals.user?.email;
        if (!email) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const chunk = formData.get('chunk');
        const uploadId = formData.get('uploadId');
        const chunkIndexValue = formData.get('chunkIndex');
        const totalChunksValue = formData.get('totalChunks');
        const fileName = formData.get('fileName');
        const fileType = formData.get('fileType');
        const fileSizeValue = formData.get('fileSize');
        const threadId = formData.get('threadId');

        const chunkIndex = typeof chunkIndexValue === 'string' ? Number.parseInt(chunkIndexValue, 10) : Number.NaN;
        const totalChunks = typeof totalChunksValue === 'string' ? Number.parseInt(totalChunksValue, 10) : Number.NaN;
        const fileSize = typeof fileSizeValue === 'string' ? Number.parseInt(fileSizeValue, 10) : Number.NaN;

        const hasValidFields =
            chunk instanceof File &&
            typeof uploadId === 'string' &&
            !Number.isNaN(chunkIndex) &&
            !Number.isNaN(totalChunks) &&
            typeof fileName === 'string' &&
            typeof fileType === 'string' &&
            !Number.isNaN(fileSize) &&
            typeof threadId === 'string';

        if (!hasValidFields) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Missing required fields' }),
                { status: 400 }
            );
        }

        // Validate total file size (max 10MB)
        if (fileSize > 10 * 1024 * 1024) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'File size exceeds 10MB limit' }),
                { status: 400 }
            );
        }

        const chunkBuffer = new Uint8Array(await chunk.arrayBuffer());

        // The first chunk creates the upload record; later chunks reuse it.
        if (!chunkedUploads.has(uploadId)) {
            chunkedUploads.set(uploadId, {
                chunks: new Array(totalChunks),
                totalChunks,
                receivedChunks: 0,
                fileName,
                fileType,
                fileSize,
                threadId,
                email,
                createdAt: Date.now()
            });
        }

        const upload = chunkedUploads.get(uploadId);
        if (!upload) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Upload not found or unauthorized' }),
                { status: 403 }
            );
        }

        // Keep each upload bound to its original user and thread.
        if (upload.email !== email || upload.threadId !== threadId) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Upload not found or unauthorized' }),
                { status: 403 }
            );
        }

        if (chunkIndex < 0 || chunkIndex >= upload.totalChunks) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Invalid chunk index' }),
                { status: 400 }
            );
        }

        // Don't accept duplicate chunks
        if (!upload.chunks[chunkIndex]) {
            upload.chunks[chunkIndex] = chunkBuffer;
            upload.receivedChunks++;
        }

        return new Response(JSON.stringify({
            status: 'success',
            receivedChunks: upload.receivedChunks,
            totalChunks: upload.totalChunks
        }), { status: 200 });
    } catch (error) {
        console.error('Chunk upload error:', error);
        return new Response(
            JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : 'Chunk upload failed'
            }),
            { status: 500 }
        );
    }
};
