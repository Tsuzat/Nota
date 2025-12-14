import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://15eef79e923f96adf8d51ba82c15d84b@o4509331475333120.ingest.de.sentry.io/4510436104798288',
  tracesSampleRate: 1.0,

  tunnel: '/api/tunnel', // Route Sentry events through your tunnel

  // Enable logs to be sent to Sentry
  enableLogs: true,
  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
