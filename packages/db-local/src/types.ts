import {notes, workspace, notesSnapshot, assets} from './schema/index';

export type LocalNote = typeof notes.$inferSelect;
export type LocalWorkspace = typeof workspace.$inferSelect;
export type LocalNoteSnapshot = typeof notesSnapshot.$inferSelect;
export type LocalAsset = typeof assets.$inferSelect;


