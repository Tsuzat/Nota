import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { DB } from "../../db";
import { account, user } from "../../db/schema";
import type { Variables } from "..";
import { authMiddleware } from "../middlewares/auth";
import { logerror } from "../../logging";

const app = new Hono<{ Variables: Variables }>();

app.use("*", authMiddleware);

app.get("/me", async (c) => {
  const user = c.get("user");
  return c.json({ user });
});

app.get("account", async (c) => {
  const user = c.get("user");
  try {
    const accounts = await DB.query.account.findMany({
      where: eq(account.userId, user.id),
    });
    return c.json({ accounts });
  } catch (error) {
    logerror(error, "Failed to fetch accounts");
    return c.json({ error: "Failed to fetch accounts" }, 500);
  }
});

export default app;
