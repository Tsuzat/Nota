import { toast } from '@nota/ui/shadcn/sonner';
import { BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs';
import Database from '@tauri-apps/plugin-sql';
import schema from './schema';

export let DB: Database;

export async function initializeLocalDB() {
  if (DB) return;
  try {
    DB = await Database.load('sqlite:nota.db');

    // Check if migration is needed (if notes table has old workspace column)
    //!!!! REMOVE THIS IN UPCOMING VERSIONS
    const oldNotesCheck = await DB.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('notes') WHERE name='workspace'"
    );
    if (oldNotesCheck.length > 0) {
      console.log('Running database migration from old schema...');
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

        INSERT OR IGNORE INTO new_workspaces (id, name, icon, created_at, updated_at, content)
        SELECT id, name, icon, created_at, updated_at, content FROM workspaces;

        INSERT OR IGNORE INTO new_notes (id, workspace_id, parent_note_id, name, icon, content, pinned, deleted_at, created_at, updated_at)
        SELECT id, workspace, NULL, name, icon, content, favorite, CASE WHEN trashed THEN STRFTIME('%s', 'now') ELSE NULL END, created_at, updated_at FROM notes;

        DROP TABLE IF EXISTS notes;
        DROP TABLE IF EXISTS workspaces;
        DROP TABLE IF EXISTS userworkspaces;

        ALTER TABLE new_workspaces RENAME TO workspaces;
        ALTER TABLE new_notes RENAME TO notes;

        PRAGMA foreign_keys = ON;
      `;
      await DB.execute(migrationScript);
      console.log('Migration completed successfully.');
    } else {
      await DB.execute('PRAGMA foreign_keys = OFF; DROP TABLE IF EXISTS userworkspaces; PRAGMA foreign_keys = ON;');
    }

    const noteVersionsFkCheck = await DB.select<any[]>("PRAGMA foreign_key_list('note_versions')");
    if (noteVersionsFkCheck.length > 0) {
      console.log('Migrating note_versions to remove foreign keys...');
      const migrationScript = `
        PRAGMA foreign_keys = OFF;
        
        CREATE TABLE IF NOT EXISTS new_note_versions (
            id UUID PRIMARY KEY NOT NULL,
            note_id UUID NOT NULL,
            workspace_id UUID NOT NULL,
            content_compressed BLOB NOT NULL,
            content_hash TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            version_type TEXT NOT NULL DEFAULT 'auto',
            label TEXT,
            source TEXT NOT NULL DEFAULT 'local',
            created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now'))
        );

        INSERT OR IGNORE INTO new_note_versions (id, note_id, workspace_id, content_compressed, content_hash, size_bytes, version_type, label, source, created_at)
        SELECT id, note_id, workspace_id, content_compressed, content_hash, size_bytes, version_type, label, source, created_at FROM note_versions;

        DROP TABLE IF EXISTS note_versions;
        ALTER TABLE new_note_versions RENAME TO note_versions;

        CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions (note_id);
        CREATE INDEX IF NOT EXISTS idx_note_versions_workspace_id ON note_versions (workspace_id);

        PRAGMA foreign_keys = ON;
      `;
      await DB.execute(migrationScript);
      console.log('note_versions migration completed.');
    }

    await DB.execute(schema);
    await checkAndCreateAssetsDir();
    console.log('Sqlite database loaded successfully');
  } catch (e) {
    console.error(e);
    toast.error('Failed to load database');
  }
}

export async function checkAndCreateAssetsDir() {
  const existsAssets = await exists('assets', {
    baseDir: BaseDirectory.AppData,
  });
  if (!existsAssets) {
    await mkdir('assets', { baseDir: BaseDirectory.AppData });
  }
}
