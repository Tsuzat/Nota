import { writable } from 'svelte/store';
import type { WorkSpaceDB } from './database/workspace';

/** Global Variables For showing new work space dialog */
export const OPEN_NEW_WORKSPACE_DIALOG = writable(false);

/** Global Variables For keep tack of workspaces */
export const WORKSPACES = writable<WorkSpaceDB[]>([]);
