import { sign, verify } from 'hono/jwt';
import { ACCESS_TOKEN_EXPIRY, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET } from '../constants';

export interface JWTPayload {
  sub: string; // userId
  email: string;
  exp: number;
  sessionId: string;
  [key: string]: unknown;
}

export const generateAccessToken = async (userId: string, email: string, sessionId: string) => {
  const payload: JWTPayload = {
    sub: userId,
    email,
    sessionId,
    exp: Math.floor(Date.now() / 1000) + parseExpiry(ACCESS_TOKEN_EXPIRY),
  };
  return await sign(payload, ACCESS_TOKEN_SECRET);
};

export const generateRefreshToken = async (userId: string, email: string, sessionId: string) => {
  const payload: JWTPayload = {
    sub: userId,
    email,
    sessionId,
    exp: Math.floor(Date.now() / 1000) + parseExpiry(REFRESH_TOKEN_EXPIRY),
  };
  return await sign(payload, REFRESH_TOKEN_SECRET);
};

export const verifyAccessToken = async (token: string) => {
  return (await verify(token, ACCESS_TOKEN_SECRET)) as unknown as JWTPayload;
};

export const verifyRefreshToken = async (token: string) => {
  return (await verify(token, REFRESH_TOKEN_SECRET)) as unknown as JWTPayload;
};

// Simple parser for expiry strings like "6h", "7d"
function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = Number.parseInt(expiry.slice(0, -1), 10);
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 3600; // default 1h
  }
}
