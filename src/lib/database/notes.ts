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
import { confirm } from '@tauri-apps/plugin-dialog';
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { NOTES } from '$lib/contants';
import { updateNOTES } from '$lib/utils';

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
		const store = await load(notesPath, { autoSave: false });
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
		await store.set('id', notes.id);
		await store.set('name', notes.name);
		await store.set('icon', notes.icon);
		await store.set('cover', notes.cover);
		await store.set('description', notes.description);
		await store.set('createdAt', notes.createdAt);
		await store.set('updatedAt', notes.updatedAt);
		await store.set('content', notes.content);
		await store.save();
		await store.close();

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
 * Function to delete a notes from the database and disk permanently with confirmation and redirect
 * @param notes NotesDB - Note to be deleted
 * @returns Promise<void> - void
 */
export async function permanentlyDeleteNotes(note: NotesDB) {
	const shouldDelete = await confirm(`Are you sure you want to delete this note "${note.name}"?`, {
		kind: 'warning',
		title: 'Delete Notes?',
		okLabel: 'Delete'
	});
	if (!shouldDelete) return;
	if (page.url.pathname === `/${note.id}`) goto('/');
	const isDeleted = await deleteNotes(note);
	if (isDeleted) {
		// remove notes from NOTES
		NOTES.update((notes) => {
			return notes.filter((lNote) => lNote.id !== note.id);
		});
		toast.success('Note deleted', {
			description: `Note with title ${note.name} deleted`
		});
	} else {
		toast.error('Error on deleting the note');
	}
}

/**
 * Function to delete a notes from the database and disk
 * @param notes NotesDB - Note to be deleted
 * @returns Promise<boolean> - true if the note is deleted successfully
 */
async function deleteNotes(notes: NotesDB): Promise<boolean> {
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

export async function deleteNotesByWorkSpace(workspaceId: string) {
	try {
		const res = await DB.execute('DELETE FROM notes WHERE workspace = $1', [workspaceId]);
		console.log('Note deleted successfully');
		info('Note deleted successfully');
	} catch (err) {
		console.error(err);
		//@ts-ignore
		error(err.toString());
	}
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
 * Function to get all the notes from the database
 * @returns NotesDB[] - Array of notes
 */
export async function getAllNotes(): Promise<NotesDB[]> {
	let res: NotesDB[] = [];
	try {
		res = await DB.select<NotesDB[]>('SELECT * FROM notes');
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

/**
 * Function to duplicate a note and add it to the database and disk with toast notification
 * @param note NoteDB - Note to be duplicated
 * @param workspace WorkSpaceDB - Workspace where the note is to be duplicated
 * @returns Promise<void> - void
 */
export async function duplicateNote(note: NotesDB, workspace: WorkSpaceDB) {
	const id = toast.loading('Duplicating the note...');
	const newNote = await createNote(note.icon, `${note.name}(Copy)`, workspace);
	if (newNote === null) {
		toast.error('Error on duplicating the note', { id });
		return;
	}
	toast.success('Note added to Database', { id });
	toast.info('Adding notes to the disk...', { id });
	// get the note location
	const noteStore = await load(note.path, { autoSave: false });
	const newNoteStore = await load(newNote.path, { autoSave: false });
	const content = await noteStore.get<Content>('content');
	await newNoteStore.set('content', content);
	await newNoteStore.save();
	await newNoteStore.close();
	await noteStore.close();
	NOTES.update((notes) => {
		return [...notes, newNote];
	});
	toast.success('Note duplicated', {
		id,
		description: `Note with title ${note.name} duplicated`,
		action: {
			label: 'Open',
			onClick: () => goto(`/${newNote.id}`)
		}
	});
}

/**
 * Function to move a note to trash and redirect to home page
 * @param note NotesDB - Note to be moved to trash
 * @returns Promise<void> - void
 */
export async function moveToTrash(note: NotesDB) {
	const shouldDelete = await confirm(
		`Are you sure you want to move notes "${note.name}" to trash?`,
		{
			kind: 'info',
			title: `Move to trash?`,
			okLabel: 'Move to Trash'
		}
	);
	if (!shouldDelete) return;
	note.trashed = true;
	let isUpdated = await updateNotesDB(note);
	if (isUpdated) {
		updateNOTES(note);
		goto('/');
		toast.success('Note moved to trash', {
			description: `Notes "${note.name}" moved to trash`,
			action: {
				label: 'Undo',
				onClick: async () => {
					note.trashed = false;
					await updateNotesDB(note);
					updateNOTES(note);
				}
			}
		});
	} else {
		toast.error('Error on moving the note to trash');
	}
}
