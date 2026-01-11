import type { APIRoute } from 'astro';

export const ALL: APIRoute = async ({ request, params }) => {
    const BASE_URL = process.env.NEON_AUTH_BASE_URL;
    if (!BASE_URL) {
        return new Response('NEON_AUTH_BASE_URL not configured', { status: 500 });
    }

    const path = params.path || '';
    const url = new URL(request.url);
    const targetUrl = `${BASE_URL}/${path}${url.search}`;

    // Forward all relevant headers
    const headers = new Headers();
    const headersToForward = [
        'content-type',
        'authorization',
        'cookie',
        'user-agent',
        'accept',
        'origin',
        'referer',
    ];

    for (const header of headersToForward) {
        const value = request.headers.get(header);
        if (value) {
            headers.set(header, value);
        }
    }

    const body = request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined;

    const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
    });

    // Log errors for debugging
    if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Auth Proxy Error]', {
            method: request.method,
            path,
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
        });
        return new Response(errorBody, {
            status: response.status,
            headers: response.headers,
        });
    }

    // Forward response headers, rewriting set-cookie for localhost
    const responseHeaders = new Headers();

    for (const [key, value] of response.headers.entries()) {
        if (key.toLowerCase() === 'set-cookie') {
            // Rewrite cookie to work with localhost (HTTP)
            const rewrittenCookie = value
                .replace(/__Secure-/g, '') // Remove __Secure- prefix (requires HTTPS)
                .replace(/Domain=[^;]+;?\s*/gi, '') // Remove domain restriction
                .replace(/Secure;?\s*/gi, ''); // Remove Secure flag
            responseHeaders.append('set-cookie', rewrittenCookie);
        } else {
            responseHeaders.set(key, value);
        }
    }

    return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
    });
};

export const prerender = false;
