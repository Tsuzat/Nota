import { redis } from 'bun';
import type { Context, Next } from 'hono';
import { getConnInfo } from 'hono/bun';
import { logwarn } from '../../logging';

// Ban duration in seconds (24 hours)
const BAN_DURATION_SECONDS = 24 * 60 * 60;

// List of suspicious paths that should trigger a ban
const HONEYPOT_PATHS = [
  '/.env',
  '/.git',
  '/wp-config.php',
  '/config.php',
  '/id_rsa',
  '/.ssh',
  '/phpinfo.php',
  '/admin.php',
  '/.ds_store',
  '/composer.lock',
  '/package.json',
  '/node_modules',
  '/public/.env',
  '/storage/logs',
  '/docker-compose.yml',
  '/Dockerfile',
  '/.aws/credentials',
  '/.azure/credentials',
  '/api-keys.json',
  '/secrets.json',
  '/web.config',
  '/crossdomain.xml',
  '/.htaccess',
  '/parameters.json',
  '/parameters.yml',
  '/app.yml',
  '/app.json',
  '/settings.json',
  '/settings.php',
  '/.gitconfig',
  '/k8s.yaml',
  '/kubernetes.yml',
  '/.docker',
  '/.dockerenv',
  '/docker-compose.yaml',
  '/apikeys.json',
  '/api_keys.json',
  '/tokens.json',
  '/keys.json',
  '/credentials.json',
  '/azure.json',
  '/gcp-credentials.json',
  '/.gcloud',
  '/s3.yml',
  '/.s3cfg',
  '/aws-config.json',
  '/aws.json',
  '/.aws',
  '/php_error.log',
  '/php_errors.log',
  '/error_log',
  '/debug.txt',
  '/errors.log',
  '/error.log',
  '/debug.log',
  '/config~',
  '/config.save',
  '/config.old',
  '/config.bak',
  '/www.zip',
  '/site.zip',
  '/backup.tar.gz',
  '/backup.zip',
  '/database.sql',
  '/backup.sql',
  '/wp-config.txt',
  '/bootstrap/cache',
];

export const getClientIdentifier = (c: Context) => {
  const info = getConnInfo(c);
  const ip = info.remote.address || 'unknown';
  const cleanIp = ip.replace('::ffff:', '');
  const country = c.req.header('cf-ipcountry') || c.req.header('x-vercel-ip-country') || 'unknown';
  return `${cleanIp}:${country}`;
};

export const getBanKey = (c: Context) => `ban:${getClientIdentifier(c)}`;

export const banMiddleware = async (c: Context, next: Next) => {
  try {
    const info = getConnInfo(c);
    const ip = info.remote.address || 'unknown';
    const banKey = getBanKey(c);
    // 1. Check if IP is already banned
    const isBanned = await redis.exists(banKey);
    if (isBanned) {
      logwarn(`[SECURITY] Client ${getClientIdentifier(c)} (IP: ${ip}) is banned`);
      return c.text('Forbidden', 403);
    }
    // 2. Check for suspicious paths (Honeypot)
    const path = c.req.path.toLowerCase();
    // Check exact match or starts with for directories like /.git/
    const isSuspicious = HONEYPOT_PATHS.some(
      (badPath) => path === badPath || path.startsWith(`${badPath}/`) || path.endsWith(badPath)
    );
    if (isSuspicious) {
      logwarn(`[SECURITY] Banning IP ${ip} for accessing suspicious path: ${path}`);
      // Ban the IP in Redis
      await redis.set(banKey, 'true');
      await redis.expire(banKey, BAN_DURATION_SECONDS);
      return c.text('Forbidden', 403);
    }
  } catch (error) {
    logwarn(`[SECURITY] Error in banMiddleware: ${error}`);
    return c.text('Internal Server Error', 500);
  }

  await next();
};
