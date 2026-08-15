import { env } from "@nota/env/server";
import { drizzle } from "drizzle-orm/bun-sql";
import { relations } from "./schema/relations";

import { SQL } from "bun";

export function createDb() {
  const client = new SQL(env.DATABASE_URL);
  return drizzle({ client, relations });
}

export const db = createDb();

export * from "./types";
