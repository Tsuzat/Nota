import {  sql } from 'drizzle-orm'
import * as p from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { user } from './auth'
import { relations } from 'drizzle-orm/_relations'

const bytea = p.customType<{ data: Buffer }>({ dataType: () => 'bytea' })
const tsvector = p.customType<{ data: string }>({ dataType: () => 'tsvector' })

export const planTier = p.pgEnum('plan_tier', ['free', 'pro'])
export const guestRole = p.pgEnum('guest_role', ['viewer', 'comment', 'editor', 'admin'])
export const snapshotKind = p.pgEnum('snapshot_kind', ['auto', 'manual', 'pinned'])
export const publishStatus = p.pgEnum('publish_status', ['published', 'unpublished'])

// ── user_quota ─────────────────────────────────────────────
export const userQuota = p.pgTable('user_quota', {
  userId: p.text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  planTier: planTier('plan_tier').notNull().default('free'),
  aiCreditBalanceCents: p.bigint('ai_credit_balance_cents', { mode: 'number' }).notNull().default(0),
  assignedStorageBytes: p.bigint('assigned_storage_bytes', { mode: 'number' }).notNull().default(524_288_000),
  usedStorageBytes: p.bigint('used_storage_bytes', { mode: 'number' }).notNull().default(0),
  updatedAt: p.timestamp('updated_at').notNull().defaultNow(),
})

// ── workspace ──────────────────────────────────────────────
export const workspace = p.pgTable('workspace', {
  id: p.text('id').primaryKey().$defaultFn(() => nanoid()),
  ownerId: p.text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  icon: p.text('icon'),
  name: p.text('name').notNull(),
  description: p.text('description'),
  createdAt: p.timestamp('created_at').notNull().defaultNow(),
  updatedAt: p.timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  p.index('workspace_owner_idx').on(t.ownerId),
])

// ── notes ──────────────────────────────────────────────────
export const notes = p.pgTable('notes', {
  id: p.text('id').primaryKey().$defaultFn(() => nanoid()),
  workspaceId: p.text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  parentNoteId: p.text('parent_note_id').references((): any => notes.id, { onDelete: 'set null' }),
  ownerId: p.text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  icon: p.text('icon'),
  name: p.text('name').notNull(),
  description: p.text('description'),

  content: bytea('content').notNull(), // canonical Yjs binary state

  // plain-text extraction, client-sent on every save
  contextText: p.text('context_text'),
  // derived entirely DB-side — never written to directly, Postgres
  // recomputes it whenever context_text changes on the same row
  contentVector: tsvector('content_vector').generatedAlwaysAs(
    (): any => sql`to_tsvector('english', coalesce(context_text, ''))`,
  ),

  starred: p.boolean('starred').notNull().default(false),
  trashedAt: p.timestamp('trashed_at'),

  createdAt: p.timestamp('created_at').notNull().defaultNow(),
  updatedAt: p.timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  p.index('notes_workspace_idx').on(t.workspaceId),
  p.index('notes_parent_idx').on(t.parentNoteId),
  p.index('notes_trashed_idx').on(t.trashedAt),
  p.index('notes_starred_idx').on(t.starred),
  p.index('notes_search_idx').using('gin', t.contentVector),
])

// ── note_guests ────────────────────────────────────────────
export const noteGuests = p.pgTable('note_guests', {
  id: p.text('id').primaryKey().$defaultFn(() => nanoid()),
  noteId: p.text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  userId: p.text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: guestRole('role').notNull().default('viewer'), // viewer < comment < editor < admin
  invitedBy: p.text('invited_by').notNull().references(() => user.id),
  createdAt: p.timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  p.uniqueIndex('note_guests_note_user_uq').on(t.noteId, t.userId),
  p.index('note_guests_note_idx').on(t.noteId),
  p.index('note_guests_user_idx').on(t.userId),
])

