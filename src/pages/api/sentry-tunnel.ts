import { SENTRY_DSN } from '@/lib/sentry';

import type { APIRoute } from 'astro';

const allowedDsn = new URL(SENTRY_DSN);
const allowedProjectId = allowedDsn.pathname.replace(/^\//, '');

// Forwards envelopes from the browser SDK to Sentry. Only our own DSN is accepted, so the route can't be used to post to other Sentry projects or hosts. https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option
export const POST: APIRoute = async ({ request }) => {
    const envelope = await request.arrayBuffer();

    try {
        // The first line of an envelope is a JSON header that carries the DSN
        const bytes = Buffer.from(envelope);
        const headerEnd = bytes.indexOf('\n');
        const headerLine = bytes.toString('utf8', 0, headerEnd === -1 ? bytes.length : headerEnd);
        const header: { dsn?: string } = JSON.parse(headerLine);

        if (typeof header.dsn !== 'string') {
            return new Response('Missing DSN', { status: 400 });
        }

        const dsn = new URL(header.dsn);
        const projectId = dsn.pathname.replace(/^\//, '');

        if (dsn.hostname !== allowedDsn.hostname || projectId !== allowedProjectId) {
            return new Response('Invalid DSN', { status: 403 });
        }
    } catch (error) {
        console.error('❌ Invalid Sentry envelope:', error);
        return new Response('Invalid envelope', { status: 400 });
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/x-sentry-envelope',
        };

        // Keep the user's IP for Sentry (sendDefaultPii) instead of the server's
        const forwardedFor = request.headers.get('x-forwarded-for');
        if (forwardedFor) {
            headers['X-Forwarded-For'] = forwardedFor;
        }

        const upstream = await fetch(`https://${allowedDsn.hostname}/api/${allowedProjectId}/envelope/`, {
            method: 'POST',
            headers,
            body: envelope,
        });

        if (!upstream.ok) {
            console.error(`❌ Sentry ingest returned ${upstream.status}`);
        }

        // Pass the status and rate-limit headers through so the SDK can back off
        const responseHeaders: Record<string, string> = {};
        for (const name of ['retry-after', 'x-sentry-rate-limits']) {
            const value = upstream.headers.get(name);
            if (value) {
                responseHeaders[name] = value;
            }
        }

        return new Response(await upstream.text(), {
            status: upstream.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('❌ Error forwarding Sentry envelope:', error);
        return new Response('Could not reach Sentry', { status: 502 });
    }
};
