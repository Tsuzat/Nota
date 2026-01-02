import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = Sentry.sentryHandle();
export const handleError = Sentry.handleErrorWithSentry();
