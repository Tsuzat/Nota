import { protectedProcedure } from "../index";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import {
  getNotesMeta,
  createNotes,
  updateNotesMeta,
  updateContent,
  deleteNotes,
  getCollabNotes,
  insertNoteSchema,
  updateNoteSchema,
} from "@nota/db/data/notes";
import { getNoteUserPermission } from "@nota/db/data/permissions";
import {
  getCachedNoteUserPermission,
  setCachedNoteUserPermission,
  invalidateNoteUserPermission,
} from "@nota/cache/permissions";
import { invalidateNoteMetaCache } from "@nota/cache/notes";

const resolvePermission = async (noteId: string, userId: string) => {
  let perm = await getCachedNoteUserPermission(noteId, userId);
  if (!perm) {
    perm = await getNoteUserPermission(noteId, userId);
    if (perm) {
      void setCachedNoteUserPermission(noteId, userId, perm).catch(
        console.error,
      );
    }
  }
  return perm;
};

export const notesRouter = {
  getMeta: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const perm = await resolvePermission(input.id, userId);

      if (!perm) {
        throw new ORPCError("NOT_FOUND", { message: "Note not found" });
      }

      // If user has no permission (neither owner nor any guest role)
      if (!perm.isOwner && !perm.role) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "You do not have access to this note",
        });
      }

      try {
        const meta = await getNotesMeta(input.id);
        if (!meta) throw new ORPCError("NOT_FOUND");
        return meta;
      } catch (err) {
        console.error("Failed to fetch note meta:", err);
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }
    }),

  create: protectedProcedure
    .input(insertNoteSchema.omit({ ownerId: true, id: true }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      try {
        const note = await createNotes({
          ...input,
          ownerId: userId,
        });

        // After creation, invalidate workspace list cache to reflect new note
        void invalidateNoteMetaCache(note.id, note.workspaceId).catch(
          console.error,
        );

        return note;
      } catch (err) {
        console.error("Failed to create note:", err);
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }
    }),

  updateMeta: protectedProcedure
    .input(updateNoteSchema.required({ id: true }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const perm = await resolvePermission(input.id, userId);

      if (!perm) {
        throw new ORPCError("NOT_FOUND", { message: "Note not found" });
      }

      if (!perm.isOwner && perm.role !== "editor" && perm.role !== "admin") {
        throw new ORPCError("UNAUTHORIZED", {
          message: "You are not authorized to update this note",
        });
      }

      try {
        const updated = await updateNotesMeta(input);
        if (!updated) throw new ORPCError("NOT_FOUND");

        // Invalidate specific note cache and parent workspace's notes cache
        void invalidateNoteMetaCache(updated.id, updated.workspaceId).catch(
          console.error,
        );
        return updated;
      } catch (err) {
        console.error("Failed to update note meta:", err);
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }
    }),

  updateContent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.any(), // Assuming client passes buffer/Uint8Array depending on ORPC serialization
        contextText: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const perm = await resolvePermission(input.id, userId);

      if (!perm) {
        throw new ORPCError("NOT_FOUND", { message: "Note not found" });
      }

      if (!perm.isOwner && perm.role !== "editor" && perm.role !== "admin") {
        throw new ORPCError("UNAUTHORIZED", {
          message: "You are not authorized to edit this note",
        });
      }

      try {
        const success = await updateContent(
          input.id,
          input.content as Buffer,
          input.contextText,
        );
        if (!success) throw new ORPCError("NOT_FOUND");

        // Note: Content updates might not change meta immediately, but good practice to clear cache if updatedAt changes
        void invalidateNoteMetaCache(input.id).catch(console.error);

        return success;
      } catch (err) {
        console.error("Failed to update note content:", err);
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const perm = await resolvePermission(input.id, userId);

      if (!perm) {
        throw new ORPCError("NOT_FOUND", { message: "Note not found" });
      }

      // Strictly owner-only operation
      if (!perm.isOwner) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only the note owner can delete it",
        });
      }

      try {
        const success = await deleteNotes(input.id);
        if (!success) throw new ORPCError("NOT_FOUND");

        void invalidateNoteUserPermission(input.id, userId).catch(
          console.error,
        );
        void invalidateNoteMetaCache(input.id).catch(console.error); // Best effort, don't have workspaceId easily here unless fetched

        return success;
      } catch (err) {
        console.error("Failed to delete note:", err);
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }
    }),

  getCollabNotes: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    try {
      // In a real scenario we'd cache collab notes per user as well,
      // but for now directly querying DB as requested in plan
      return await getCollabNotes(userId);
    } catch (err) {
      console.error("Failed to fetch collab notes:", err);
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  }),
};
