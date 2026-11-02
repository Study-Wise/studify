interface VendorErrorOptions extends ErrorOptions {
    // User-safe phrase that follows "because", e.g. "our OpenAI account has run out of credits"
    reason?: string;
}

// A third-party failure. Users see the vendor name (for support requests) and the user-safe reason when one is known, never the raw message
export class VendorError extends Error {
    public reason?: string;

    constructor(public vendor: string, message: string, options?: VendorErrorOptions) {
        super(message, options);
        this.reason = options?.reason;
    }
}

// User-safe message for any error; the request ID matches the full error in the server logs
export function getUserErrorMessage<T>(error: T, action: string, requestId: string): string {
    let because = '';

    if (error instanceof VendorError) because = ` because ${error.reason ?? `our ${error.vendor} service is having problems`}`;

    return `Sorry, we couldn't ${action}${because}. Please try again later. (Ref: ${requestId})`;
}

export const THREAD_NOT_FOUND_MESSAGE = "We couldn't find this chat. If it's a new chat, send a message first, then try again.";
