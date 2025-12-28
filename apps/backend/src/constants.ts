const checkEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ [FATAL] Environment variable ${key} is missing`);
    process.exit(1);
  }
  return value;
};

export const DB_URL = checkEnv('DB_URL');
export const PORT = Number.parseInt(process.env.PORT || '3000', 10);
export const CROSS_ORIGIN = process.env.CROSS_ORIGIN || '*';

export const ACCESS_TOKEN_SECRET = checkEnv('ACCESS_TOKEN_SECRET');
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '6h';
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
export const REFRESH_TOKEN_SECRET = checkEnv('REFRESH_TOKEN_SECRET');

// Backend URL
export const BACKEND_URL = checkEnv('BACKEND_URL');
export const FRONTEND_URL = checkEnv('FRONTEND_URL');

// Github OAuth
export const GITHUB_CLIENT_ID = checkEnv('GITHUB_CLIENT_ID');
export const GITHUB_CLIENT_SECRET = checkEnv('GITHUB_CLIENT_SECRET');

// Google OAuth
export const GOOGLE_CLIENT_ID = checkEnv('GOOGLE_CLIENT_ID');
export const GOOGLE_CLIENT_SECRET = checkEnv('GOOGLE_CLIENT_SECRET');

// Verification Token Expiry
export const VERIFICATION_TOKEN_EXPIRY = Number.parseInt(process.env.VERIFICATION_TOKEN_EXPIRY || '30', 10);

// Cookie Options
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax' as const,
};

// Cloudflare R2
export const R2_ACCOUNT_ID = checkEnv('R2_ACCOUNT_ID');
export const R2_ACCESS_ID = checkEnv('R2_ACCESS_ID');
export const R2_SECRETE_ACCESS_KEY = checkEnv('R2_SECRETE_ACCESS_KEY');
export const R2_PUBLIC_ENDPOINT = checkEnv('R2_PUBLIC_ENDPOINT');
export const BUCKET_NAME = checkEnv('BUCKET_NAME');

// Gemini API
export const GEMINI_API_KEY = checkEnv('GEMINI_API_KEY');

// DODO Related
export const DODO_MODE = checkEnv('DODO_MODE') as 'live_mode' | 'test_mode';
export const DODO_PAYMENTS_LOG = checkEnv('DODO_PAYMENTS_LOG');
export const DODO_API_KEY = checkEnv('DODO_API_KEY');
export const DODO_WEBHOOK_SECRET = checkEnv('DODO_WEBHOOK_SECRET');
export const DODO_AI_CREDITS = checkEnv('DODO_AI_CREDITS');
export const DODO_MONTLY_SUB = checkEnv('DODO_MONTLY_SUB');
export const DODO_YEARLY_SUB = checkEnv('DODO_YEARLY_SUB');
