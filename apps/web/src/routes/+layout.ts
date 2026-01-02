export const ssr = false;
export const prerender = false;

import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectAnalytics();
injectSpeedInsights();
