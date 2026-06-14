import { toast } from "@nota/ui/shadcn/sonner";
import { BaseDirectory, exists, mkdir } from "@tauri-apps/plugin-fs";
import Database from "@tauri-apps/plugin-sql";
import schema from "./schema";

export let DB: Database;

export async function initializeLocalDB() {
  if (DB) return;
  try {
    DB = await Database.load("sqlite:nota.db");

    // Check if migration is needed (if userworkspaces table exists)
    //!!!! REMOVE THIS IN UPCOMING VERSIONS
    const res = await DB.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='userworkspaces'",
    );
    if (res.length > 0) {
      console.log("Running database migration from old schema...");
      const migrationScript = `
        PRAGMA foreign_keys = OFF;
        
        CREATE TABLE IF NOT EXISTS new_workspaces (
            id UUID PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
            updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
            content TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS new_notes (
            id UUID PRIMARY KEY NOT NULL,
            workspace_id UUID NOT NULL,
            parent_note_id UUID,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '{}',
            pinned BOOLEAN NOT NULL DEFAULT FALSE,
            deleted_at INTEGER,
            created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
            updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
            FOREIGN KEY (workspace_id) REFERENCES new_workspaces (id) ON DELETE CASCADE,
            FOREIGN KEY (parent_note_id) REFERENCES new_notes (id) ON DELETE CASCADE
        );

        INSERT INTO new_workspaces (id, name, icon, created_at, updated_at, content)
        SELECT id, name, icon, created_at, updated_at, content FROM workspaces;

        INSERT INTO new_notes (id, workspace_id, parent_note_id, name, icon, content, pinned, deleted_at, created_at, updated_at)
        SELECT id, workspace, NULL, name, icon, content, favorite, CASE WHEN trashed THEN STRFTIME('%s', 'now') ELSE NULL END, created_at, updated_at FROM notes;

        DROP TABLE notes;
        DROP TABLE workspaces;
        DROP TABLE userworkspaces;

        ALTER TABLE new_workspaces RENAME TO workspaces;
        ALTER TABLE new_notes RENAME TO notes;

        PRAGMA foreign_keys = ON;
      `;
      await DB.execute(migrationScript);
      console.log("Migration completed successfully.");
    }

    await DB.execute(schema);
    await checkAndCreateAssetsDir();
    console.log("Sqlite database loaded successfully");
  } catch (e) {
    console.error(e);
    toast.error("Failed to load database");
  }
}

export async function checkAndCreateAssetsDir() {
  const existsAssets = await exists("assets", {
    baseDir: BaseDirectory.AppData,
  });
  if (!existsAssets) {
    await mkdir("assets", { baseDir: BaseDirectory.AppData });
  }
}
