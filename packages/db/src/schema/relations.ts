import { defineRelations } from 'drizzle-orm'
import * as schema from './index';

export const relations = defineRelations(schema, (r) => ({
    user: {
        accounts: r.many.account(),
    },
    account: {
        user: r.one.user({
            from: r.account.userId,
            to: r.user.id,
        }),
    },
    userQuota: {
        user: r.one.user({
            from: r.userQuota.userId,
            to: r.user.id,
        }),
    },
    workspace: {
        owner: r.one.user({
            from: r.workspace.ownerId,
            to: r.user.id,
        }),
        notes: r.many.notes(),
    },
    notes: {
        workspace: r.one.workspace({
            from: r.notes.workspaceId,
            to: r.workspace.id,
        }),
        owner: r.one.user({
            from: r.notes.ownerId,
            to: r.user.id,
        }),
        parent: r.one.notes({
            from: r.notes.parentNoteId,
            to: r.notes.id,
        }),
        children: r.many.notes({
            from: r.notes.id,
            to: r.notes.parentNoteId,
        }),
        guests: r.many.noteGuests(),
        snapshots: r.many.noteSnapshots(),
        assets: r.many.assets(),
        publish: r.one.publish({
            from: r.notes.id,
            to: r.publish.id,
        }),
    },
    noteGuests: {
        note: r.one.notes({
            from: r.noteGuests.noteId,
            to: r.notes.id,
        }),
        user: r.one.user({
            from: r.noteGuests.userId,
            to: r.user.id,
        }),
        inviter: r.one.user({
            from: r.noteGuests.invitedBy,
            to: r.user.id,
        }),
    },
    noteSnapshots: {
        note: r.one.notes({
            from: r.noteSnapshots.noteId,
            to: r.notes.id,
        }),
        creator: r.one.user({
            from: r.noteSnapshots.createdBy,
            to: r.user.id,
        }),
    },
    assets: {
        note: r.one.notes({
            from: r.assets.noteId,
            to: r.notes.id,
        }),
        uploader: r.one.user({
            from: r.assets.uploadedBy,
            to: r.user.id,
        }),
    },
    publish: {
        note: r.one.notes({
            from: r.publish.id,
            to: r.notes.id,
        }),
        publisher: r.one.user({
            from: r.publish.publishedBy,
            to: r.user.id,
        }),
    },
}))
