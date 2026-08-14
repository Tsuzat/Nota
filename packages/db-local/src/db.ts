
import { drizzle } from "drizzle-orm/sqlite-proxy";
import Database from "@tauri-apps/plugin-sql";

/**
 * Represents the result of a SELECT query.
 */
export type SelectQueryResult = {
  [key: string]: any;
};

/**
 * Loads the sqlite database via the Tauri Proxy.
 */
// export const sqlite = await Database.load("sqlite:test.db");

async function getDb() {
  return await Database.load("sqlite:test.db");
}

/**
 * The drizzle database instance.
 */
export let db = drizzle(
  async (sql, params, method) => {
    const sqlite = await getDb();
    let rows: any = [];
    let results = [];
    // If the query is a SELECT, use the select method
    if (isSelectQuery(sql)) {
      rows = await sqlite.select(sql, params).catch((e) => {
        console.error("SQL Error:", e);
        return [];
      });
    } else {
      // Otherwise, use the execute method
      rows = await sqlite.execute(sql, params).catch((e) => {
        console.error("SQL Error:", e);
        return [];
      });
      return { rows: [] };
    }

    rows = rows.map((row: any) => {
      return Object.values(row);
    });

    // If the method is "all", return all rows
    results = method === "all" ? rows : rows[0];
    await sqlite.close();
    return { rows: results };
  },
  { logger: true },
);

/**
 * Checks if the given SQL query is a SELECT query.
 * @param sql The SQL query to check.
 * @returns True if the query is a SELECT query, false otherwise.
 */
function isSelectQuery(sql: string): boolean {
  const selectOrReturningRegex = /^\s*SELECT\b|\bRETURNING\b/i;
  return selectOrReturningRegex.test(sql);
}

/**
 * Override the database instance for testing purposes.
 */
export function setTestDb(testDb: any) {
  if (process.env.NODE_ENV === "test") {
    db = testDb;
  }
}

