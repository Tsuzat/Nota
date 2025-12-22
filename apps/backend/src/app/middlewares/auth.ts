import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyAccessToken } from "../../lib/jwt";

export const authMiddleware = async (c: Context, next: Next) => {
  const token = getCookie(c, "access_token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyAccessToken(token);
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    await next();
  } catch (e) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
