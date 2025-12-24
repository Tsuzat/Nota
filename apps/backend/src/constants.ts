const checkEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ [FATAL] Environment variable ${key} is missing`);
    process.exit(1);
  }
  return value;
};

export const DB_URL = checkEnv('DB_URL');
export const PORT = parseInt(process.env.PORT || '3000', 10);
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
export const VERIFICATION_TOKEN_EXPIRY = parseInt(process.env.VERIFICATION_TOKEN_EXPIRY || '30');

// REDIS
export const REDIS_URL = checkEnv('REDIS_URL');
// Cookie Options
export const COOKIE_OPTIONS = { httpOnly: true, secure: false };
