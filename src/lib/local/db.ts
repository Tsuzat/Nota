import Database from '@tauri-apps/plugin-sql';
import { toast } from 'svelte-sonner';

export let DB: Database;

const query = `
CREATE TABLE IF NOT EXISTS userworkspaces (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL,
	path TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	userworkspace TEXT NOT NULL,
	FOREIGN KEY(userworkspace) REFERENCES userworkspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL,
	path TEXT NOT NULL UNIQUE,
	workspace TEXT NOT NULL,
	userworkspace TEXT NOT NULL,
	favorite BOOLEAN NOT NULL DEFAULT FALSE,
  	trashed BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY(workspace) REFERENCES workspaces(id) ON DELETE CASCADE
);
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
}
