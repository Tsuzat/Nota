import { logger } from '@sentry/bun';
import { ENV } from '../constants';

export const loginfo = ENV === 'development' ? console.log : logger.info;
export const logerror = ENV === 'development' ? console.error : logger.error;
export const logwarn = ENV === 'development' ? console.warn : logger.warn;
export const logdebug = ENV === 'development' ? console.debug : logger.debug;
export const logtrace = ENV === 'development' ? console.trace : logger.trace;
