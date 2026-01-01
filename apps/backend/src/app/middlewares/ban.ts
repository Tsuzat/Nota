import type { Context, Next } from 'hono';
import { getConnInfo } from 'hono/bun';
import { logwarn } from '../../logging';

// Ban duration in milliseconds (e.g., 24 hours)
const BAN_DURATION = 24 * 60 * 60 * 1000;

// Map to store banned IPs and their unban timestamp
const bannedIPs = new Map<string, number>();

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

export const banMiddleware = async (c: Context, next: Next) => {
  const info = getConnInfo(c);
  const ip = info.remote.address || 'unknown';

  // 1. Check if IP is already banned
  const unbanTime = bannedIPs.get(ip);
  if (unbanTime) {
    if (Date.now() < unbanTime) {
      // Still banned
      return c.text('Forbidden', 403);
    }
    // Ban expired
    bannedIPs.delete(ip);
  }

  // 2. Check for suspicious paths (Honeypot)
  const path = c.req.path.toLowerCase();

  // Check exact match or starts with for directories like /.git/
  const isSuspicious = HONEYPOT_PATHS.some(
    (badPath) => path === badPath || path.startsWith(`${badPath}/`) || path.endsWith(badPath)
  );

  if (isSuspicious) {
    logwarn(`[SECURITY] Banning IP ${ip} for accessing suspicious path: ${path}`);

    // Ban the IP
    bannedIPs.set(ip, Date.now() + BAN_DURATION);

    return c.text('Forbidden', 403);
  }

  // 3. Cleanup logic (Optional: Run periodically to prevent map from growing too large)
  // For simplicity, we can do a lazy cleanup occasionally, or just let it be for now.
  // In a robust production env, use Redis for this.

  await next();
};
