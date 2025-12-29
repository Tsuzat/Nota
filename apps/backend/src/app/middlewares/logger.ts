import type { Context, Next } from 'hono';
import { getConnInfo } from 'hono/bun';
import { loginfo } from '../../logging';

export const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  const ua = c.req.header('User-Agent') || 'Unknown';
  const info = getConnInfo(c);

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  const message = `[${c.req.method}] ${c.req.path} - ${status} - ${duration}ms`;
  const context = {
    method: c.req.method,
    path: c.req.path,
    status,
    duration,
    ip: info.remote.address,
    os,
    browser,
    userAgent: ua,
  };

  loginfo(message, context);
};
