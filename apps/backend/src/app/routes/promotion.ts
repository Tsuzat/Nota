import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { DB } from "../../db";
import { user as userSchema } from "../../db/schema";
import type { Variables } from "..";
import { authMiddleware } from "../middlewares/auth";

const app = new Hono<{ Variables: Variables }>();

app.get("/redeem-ai-credits", authMiddleware, async (c) => {
  const user = c.get("user");
  if (user.aiCredits > 0) {
    return c.json({ error: "User already has AI credits" }, 400);
  }
  await DB.update(userSchema)
    .set({ aiCredits: sql`${userSchema.aiCredits} + ${10000}` })
    .where(eq(userSchema.id, user.id));
  return c.json({ received: true });
});

export default app;