// ── note_snapshots ─────────────────────────────────────────
export const noteSnapshots = p.pgTable('note_snapshots', {
  id: p.text('id').primaryKey().$defaultFn(() => nanoid()),
  noteId: p.text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  createdBy: p.text('created_by').references(() => user.id), // null for auto snapshots
  label: p.text('label'),
  kind: snapshotKind('kind').notNull(),
  contentCompressed: bytea('content_compressed').notNull(), // always Yjs, no format field needed
  contentHash: p.text('content_hash').notNull(),
  size: p.integer('size').notNull(),
  createdAt: p.timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  p.index('snapshots_note_created_idx').on(t.noteId, t.createdAt),
  p.index('snapshots_note_kind_idx').on(t.noteId, t.kind),
  p.index('snapshots_note_hash_idx').on(t.noteId, t.contentHash),
])

// ── assets ─────────────────────────────────────────────────
export const assets = p.pgTable('assets', {
  id: p.text('id').primaryKey().$defaultFn(() => nanoid()),
  noteId: p.text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  name: p.text('name').notNull(),
  mimeType: p.text('mime_type').notNull(),
  size: p.integer('size').notNull(),
  uploadedBy: p.text('uploaded_by').notNull().references(() => user.id),
  path: p.text('path').notNull(),
  createdAt: p.timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  p.index('assets_note_idx').on(t.noteId),
])

// ── publish ────────────────────────────────────────────────
export const publish = p.pgTable('publish', {
  id: p.text('id').primaryKey().references(() => notes.id, { onDelete: 'cascade' }), // shared w/ notes.id
  slug: p.text('slug').notNull(),
  title: p.text('title').notNull(),
  contentHtml: p.text('content_html').notNull(),
  contentHash: p.text('content_hash').notNull(),
  status: publishStatus('status').notNull().default('published'),
  shouldIndex: p.boolean('should_index').notNull().default(true),
  publishedBy: p.text('published_by').notNull().references(() => user.id),
  publishedAt: p.timestamp('published_at').notNull().defaultNow(),
  updatedAt: p.timestamp('updated_at').notNull().defaultNow(),
  viewCount: p.integer('view_count').notNull().default(0),
}, (t) => [
  p.uniqueIndex('publish_slug_uq').on(t.slug),
])

// ── Relations ──────────────────────────────────────────────

export const userQuotaRelations = relations(userQuota, ({ one }) => ({
  user: one(user, {
    fields: [userQuota.userId],
    references: [user.id],
  }),
}))

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  owner: one(user, {
    fields: [workspace.ownerId],
    references: [user.id],
  }),
  notes: many(notes),
}))

export const notesRelations = relations(notes, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [notes.workspaceId],
    references: [workspace.id],
  }),
  owner: one(user, {
    fields: [notes.ownerId],
    references: [user.id],
  }),
  parent: one(notes, {
    fields: [notes.parentNoteId],
    references: [notes.id],
    relationName: 'note_children',
  }),
  children: many(notes, {
    relationName: 'note_children',
  }),
  guests: many(noteGuests),
  snapshots: many(noteSnapshots),
  assets: many(assets),
  publish: one(publish, {
    fields: [notes.id],
    references: [publish.id],
  }),
}))

export const noteGuestsRelations = relations(noteGuests, ({ one }) => ({
  note: one(notes, {
    fields: [noteGuests.noteId],
    references: [notes.id],
  }),
  user: one(user, {
    fields: [noteGuests.userId],
    references: [user.id],
    relationName: 'note_guest_user',
  }),
  inviter: one(user, {
    fields: [noteGuests.invitedBy],
    references: [user.id],
    relationName: 'note_guest_inviter',
  }),
}))

export const noteSnapshotsRelations = relations(noteSnapshots, ({ one }) => ({
  note: one(notes, {
    fields: [noteSnapshots.noteId],
    references: [notes.id],
  }),
  creator: one(user, {
    fields: [noteSnapshots.createdBy],
    references: [user.id],
  }),
}))

export const assetsRelations = relations(assets, ({ one }) => ({
  note: one(notes, {
    fields: [assets.noteId],
    references: [notes.id],
  }),
  uploader: one(user, {
    fields: [assets.uploadedBy],
    references: [user.id],
  }),
}))

export const publishRelations = relations(publish, ({ one }) => ({
  note: one(notes, {
    fields: [publish.id],
    references: [notes.id],
  }),
  publisher: one(user, {
    fields: [publish.publishedBy],
    references: [user.id],
  }),
}))