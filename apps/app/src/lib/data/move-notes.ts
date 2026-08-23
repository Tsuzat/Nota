import type { NoteMeta } from "./types";

/**
 * A minimal reference to a note used by the move algorithm.
 */
export interface NoteRef {
	id: string;
	workspaceId: string;
	parentNoteId: string | null;
}

export interface MoveUpdate {
	id: string;
	workspaceId?: string;
	parentNoteId?: string | null;
}

export interface MovePlan {
	/** Per-note updates to persist, in safe order (root first). */
	updates: MoveUpdate[];
	/** Ids that change workspace (or ride along in the moved subtree). */
	movedIds: string[];
	/** Direct children left behind, re-parented to the old parent. */
	promotedIds: string[];
}

export interface ResolveMoveInput {
	/** ALL metas of the source workspace (trashed included). */
	notes: NoteMeta[];
	noteId: string;
	targetWorkspaceId: string;
	targetParentId: string | null;
	moveChildren: boolean;
}

const toRef = (note: NoteMeta): NoteRef => ({
	id: note.id,
	workspaceId: note.workspaceId,
	parentNoteId: note.parentNoteId,
});

/** Map of parentNoteId -> direct children. */
export function buildChildrenMap(notes: NoteMeta[]): Map<string, NoteRef[]> {
	const map = new Map<string, NoteRef[]>();
	for (const note of notes) {
		const key = note.parentNoteId ?? "";
		const list = map.get(key);
		if (list) list.push(toRef(note));
		else map.set(key, [toRef(note)]);
	}
	return map;
}

/** All strict descendants of a note (BFS), excluding the note itself. */
export function getDescendants(noteId: string, notes: NoteMeta[]): NoteRef[] {
	const childrenMap = buildChildrenMap(notes);
	const out: NoteRef[] = [];
	let frontier = [noteId];
	while (frontier.length > 0) {
		const next: NoteRef[] = [];
		for (const id of frontier) {
			for (const child of childrenMap.get(id) ?? []) {
				out.push(child);
				next.push(child);
			}
		}
		frontier = next.map((n) => n.id);
	}
	return out;
}

/** Chain from a top-level ancestor down to the note itself (inclusive). */
export function buildAncestorChain(
	noteId: string,
	notes: NoteMeta[],
): NoteRef[] {
	const byId = new Map(notes.map((n) => [n.id, toRef(n)]));
	const chain: NoteRef[] = [];
	let cursor: NoteRef | undefined = byId.get(noteId);
	const seen = new Set<string>();
	while (cursor && !seen.has(cursor.id)) {
		seen.add(cursor.id);
		chain.unshift(cursor);
		cursor = cursor.parentNoteId ? byId.get(cursor.parentNoteId) : undefined;
	}
	return chain;
}

/**
 * Resolve how a note move must be persisted.
 *
 * Rules:
 * - Moving a note into itself or one of its descendants is rejected.
 * - Cross-workspace + moveChildren  -> whole subtree follows, hierarchy kept.
 * - Children left behind            -> direct children are promoted to the
 *   moved note's previous parent (top level if it had none); deeper
 *   descendants keep their structure.
 */
export function resolveMove(input: ResolveMoveInput): MovePlan {
	const { notes, noteId, targetWorkspaceId, targetParentId, moveChildren } =
		input;

	const source = notes.find((n) => n.id === noteId);
	if (!source) throw new Error("Source note not found");

	const subtree = getDescendants(noteId, notes);
	const subtreeIds = new Set(subtree.map((n) => n.id));
	subtreeIds.add(noteId);

	if (targetParentId && subtreeIds.has(targetParentId)) {
		throw new Error("Cannot move a note into itself or its sub-notes");
	}

	const updates: MoveUpdate[] = [];
	const promotedIds: string[] = [];

	const willLeaveChildren = !moveChildren && subtree.length > 0;
	if (willLeaveChildren) {
		const childrenMap = buildChildrenMap(notes);
		for (const child of childrenMap.get(noteId) ?? []) {
			promotedIds.push(child.id);
			updates.push({
				id: child.id,
				parentNoteId: source.parentNoteId,
			});
		}
	}

	updates.push({
		id: noteId,
		...(targetWorkspaceId !== source.workspaceId
			? { workspaceId: targetWorkspaceId }
			: {}),
		parentNoteId: targetParentId,
	});

	if (moveChildren && targetWorkspaceId !== source.workspaceId) {
		for (const node of subtree) {
			updates.push({ id: node.id, workspaceId: targetWorkspaceId });
		}
	}

	return {
		updates,
		movedIds: moveChildren ? [...subtreeIds] : [noteId],
		promotedIds,
	};
}
