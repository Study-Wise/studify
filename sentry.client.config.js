import * as Sentry from '@sentry/astro';

import { SENTRY_DSN, SENTRY_TUNNEL_PATH } from './src/lib/sentry';

Sentry.init({
    dsn: SENTRY_DSN,
    // Send envelopes through our own origin; direct requests to the ingest host were failing with 503 (#347)
    tunnel: SENTRY_TUNNEL_PATH,
    tracesSampleRate: 1.0,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
});