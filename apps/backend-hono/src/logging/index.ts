import { logger } from '@sentry/bun';
import { ENV } from '../constants';

/**
 * Logging Utilities
 * - Uses console.log in development and Sentry logger in production.
 */
export const loginfo = ENV === 'development' ? console.log : logger.info;

/**
 * Logging Utilities
 * - Uses console.error in development and Sentry logger in production.
 */
export const logerror = ENV === 'development' ? console.error : logger.error;

/**
 * Logging Utilities
 * - Uses console.warn in development and Sentry logger in production.
 */
export const logwarn = ENV === 'development' ? console.warn : logger.warn;

/**
 * Logging Utilities
 * - Uses console.debug in development and Sentry logger in production.
 */
export const logdebug = ENV === 'development' ? console.debug : logger.debug;

/**
 * Logging Utilities
 * - Uses console.trace in development and Sentry logger in production.
 */
export const logtrace = ENV === 'development' ? console.trace : logger.trace;
