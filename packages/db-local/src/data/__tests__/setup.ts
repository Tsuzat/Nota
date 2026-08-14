/**
 * Shared test setup: creates an in-memory SQLite database with Drizzle
 * and provides helpers to seed test data.
 */
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../../schema/index";
import { nanoid } from "nanoid";

// ─── DDL ─────────────────────────────────────────────────────

const DDL = `
  CREATE TABLE "workspace" (
    "id" text PRIMARY KEY NOT NULL,
    "icon" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );

  CREATE TABLE "notes" (
    "id" text PRIMARY KEY NOT NULL,
    "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
    "parent_note_id" text REFERENCES "notes"("id") ON DELETE SET NULL,
    "icon" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "content" text NOT NULL,
    "content_text" text,
    "starred" integer DEFAULT 0 NOT NULL,
    "trashed_at" integer,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );

  CREATE INDEX "notes_workspace_idx" ON "notes"("workspace_id");
  CREATE INDEX "notes_parent_idx" ON "notes"("parent_note_id");
  CREATE INDEX "notes_trashed_idx" ON "notes"("trashed_at");
  CREATE INDEX "notes_starred_idx" ON "notes"("starred");

  CREATE TABLE "notes_snapshot" (
    "id" text PRIMARY KEY NOT NULL,
    "note_id" text NOT NULL REFERENCES "notes"("id") ON DELETE CASCADE,
    "label" text,
    "kind" text NOT NULL,
    "content_compressed" blob NOT NULL,
    "content_hash" text NOT NULL,
    "size" integer NOT NULL,
    "created_at" integer NOT NULL
  );

  CREATE INDEX "snapshot_note_created_idx" ON "notes_snapshot"("note_id", "created_at");
  CREATE INDEX "snapshot_note_hash_idx" ON "notes_snapshot"("note_id", "content_hash");

  CREATE TABLE "assets" (
    "id" text PRIMARY KEY NOT NULL,
    "note_id" text NOT NULL REFERENCES "notes"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "mime_type" text NOT NULL,
    "size" integer NOT NULL,
    "created_at" integer NOT NULL
  );

  CREATE INDEX "assets_note_idx" ON "assets"("note_id");
`;

// ─── Factory ─────────────────────────────────────────────────

/**
 * Creates a fresh in-memory Drizzle DB instance with the full schema applied.
 * Each call returns an isolated database — safe for parallel tests.
 */
export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.run("PRAGMA foreign_keys = ON;");
  sqlite.run(DDL);

  const db = drizzle({ client: sqlite });
  return { db, sqlite };
}

export type TestDb = ReturnType<typeof createTestDb>;

// ─── Seeders ─────────────────────────────────────────────────

/**
 * Seeds a workspace and returns its ID.
 */
export function seedWorkspace(db: TestDb["db"]) {
  const id = nanoid();
  const now = new Date();
  db.insert(schema.workspace)
    .values({
      id,
      icon: "📓",
      name: "Test Workspace",
      description: "A test workspace",
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return id;
}

/**
 * Seeds a note directly via the DB (bypassing the data layer).
 */
export function seedNote(
  db: TestDb["db"],
  workspaceId: string,
  overrides: Partial<typeof schema.notes.$inferInsert> = {}
) {
  const id = overrides.id ?? nanoid();
  const now = new Date();
  const values = {
    id,
    workspaceId,
    icon: "📝",
    name: "Test Note",
    content: { type: "doc", content: [] },
    contentText: "test content text",
    starred: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  db.insert(schema.notes).values(values).run();
  return values;
}
