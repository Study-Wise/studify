import { VendorError } from '@/lib/user-errors';
import { UTApi } from 'uploadthing/server';

export interface UploadOptions {
    metadata?: Record<string, string>;
    contentDisposition?: 'inline' | 'attachment';
    acl?: 'public-read' | 'private';
}

export function createUploadThingUtils(envVar: string, appId: string) {
    const utapi = new UTApi({
        token: import.meta.env[envVar] || process.env[envVar] || import.meta.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_TOKEN || '',
    });

    return {
        uploadFile: async (file: File, options?: UploadOptions) => {
            const result = await utapi.uploadFiles(file, options);
            if (result.error) throw new VendorError('UploadThing', result.error.message, { cause: result.error });
            return result;
        },

        uploadFiles: async (files: File[], options?: UploadOptions & { concurrency?: number }) => {
            return await utapi.uploadFiles(files, options);
        },

        uploadFileFromUrl: async (url: string, options?: UploadOptions) => {
            return await utapi.uploadFilesFromUrl(url, options);
        },

        uploadImageByUrl: async (url: string, options?: UploadOptions) => {
            return await utapi.uploadFilesFromUrl(url, options);
        },

        uploadFilesFromUrls: async (urls: string[], options?: UploadOptions & { concurrency?: number }) => {
            return await utapi.uploadFilesFromUrl(urls, options);
        },

        deleteFiles: async (fileKeys: string | string[]) => {
            return await utapi.deleteFiles(fileKeys);
        },

        listFiles: async (options?: { limit?: number; offset?: number }) => {
            const result = await utapi.listFiles(options);
            return result.files.map(file => ({
                key: file.key,
                name: file.name,
                size: file.size,
                ufsUrl: `https://${appId}.ufs.sh/f/${file.key}`
            }));
        },

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

export const userFilesUpload = createUploadThingUtils('USERFILES_UPLOADTHING_TOKEN', 'rsmwe6uny3');
