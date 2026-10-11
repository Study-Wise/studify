import { providers } from '@/lib/models';

// An error from a third-party service. The vendor name is shown to users so they
// can mention it in support requests; the underlying message is only logged
export class VendorError extends Error {
    vendor: string;

    constructor(vendor: string, message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'VendorError';
        this.vendor = vendor;
    }
}

// An error whose message is written for users and safe to show as is
export class UserFacingError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'UserFacingError';
    }
}

// Display name for an AI provider key, e.g. 'openai' → 'OpenAI'
export function getProviderName(provider: string): string {
    return providers[provider]?.name ?? provider;
}

// Finds the first error of the given class in an error's cause chain
function findInChain<T extends Error>(error: unknown, errorClass: new (...args: never[]) => T): T | null {
    let current: unknown = error;
    for (let depth = 0; current && depth < 10; depth++) {
        if (current instanceof errorClass) return current;
        current = current instanceof Error ? current.cause : null;
    }
    return null;
}

// Turns any error into a message safe to show users. Names the vendor when one
// failed, but never passes on its raw message (status codes, billing URLs, etc.).
// The request ID lets support find the full error in the server logs
export function getUserErrorMessage(error: unknown, action: string, requestId: string): string {
    const userFacing = findInChain(error, UserFacingError);
    if (userFacing) return userFacing.message;

    const vendorError = findInChain(error, VendorError);
    if (vendorError) {
        return `Sorry, we couldn't ${action} because our ${vendorError.vendor} service is having problems. Please try again later. (Ref: ${requestId})`;
    }

    return `Sorry, something went wrong while trying to ${action}. Please try again. (Ref: ${requestId})`;
}

export const THREAD_NOT_FOUND_MESSAGE = "We couldn't find this chat. If it's a new chat, send a message first, then try again.";
export const NO_MESSAGES_MESSAGE = 'This chat has no messages yet. Send a message first, then try again.';
