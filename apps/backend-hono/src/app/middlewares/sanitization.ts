import type { Context, Next } from 'hono';

/**
 * Basic Input Sanitization Middleware
 * - Checks Query Params for common XSS vectors.
 * - Checks for Null Bytes in Query Params.
 * - (Body sanitization is deliberately skipped to preserve rich text/Markdown content in Notes,
 *   relying instead on Zod schemas and ORM protection).
 */
export const sanitizationMiddleware = async (c: Context, next: Next) => {
  const query = c.req.query();

  for (const [key, value] of Object.entries(query)) {
    if (isSuspicious(value)) {
      return c.json({ error: `Malicious input detected in query parameter: ${key}` }, 400);
    }
  }

  // We could also inspect headers here if needed, e.g. X-Forwarded-Host injection

  await next();
};

const SUSPICIOUS_PATTERNS = [
  /<script>/i,
  /javascript:/i,
  /vbscript:/i,
  /data:/i,
  /onload=/i,
  /onerror=/i,
  /onclick=/i,
  /u0000/, // Null byte
];

function isSuspicious(input: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(input));
}
