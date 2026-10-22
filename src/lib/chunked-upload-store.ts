interface ChunkedUpload {
    chunks: (Uint8Array | undefined)[];
    totalChunks: number;
    receivedChunks: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    threadId: string;
    email: string;
    createdAt: number;
}

// In-memory store for chunked uploads (shared across API routes in the same server instance)
export const chunkedUploads = new Map<string, ChunkedUpload>();

// Clean up stale uploads older than 10 minutes
const STALE_TIMEOUT = 10 * 60 * 1000;

export function cleanupStaleUploads() {
    for (const [id, upload] of chunkedUploads) {
        if (Date.now() - upload.createdAt > STALE_TIMEOUT) chunkedUploads.delete(id);
    }
}
