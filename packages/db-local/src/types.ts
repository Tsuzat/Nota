import type { assets, notes, notesSnapshot, workspace } from "./schema/index";

export type LocalNote = typeof notes.$inferSelect;
export type InsertLocalNote = typeof notes.$inferInsert;
export type UpdateLocalNote = Partial<typeof notes.$inferSelect>;
export type LocalNoteMeta = Omit<LocalNote, "content" | "contentText">;
export type LocalWorkspace = typeof workspace.$inferSelect;
export type CreateLocalWorkspace = Omit<
	typeof workspace.$inferInsert,
	"createdAt" | "updatedAt" | "id" | "userId" | "workspaceOwnerId" | "memberIds"
>;
export type UpdateLocalWorkspace = Partial<typeof workspace.$inferSelect>;
export type LocalNoteSnapshot = typeof notesSnapshot.$inferSelect;
export type InsertLocalNoteSnapshot = typeof notesSnapshot.$inferInsert;
export type UpdateLocalNoteSnapshot = Partial<
	typeof notesSnapshot.$inferSelect
>;
export type LocalAsset = typeof assets.$inferSelect;
export type InsertLocalAsset = typeof assets.$inferInsert;
export type UpdateLocalAsset = Partial<typeof assets.$inferSelect>;
