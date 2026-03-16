import type { APIRoute } from 'astro';
import { chunkedUploads } from '@/lib/chunked-upload-store';

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const chunk = formData.get('chunk') as File;
        const uploadId = formData.get('uploadId') as string;
        const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
        const totalChunks = parseInt(formData.get('totalChunks') as string, 10);
        const fileName = formData.get('fileName') as string;
        const fileType = formData.get('fileType') as string;
        const fileSize = parseInt(formData.get('fileSize') as string, 10);
        const threadId = formData.get('threadId') as string;
        const email = formData.get('email') as string;

        if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || !threadId || !email) {
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

        const upload = chunkedUploads.get(uploadId)!;

        // Don't accept duplicate chunks
        if (!upload.chunks[chunkIndex]) {
            upload.chunks[chunkIndex] = chunkBuffer;
            upload.receivedChunks++;
        }

        return new Response(
            JSON.stringify({
                status: 'success',
                receivedChunks: upload.receivedChunks,
                totalChunks: upload.totalChunks
            }),
            { status: 200 }
        );
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
