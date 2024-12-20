import { mkdir } from '@tauri-apps/plugin-fs';
import { resolve } from '@tauri-apps/api/path';
import { toast } from 'svelte-sonner';
import { error, info } from '@tauri-apps/plugin-log';
import { load } from '@tauri-apps/plugin-store';
import { v4 as uuidv4 } from 'uuid';
import { DB } from './sqldb';
import type { Content } from '@tiptap/core';
import { WORKSPACES } from '$lib/contants';

/**
 * WorkSpaceDB interface has the information about the location of workspace with it's metadata
 * id, name, icon, path
 * @interface WorkSpaceDB
 */
export interface WorkSpaceDB {
	id: string;
	name: string;
	icon: string;
	path: string;
}

/**
 * WorkSpace interface has the information about the location of workspace with it's metadata
 * id, name, icon, cover, createdAt, updatedAt
 */
export interface WorkSpace {
	id: string;
	name: string;
	icon: string;
	cover: string;
	createdAt: string;
	updatedAt: string;
	content: Content;
}

export async function createWorkspace(path: string, name: string, icon: string) {
	// create the workspace folder
	const workspaceLocation = await resolve(path, name);
	mkdir(workspaceLocation)
		.then(async () => {
			// create assets folder
			const assetsLocation = await resolve(workspaceLocation, 'assets');
			await mkdir(assetsLocation);
			// .workspace.nota file path
			const workspacePath = await resolve(workspaceLocation, '.workspace.nota');
			const store = await load(workspacePath, { autoSave: true });
			const workspace: WorkSpace = {
				id: uuidv4(),
				name,
				icon,
				cover: '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				content: null
			};
			store.set('id', workspace.id);
			store.set('name', workspace.name);
			store.set('icon', workspace.icon);
			store.set('cover', workspace.cover);
			store.set('createdAt', workspace.createdAt);
			store.set('updatedAt', workspace.updatedAt);
			store.set('content', workspace.content);
			insertIntoWorkSpaces({
				id: workspace.id,
				name: workspace.name,
				icon: workspace.icon,
				path: workspaceLocation
			});
			toast.success('Workspace created successfully', {
				description: `Workspace created at ${workspaceLocation}`,
				action: {
					label: 'Ok',
					onClick: () => {}
				}
			});
		})
		.catch((e) => {
			toast.error('Error on creating the workspace');
			error(e.toString());
			console.error(e);
		});
}

/**
 * Insert a workspace into the database
 * @param workspace
 */
export async function insertIntoWorkSpaces(workspace: WorkSpaceDB) {
	DB.execute(`INSERT INTO workspaces (id, name, icon, path) VALUES ($1, $2, $3, $4)`, [
		workspace.id,
		workspace.name,
		workspace.icon,
		workspace.path
	])
		.then(() => {
			WORKSPACES.update((workspaces) => {
				return [...workspaces, workspace];
			});
			console.log('Workspace inserted successfully', workspace);
			info(`Workspace inserted successfully, ${workspace}`);
		})
		.catch((e: Error) => {
			toast.error('Error on inserting the workspace');
			error(e.message);
		});
}

/**
 * Function to get the workspaces from the database
 * @returns Promise<WorkSpaceDB[]>
 */
export async function getWorkSpaces(): Promise<WorkSpaceDB[]> {
	let res: WorkSpaceDB[] = [];
	try {
		res = await DB.select<WorkSpaceDB[]>('SELECT * FROM workspaces');
	} catch (e) {
		//@ts-ignore
		error(e.toString());
		toast.error('Something went wrong when getting the workspaces');
		console.error(e);
	}
	return res;
}
