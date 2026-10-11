import { UTApi } from 'uploadthing/server';

import { VendorError } from '@/lib/user-errors';

// Tags UploadThing failures so users see the vendor name
async function tagged<T>(call: Promise<T>): Promise<T> {
    try {
        return await call;
    } catch (error) {
        throw new VendorError('UploadThing', 'UploadThing request failed', { cause: error });
    }
}

export interface UploadOptions {
    metadata?: Record<string, string>;
    contentDisposition?: 'inline' | 'attachment';
    acl?: 'public-read' | 'private';
}

// Factory function to create UploadThing utilities with custom config
export function createUploadThingUtils(envVar: string, appId: string) {
    // Initialize UTApi with token from environment variable
    const utapi = new UTApi({
        token: import.meta.env[envVar] || process.env[envVar] || import.meta.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_TOKEN || '',
    });

    return {
        // Upload a single file
        uploadFile: async (file: File, options?: UploadOptions) => {
            const result = await tagged(utapi.uploadFiles(file, options));
            if (result.error) {
                throw new VendorError('UploadThing', result.error.message, { cause: result.error });
            }
            return result;
        },

        // Upload multiple files
        uploadFiles: async (files: File[], options?: UploadOptions & { concurrency?: number }) => {
            return await tagged(utapi.uploadFiles(files, options));
        },

        // Upload file from URL
        uploadFileFromUrl: async (url: string, options?: UploadOptions) => {
            return await tagged(utapi.uploadFilesFromUrl(url, options));
        },

        // Upload image from URL
        uploadImageByUrl: async (url: string, options?: UploadOptions) => {
            return await tagged(utapi.uploadFilesFromUrl(url, options));
        },

        // Upload multiple files from URLs
        uploadFilesFromUrls: async (urls: string[], options?: UploadOptions & { concurrency?: number }) => {
            return await tagged(utapi.uploadFilesFromUrl(urls, options));
        },

        // Delete files
        deleteFiles: async (fileKeys: string | string[]) => {
            return await tagged(utapi.deleteFiles(fileKeys));
        },

        // List all files
        listFiles: async (options?: { limit?: number; offset?: number }) => {
            const result = await tagged(utapi.listFiles(options));
            return result.files.map(file => ({
                key: file.key,
                name: file.name,
                size: file.size,
                ufsUrl: `https://${appId}.ufs.sh/f/${file.key}`
            }));
        },

        // Get file URL
        getFileUrl: (fileKey: string) => {
            return `https://utfs.io/f/${fileKey}`;
        }
    };
}

// Default instance for regular uploads (infographics, etc.)
export const {
    uploadFile,
    uploadFiles,
    uploadFileFromUrl,
    uploadImageByUrl,
    uploadFilesFromUrls,
    deleteFiles,
    listFiles
} = createUploadThingUtils('UPLOADTHING_TOKEN', import.meta.env.UPLOADTHING_APP_ID || process.env.UPLOADTHING_APP_ID || '06kq2k6jjh');

// User files instance
export const userFilesUpload = createUploadThingUtils('USERFILES_UPLOADTHING_TOKEN', 'rsmwe6uny3');
