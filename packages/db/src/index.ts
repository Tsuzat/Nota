import { env } from "@nota/env/server";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { relations } from "./schema/relations";

export function createDb() {
	const client = new SQL(env.DATABASE_URL);
	return drizzle({ client, relations });
}

export const db = createDb();

export * from "./types";
