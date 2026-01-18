import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { DB } from "../../db";
import { session, user } from "../../db/schema";
import { verifyAccessToken } from "../../lib/jwt";
import { logerror, logwarn } from "../../logging";
import { auth } from "../../auth";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const sessionData = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!sessionData) {
      logwarn("Session not found or revoked");
      return c.json({ error: "Session not found or revoked" }, 401);
    }
    const { session, user } = sessionData;

    c.set("userId", session.userId);
    c.set("sessionId", session.id);
    c.set("userEmail", user.email);
    c.set("user", user);
    await next();
  } catch (e) {
    logerror("Error verifying token:", e);
    return c.json({ error: "Invalid or expired token" }, 403);
  }
};
