import {
	type AnySQLiteColumn,
	customType,
	index,
	integer,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = "";
	const len = bytes.byteLength;
	const chunkSize = 8192;
	for (let i = 0; i < len; i += chunkSize) {
		binary += String.fromCharCode.apply(
			null,
			bytes.subarray(i, Math.min(i + chunkSize, len)) as unknown as number[],
		);
	}
	return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export const sqliteBlob = customType<{
	data: Uint8Array;
	driverData: string | Uint8Array | number[];
}>({
	dataType() {
		return "blob";
	},
	toDriver(val: Uint8Array): string {
		if (typeof val === "string") return val;
		const bytes =
			val instanceof Uint8Array
				? val
				: new Uint8Array(val as ArrayLike<number>);
		return uint8ArrayToBase64(bytes);
	},
	fromDriver(val: unknown): Uint8Array {
		if (!val) return new Uint8Array(0);
		if (val instanceof Uint8Array) return val;
		if (Array.isArray(val)) return new Uint8Array(val);
		if (val instanceof ArrayBuffer) return new Uint8Array(val);
		if (typeof val === "string") {
			if (val.startsWith("[") || val.startsWith("{")) {
				try {
					const parsed = JSON.parse(val);
					if (Array.isArray(parsed)) return new Uint8Array(parsed);
					if (typeof parsed === "object" && parsed !== null) {
						return new Uint8Array(Object.values(parsed));
					}
				} catch {}
			}
			try {
				return base64ToUint8Array(val);
			} catch {
				return new Uint8Array(0);
			}
		}
		if (typeof val === "object") {
			return new Uint8Array(Object.values(val as Record<string, number>));
		}
		return new Uint8Array(0);
	},
});

export const todos = sqliteTable("todos", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	title: text("title").notNull(),
	description: text("description"),
	completed: integer("completed").default(0).notNull(),
});

export const workspace = sqliteTable("workspace", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	icon: text("icon").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(new Date())
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(new Date())
		.notNull(),
});

export const notes = sqliteTable(
	"notes",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
		parentNoteId: text("parent_note_id").references(
			(): AnySQLiteColumn => notes.id,
			{
				onDelete: "set null",
			},
		),
		icon: text("icon").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		content: text("content", { mode: "json" }),
		contentText: text("content_text"),
		starred: integer("starred", { mode: "boolean" }).default(false).notNull(),
		trashedAt: integer("trashed_at", { mode: "timestamp" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.default(new Date())
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.default(new Date())
			.notNull(),
	},
	(t) => [
		index("notes_workspace_idx").on(t.workspaceId),
		index("notes_parent_idx").on(t.parentNoteId),
		index("notes_trashed_idx").on(t.trashedAt),
		index("notes_starred_idx").on(t.starred),
	],
);

export const notesSnapshot = sqliteTable(
	"notes_snapshot",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		noteId: text("note_id")
			.notNull()
			.references(() => notes.id, { onDelete: "cascade" }),
		label: text("label"),
		kind: text("kind", { enum: ["auto", "manual", "pinned"] }).notNull(),
		contentCompressed: sqliteBlob("content_compressed").notNull(),
		contentHash: text("content_hash").notNull(),
		size: integer("size").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(t) => [
		index("snapshot_note_created_idx").on(t.noteId, t.createdAt),
		index("snapshot_note_hash_idx").on(t.noteId, t.contentHash),
	],
);

export const assets = sqliteTable(
	"assets",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		noteId: text("note_id")
			.notNull()
			.references(() => notes.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		mimeType: text("mime_type").notNull(),
		size: integer("size").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(t) => [index("assets_note_idx").on(t.noteId)],
);
