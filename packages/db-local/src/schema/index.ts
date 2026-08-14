import { sqliteTable, text, integer, index, blob,  } from "drizzle-orm/sqlite-core";
import { nanoid } from 'nanoid'

export const todos = sqliteTable('todos', {
    id: text('id').primaryKey().$defaultFn(() => nanoid()),
    title: text('title').notNull(),
    description: text('description'),
    completed: integer('completed').default(0).notNull(),
})

export const workspace = sqliteTable('workspace', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  icon: text('icon').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()).notNull(),
})


export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey().$defaultFn(() => nanoid()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    parentNoteId: text('parent_note_id').references(
      (): any => notes.id,
      { onDelete: 'set null' }
    ),
    icon: text('icon').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    content: text('content', { mode: 'json' }).notNull(),
    contentText: text('content_text'),
    starred: integer('starred', { mode: 'boolean' }).default(false).notNull(),
    trashedAt: integer('trashed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()).notNull(),
  },
  (t) => [
    index('notes_workspace_idx').on(t.workspaceId),
    index('notes_parent_idx').on(t.parentNoteId),
    index('notes_trashed_idx').on(t.trashedAt),
    index('notes_starred_idx').on(t.starred),
  ]
)



export const notesSnapshot = sqliteTable(
  'notes_snapshot',
  {
    id: text('id').primaryKey().$defaultFn(() => nanoid()),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    label: text('label'), 
    kind: text('kind', { enum: ['auto', 'manual', 'pinned'] }).notNull(),
    contentCompressed: blob('content_compressed', { mode: 'buffer' }).notNull(),
    contentHash: text('content_hash').notNull(),
    size: integer('size').notNull(), 
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ([
    index('snapshot_note_created_idx').on(t.noteId, t.createdAt),
    index('snapshot_note_hash_idx').on(t.noteId, t.contentHash),
  ])
)

export const assets = sqliteTable(
  'assets',
  {
    id: text('id').primaryKey().$defaultFn(() => nanoid()),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), 
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ([
    index('assets_note_idx').on(t.noteId),
  ])
)