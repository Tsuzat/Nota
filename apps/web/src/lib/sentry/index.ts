import { logger } from '@sentry/sveltekit';

export const loginfo = logger.info;
export const logerror = logger.error;
export const logwarn = logger.warn;
export const logdebug = logger.debug;
