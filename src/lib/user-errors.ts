// A third-party failure. Users see the vendor name (for support requests), never the raw message
export class VendorError extends Error {
    constructor(public vendor: string, message: string, options?: ErrorOptions) {
        super(message, options);
    }
}

// User-safe message for any error; the request ID matches the full error in the server logs
export function getUserErrorMessage(error: unknown, action: string, requestId: string): string {
    const cause = error instanceof VendorError ? ` because our ${error.vendor} service is having problems` : '';
    return `Sorry, we couldn't ${action}${cause}. Please try again later. (Ref: ${requestId})`;
}

export const THREAD_NOT_FOUND_MESSAGE = "We couldn't find this chat. If it's a new chat, send a message first, then try again.";
