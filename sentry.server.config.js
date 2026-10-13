import * as Sentry from '@sentry/astro';

import { SENTRY_DSN } from './src/lib/sentry';

Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
});