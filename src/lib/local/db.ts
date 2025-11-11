import Database from '@tauri-apps/plugin-sql';
import { toast } from 'svelte-sonner';
import type { LocalUserWorkspace } from './userworkspaces.svelte';
import { BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs';
import query from './schema';

export let DB: Database;

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
