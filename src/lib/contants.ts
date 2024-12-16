import { writable } from 'svelte/store';
import type { WorkSpaceDB } from './database/workspace';
import type { NotesDB } from './database/notes';
import { platform } from '@tauri-apps/plugin-os';

/** Global Variables For showing new work space dialog */
export const OPEN_NEW_WORKSPACE_DIALOG = writable(false);

/** Global Variables For keep tack of workspaces and it's notes */
export const WORKSPACES = writable<Map<WorkSpaceDB, NotesDB[]>>(new Map());

/** Global variable for keep track of current os */
export const OS = platform();
