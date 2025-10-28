import Database from '@tauri-apps/plugin-sql';
import { toast } from 'svelte-sonner';
import type { LocalUserWorkspace } from './userworkspaces.svelte';
import { BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs';

export let DB: Database;

const query = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS userworkspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    userworkspace INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY(userworkspace) REFERENCES userworkspaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    workspace INTEGER NOT NULL,
    userworkspace INTEGER NOT NULL,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    trashed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY(workspace) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY(userworkspace) REFERENCES userworkspaces(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_workspaces_userworkspace
  ON workspaces(userworkspace);

  CREATE TRIGGER IF NOT EXISTS trigger_update_workspaces_updated_at
  AFTER UPDATE ON workspaces
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE workspaces SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS trigger_update_notes_updated_at
  AFTER UPDATE ON notes
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE notes SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;
`;

export async function initializeLocalDB() {
	try {
		DB = await Database.load('sqlite:nota.db');
		console.log('Sqlite database loaded successfully');
		await createTables();
	} catch (e) {
		console.error(e);
		toast.error('Failed to load database');
	}
}

async function createTables() {
	await DB.execute(query);
	const userWorkspaces = await DB.select<LocalUserWorkspace[]>('SELECT * FROM userworkspaces');
	if (userWorkspaces.length === 0) {
		await DB.execute('INSERT INTO userworkspaces (name, icon) VALUES ($1, $2)', [
			'Personal',
			'lucide:User'
		]);
	}
}

export async function checkAndCreateAssetsDir() {
	const existsAssets = await exists('assets', { baseDir: BaseDirectory.AppData });
	if (!existsAssets) {
		await mkdir('assets', { baseDir: BaseDirectory.AppData });
	}
}
