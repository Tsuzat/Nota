import Database from '@tauri-apps/plugin-sql';

import { message } from '@tauri-apps/plugin-dialog';
import { error, info } from '@tauri-apps/plugin-log';

export let DB: Database;

const query = `
CREATE TABLE IF NOT EXISTS notes (
	id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL,
	path TEXT NOT NULL UNIQUE,
  created_at DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
	id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL,
	path TEXT NOT NULL UNIQUE,
	notes UUID NOT NULL,
	favorite BOOLEAN NOT NULL DEFAULT FALSE,
  trashed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATE NOT NULL,
  updated_at DATE NOT NULL,
	FOREIGN KEY(notes) REFERENCES notes(id) ON DELETE CASCADE
);
`;

export async function initializeDatabase() {
	try {
		DB = await Database.load('sqlite:nota.db');
		info('Sqlite database loaded successfully');
		console.log('Sqlite database loaded successfully');
		await createTables();
	} catch (e) {
		message(`Error on loading the sqlite database from disk`, {
			title: 'Database loading error',
			kind: 'error'
		});
		//@ts-ignore
		error(e.message);
		console.error(e);
	}
}

async function createTables() {
	DB.execute(query)
		.then(() => {
			info('Tables created successfully');
		})
		.catch((e: Error) => {
			message(`Error on creating tables for the database`, {
				title: 'Database error',
				kind: 'error'
			});
			error(e.message);
			console.error(e);
		});
}
