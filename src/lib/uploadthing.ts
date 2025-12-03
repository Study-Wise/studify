import { UTApi } from 'uploadthing/server';
import type { UploadOptions } from './types';

// Initialize UTApi
export const utapi = new UTApi();

// Get app ID from environment
const APP_ID = process.env.UPLOADTHING_APP_ID || '06kq2k6jjh';

// Upload a single file
export async function uploadFile(file: File, options?: UploadOptions) {
    return await utapi.uploadFiles(file, options);
}

// Upload multiple files
export async function uploadFiles(files: File[], options?: UploadOptions & { concurrency?: number }) {
    return await utapi.uploadFiles(files, options);
}

// Upload file from URL
export async function uploadFileFromUrl(url: string, options?: UploadOptions) {
    return await utapi.uploadFilesFromUrl(url, options);
}

// Upload image from URL
export async function uploadImageByUrl(url: string, options?: UploadOptions) {
    return await utapi.uploadFilesFromUrl(url, options);
}

// Upload image from base64
export async function uploadImageFromBase64(base64Data: string, fileName: string = 'image.png', options?: UploadOptions) {
    // Remove data:image/png;base64, prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');

    // Create a File object from buffer
    const file = new File([buffer], fileName, { type: 'image/png' });

    return await utapi.uploadFiles(file, options);
}

// Upload multiple files from URLs
export async function uploadFilesFromUrls(urls: string[], options?: UploadOptions & { concurrency?: number }) {
    return await utapi.uploadFilesFromUrl(urls, options);
}

// Delete files
export async function deleteFiles(fileKeys: string | string[]) {
    return await utapi.deleteFiles(fileKeys);
}

// List all files
export async function listFiles(options?: { limit?: number; offset?: number }) {
    const result = await utapi.listFiles(options);
    return result.files.map(file => ({
        key: file.key,
        name: file.name,
        size: file.size,
        ufsUrl: `https://${APP_ID}.ufs.sh/f/${file.key}`
    }));
}
