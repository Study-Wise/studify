import * as Sentry from '@sentry/astro';

Sentry.init({
    dsn: 'https://109d03667fa49f8fdeff6863d919d1fb@o4510689442529280.ingest.us.sentry.io/4510689443512320',
    tracesSampleRate: 1.0,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
});