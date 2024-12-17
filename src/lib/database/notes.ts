import type { Content } from '@tiptap/core';
import type { WorkSpaceDB } from './workspace';
import { resolve } from '@tauri-apps/api/path';
import { load } from '@tauri-apps/plugin-store';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'svelte-sonner';
import { error, info } from '@tauri-apps/plugin-log';
import { DB } from './sqldb';
import { remove } from '@tauri-apps/plugin-fs';
import type { QueryResult } from '@tauri-apps/plugin-sql';

/**
 * Notes interface has the data of a note with
 * id, title, icon, description, createdAt, updatedAt and content
 * @interface Notes
 */
export interface Notes {
	id: string;
	name: string;
	icon: string;
	cover: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	content: Content;
}

/**
 * NotesDB interface has the information about the location of note with it's metadata
 * id, title, icon, description, createdAt, updatedAt and content
 * @interface NotesDB
 */
export interface NotesDB {
	id: string;
	name: string;
	icon: string;
	path: string;
	workspace: string;
	favorite: boolean;
	trashed: boolean;
}

/**
 * Create new notes and adds to it to the database and disk
 */
export async function createNote(
	icon: string,
	name: string,
	workspace: WorkSpaceDB
): Promise<NotesDB | null> {
	try {
		//! TODO: Need to check if the noteid already exists
		const notesId = uuidv4();
		const notesPath = await resolve(workspace.path, `${notesId}.nota`);
		const store = await load(notesPath, { autoSave: true });
		const notes: Notes = {
			id: notesId,
			name,
			icon,
			cover: '',
			description: '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			content: null
		};
		store.set('id', notes.id);
		store.set('name', notes.name);
		store.set('icon', notes.icon);
		store.set('cover', notes.cover);
		store.set('description', notes.description);
		store.set('createdAt', notes.createdAt);
		store.set('updatedAt', notes.updatedAt);
		store.set('content', notes.content);

		const notesDB: NotesDB = {
			id: notes.id,
			name: notes.name,
			icon: notes.icon,
			path: notesPath,
			workspace: workspace.id,
			favorite: false,
			trashed: false
		};

		let notesInserted = await insertIntoNotes(notesDB);
		if (notesInserted) {
			return notesDB;
		} else {
			await remove(notesPath);
			return null;
		}
	} catch (err) {
		//@ts-ignore
		error(err.toString());
		console.error(err);
		toast.error('Error on creating the note');
		return null;
	}
}

async function insertIntoNotes(notes: NotesDB) {
	let insertedSuccessfully = false;
	try {
		const res = await DB.execute(
			`INSERT INTO notes (id, name, icon, path, workspace, favorite, trashed) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			[notes.id, notes.name, notes.icon, notes.path, notes.workspace, notes.favorite, notes.trashed]
		);
		insertedSuccessfully = res.rowsAffected === 1;
		console.log('Note inserted successfully');
		info('Note inserted successfully');
	} catch (err) {
		console.error(err);
		toast.error('Error on inserting the note');
		//@ts-ignore
		error(err.toString());
	}
	return insertedSuccessfully;
}

/**
 * Function to delete a notes from the database and disk
 * @param notes NotesDB - Note to be deleted
 * @param workspaceDB WorkSpaceDB - Workspace of the note to be deleted
 * @returns Promise<boolean> - true if the note is deleted successfully
 */
export async function deleteNotes(notes: NotesDB): Promise<boolean> {
	const deleted = deleteNotesFromDB(notes.id);
	if (!deleted) {
		return false;
	}
	// notes path
	const notesPath = await resolve(notes.path);
	try {
		await remove(notesPath);
		return true;
	} catch (err) {
		//@ts-ignore
		error(err.toString());
		console.error(err);
		return false;
	}
}

async function deleteNotesFromDB(notesId: string) {
	let deletedSuccessfully = false;
	try {
		const res = await DB.execute('DELETE FROM notes WHERE id = $1', [notesId]);
		deletedSuccessfully = res.rowsAffected === 1;
		console.log('Note deleted successfully');
		info('Note deleted successfully');
	} catch (err) {
		console.error(err);
		//@ts-ignore
		error(err.toString());
	}
	return deletedSuccessfully;
}

/**
 * Function to get the notes from the database by workspace id
 * @param workspaceId
 * @param limit 5
 * @returns Promise<NotesDB[]>
 */
export async function getNotesByWorkspace(workspaceId: string): Promise<NotesDB[]> {
	let res: NotesDB[] = [];
	try {
		res = await DB.select<NotesDB[]>('SELECT * FROM notes WHERE workspace = $1', [workspaceId]);
	} catch (e) {
		//@ts-ignore
		error(e.toString());
		toast.error('Something went wrong when getting the notes');
		console.error(e);
	}
	return res;
}

/**
 * Find the notes from the database by id
 * @param id - Note id
 * @returns NotesDB or null
 */
export async function getNotesById(id: string): Promise<NotesDB | null> {
	let res: NotesDB[] = [];
	try {
		res = await DB.select<NotesDB[]>('SELECT * FROM notes WHERE id = $1', [id]);
		// Convert string to boolean
		res = res.map((note) => ({
			...note,
			//@ts-ignore
			favorite: note.favorite === 'true' || note.favorite === '1',
			//@ts-ignore
			trashed: note.trashed === 'true' || note.trashed === '1'
		}));
	} catch (e) {
		//@ts-ignore
		error(e.toString());
		toast.error('Something went wrong when getting the notes');
		console.error(e);
	}
	return res.length > 0 ? res[0] : null;
}

/**
 * Function to update the note in the database
 * @param notesDB - NoteDB object to be updated
 * @returns boolean - true if the note is updated successfully
 */
export async function updateNotesDB(notesDB: NotesDB) {
	let res: QueryResult | undefined = undefined;
	try {
		res = await DB.execute(
			`UPDATE notes SET name = $1, icon = $2, path = $3, workspace = $4, favorite = $5, trashed = $6 WHERE id = $7`,
			[
				notesDB.name,
				notesDB.icon,
				notesDB.path,
				notesDB.workspace,
				notesDB.favorite,
				notesDB.trashed,
				notesDB.id
			]
		);
	} catch (e) {
		//@ts-ignore
		error(e.toString());
		toast.error('Something went wrong when updating the note');
		console.error(e);
	}
	return !res ? false : res.rowsAffected === 1;
}

/**
 * Function to fetch all the favorite notes from the database
 * @returns Promise<NotesDB[]>
 */
export async function getFavoriteNotes(): Promise<NotesDB[]> {
	let res: NotesDB[] = [];
	try {
		res = await DB.select<NotesDB[]>(`SELECT * FROM notes WHERE favorite = 'true'`);
		// Convert string to boolean
		res = res.map((note) => ({
			...note,
			//@ts-ignore
			favorite: note.favorite === 'true' || note.favorite === '1',
			//@ts-ignore
			trashed: note.trashed === 'true' || note.trashed === '1'
		}));
	} catch (e) {
		//@ts-ignore
		error(e.toString());
		toast.error('Something went wrong when getting the notes');
		console.error(e);
	}
	return res;
}
