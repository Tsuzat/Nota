import Database from '@tauri-apps/plugin-sql';
import { toast } from 'svelte-sonner';

export let DB: Database;

const query = `
CREATE TABLE IF NOT EXISTS workspaces (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL,
	path TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS notes (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL,
	path TEXT NOT NULL UNIQUE,
	workspace TEXT NOT NULL,
	favorite BOOLEAN NOT NULL DEFAULT FALSE,
  	trashed BOOLEAN NOT NULL DEFAULT FALSE,
	FOREIGN KEY(workspace) REFERENCES workspaces(id)
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
