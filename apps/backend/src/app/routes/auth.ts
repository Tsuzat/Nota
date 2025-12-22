import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { DB } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import {
  COOKIE_OPTIONS,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  FRONTEND_URL,
} from "../../constants";
import { githubAuth } from "@hono/oauth-providers/github";

type GitHubUser = {
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string;
};

const auth = new Hono<{
  Variables: {
    "github-user": GitHubUser;
  };
}>();

auth.use(
  "/oauth/github",
  githubAuth({
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    scope: ["user:email"],
    oauthApp: true,
  })
);

auth.get("/oauth/github", async (c) => {
  const githubUser = c.get("user-github");
  if (!githubUser) {
    return c.json({ error: "GitHub authentication failed" }, 401);
  }

  const { id: providerId, email, name, avatar_url: avatarUrl } = githubUser;

  if (!email) {
    return c.json({ error: "GitHub account must have an email" }, 400);
  }

  // Upsert user in DB
  let user = await DB.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    const [newUser] = await DB.insert(users)
      .values({
        email,
        name: name || email.split("@")[0],
        avatarUrl,
        provider: "github",
        providerId: String(providerId),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    user = newUser;
  } else {
    // Update provider info if it's the first time linking GitHub or just keep it fresh
    await DB.update(users)
      .set({
        name: user.name || name,
        avatarUrl: user.avatarUrl || avatarUrl,
        provider: "github",
        providerId: String(providerId),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    user = await DB.query.users.findFirst({
      where: eq(users.id, user.id),
    });
  }

  const accessToken = await generateAccessToken(user!.id, user!.email);
  const refreshToken = await generateRefreshToken(user!.id, user!.email);

  setCookie(c, "access_token", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 6 * 60 * 60,
  });
  setCookie(c, "refresh_token", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60,
  });

  return c.redirect(FRONTEND_URL || "https://www.nota.ink");
});

auth.post("/refresh", async (c) => {
  const refreshToken = getCookie(c, "refresh_token");

  if (!refreshToken) {
    return c.json({ error: "No refresh token" }, 401);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    const user = await DB.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    const newAccessToken = await generateAccessToken(user.id, user.email);
    const newRefreshToken = await generateRefreshToken(user.id, user.email);

    setCookie(c, "access_token", newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 6 * 60 * 60,
    });
    setCookie(c, "refresh_token", newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60,
    });

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
});

auth.post("/logout", (c) => {
  deleteCookie(c, "access_token");
  deleteCookie(c, "refresh_token");
  return c.json({ success: true });
});

export default auth;
