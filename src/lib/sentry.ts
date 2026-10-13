// Shared by sentry.client.config.js, sentry.server.config.js and the tunnel route
export const SENTRY_DSN = 'https://109d03667fa49f8fdeff6863d919d1fb@o4510689442529280.ingest.us.sentry.io/4510689443512320';

// Same-origin path the browser SDK posts envelopes to, so ad blockers and proxies
// in front of the Sentry ingest host can't block or reject them (#347)
export const SENTRY_TUNNEL_PATH = '/api/sentry-tunnel';
