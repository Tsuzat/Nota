import { zValidator } from '@hono/zod-validator';
import { and, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { DB } from '../../db';
import { notes, sessions } from '../../db/schema';
import { verifyAccessToken } from '../../lib/jwt';
import { logerror } from '../../logging';
import type { Variables } from '..';
import { authMiddleware } from '../middlewares/auth';

const app = new Hono<{ Variables: Variables }>();

// Public endpoint to get note content if it is public
// or if the user is authenticated and is the owner
app.get('/:id/preview', async (c) => {
  const noteId = c.req.param('id');
  try {
    // 1. Fetch the note first
    const note = await DB.query.notes.findFirst({
      where: eq(notes.id, noteId),
      columns: {
        id: true,
        name: true,
        icon: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        owner: true,
      },
    });

    if (!note) {
      return c.json({ error: 'Note not found' }, 404);
    }

    // 2. If public, return immediately
    if (note.isPublic) {
      return c.json(note);
    }

    // 3. If private, check auth
    let token = getCookie(c, 'access_token');
    if (!token) {
      token = c.req.header('Authorization')?.split(' ')[1];
    }
    if (!token) {
      return c.json({ error: 'Unauthorized: Private note and no token provided' }, 401);
    }

    const payload = await verifyAccessToken(token);
    // Check session
    const session = await DB.query.sessions.findFirst({
      where: eq(sessions.id, payload.sessionId),
    });
    if (!session || session.revoked || session.expiresAt < new Date()) {
      return c.json({ error: 'Session not found or revoked' }, 401);
    }

    // 4. Check ownership
    if (note.owner !== payload.sub) {
      return c.json({ error: 'Unauthorized: You are not the owner of this note' }, 403);
    }

    return c.json(note);
  } catch (error) {
    logerror('Error fetching preview note:', error);
    return c.json({ error: 'Failed to fetch note' }, 500);
  }
});

// Protect all routes with auth middleware
app.use('*', authMiddleware);

// Schema for creating a note
const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  workspaceId: z.uuid('Workspace ID is required'),
  userworkspaceId: z.uuid('Userworkspace ID is required'),
  icon: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

// Schema for importing a note
const importSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  userworkspaceId: z.uuid('Userworkspace ID is required'),
  workspaceId: z.uuid('Workspace ID is required'),
  content: z.record(z.string(), z.any()).default({}),
});

// Schema for updating a note (Metadata only)
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  favorite: z.boolean().optional(),
  trashed: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  workspaceId: z.uuid().optional(),
  userworkspaceId: z.uuid().optional(),
});

// Schema for JSON Patch
const patchSchema = z.array(
  z.object({
    op: z.enum(['add', 'replace', 'remove']),
    path: z.string(),
    value: z.any().optional(),
  })
);

// 1. Get note content by noteId (Specific path first)
app.get('/:noteId/content', async (c) => {
  const userId = c.get('userId');
  const noteId = c.req.param('noteId');

  try {
    const note = await DB.query.notes.findFirst({
      where: and(eq(notes.id, noteId), eq(notes.owner, userId)),
      columns: { content: true },
    });

    if (!note) {
      return c.json({ error: 'Note not found or unauthorized' }, 404);
    }

    return c.json(note.content);
  } catch (error) {
    logerror('Error fetching note content:', error);
    return c.json({ error: 'Failed to fetch note content' }, 500);
  }
});

// 2. Apply JSON Patch to note content
app.patch('/:noteId/content', zValidator('json', patchSchema), async (c) => {
  const userId = c.get('userId');
  const noteId = c.req.param('noteId');
  const patch = c.req.valid('json');

  try {
    // Wrap patch in an object to ensure Drizzle treats it as a single JSON parameter
    // and not a list of values. Then extract it back in SQL.
    const wrapper = { p: patch };
    await DB.execute(sql`SELECT apply_note_patch(${noteId}, (${wrapper}::jsonb)->'p', ${userId})`);

    return c.json({ success: true });
  } catch (error: any) {
    logerror('Error patching note:', error);

    // Attempt to parse Postgres errors
    const errorMessage = error.message || '';
    if (errorMessage.includes('Permission denied')) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    if (errorMessage.includes('Note not found')) {
      return c.json({ error: 'Note not found' }, 404);
    }
    return c.json({ error: 'Failed to patch note content' }, 500);
  }
});

// 3. Get all notes for a userworkspace (Excluding content)
app.get('/:userworkspaceId', async (c) => {
  const userId = c.get('userId');
  const userworkspaceId = c.req.param('userworkspaceId');

  try {
    // Select specific columns to exclude 'content'
    const results = await DB.select({
      id: notes.id,
      name: notes.name,
      icon: notes.icon,
      workspace: notes.workspace,
      userworkspace: notes.userworkspace,
      owner: notes.owner,
      favorite: notes.favorite,
      trashed: notes.trashed,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
      .from(notes)
      .where(and(eq(notes.owner, userId), eq(notes.userworkspace, userworkspaceId)));

    return c.json(results);
  } catch (error) {
    logerror('Error fetching notes:', error);
    return c.json({ error: 'Failed to fetch notes' }, 500);
  }
});

// 4. Create a new note
app.post('/', zValidator('json', createSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');

  try {
    const [newNote] = await DB.insert(notes)
      .values({
        name: body.name,
        workspace: body.workspaceId,
        userworkspace: body.userworkspaceId,
        owner: userId,
        icon: body.icon || '📝',
        favorite: body.isFavorite || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json(newNote, 201);
  } catch (error) {
    logerror('Error creating note:', error);
    return c.json({ error: 'Failed to create note' }, 500);
  }
});

// 5. Delete note by id
app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const noteId = c.req.param('id');

  try {
    const deleted = await DB.delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.owner, userId)))
      .returning();

    if (deleted.length === 0) {
      return c.json({ error: 'Note not found or unauthorized' }, 404);
    }

    return c.json({ message: 'Note deleted successfully', id: noteId });
  } catch (error) {
    logerror('Error deleting note:', error);
    return c.json({ error: 'Failed to delete note' }, 500);
  }
});

// 6. Update note metadata by id
app.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const userId = c.get('userId');
  const noteId = c.req.param('id');
  const body = c.req.valid('json');

  if (Object.keys(body).length === 0) {
    return c.json({ error: 'Nothing to update' }, 400);
  }

  try {
    const [updatedNote] = await DB.update(notes)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, noteId), eq(notes.owner, userId)))
      .returning();

    if (!updatedNote) {
      return c.json({ error: 'Note not found or unauthorized' }, 404);
    }

    return c.json(updatedNote);
  } catch (error) {
    logerror('Error updating note:', error);
    return c.json({ error: 'Failed to update note' }, 500);
  }
});

// 7. Duplicate note by id
app.post('/:id/duplicate', async (c) => {
  const userId = c.get('userId');
  const noteId = c.req.param('id');

  try {
    const [duplicatedNote] = await DB.execute(sql`
      INSERT INTO notes (name, icon, workspace, userworkspace, owner, content, favorite, trashed, createdAt, updatedAt)
      SELECT name || ' (copy)', icon, workspace, userworkspace, owner, content, false, false, NOW(), NOW()
      FROM notes
      WHERE id = ${noteId} AND owner = ${userId}
      RETURNING *
    `);
    return c.json(duplicatedNote, 201);
  } catch (error) {
    logerror('Error duplicating note:', error);
    return c.json({ error: 'Failed to duplicate note' }, 500);
  }
});

// 8. Import Note
app.post('/import', zValidator('json', importSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');

  try {
    const [newNote] = await DB.insert(notes)
      .values({
        name: body.name,
        workspace: body.workspaceId,
        userworkspace: body.userworkspaceId,
        owner: userId,
        content: body.content,
      })
      .returning({
        id: notes.id,
        name: notes.name,
        icon: notes.icon,
        workspace: notes.workspace,
        userworkspace: notes.userworkspace,
        owner: notes.owner,
        favorite: notes.favorite,
        trashed: notes.trashed,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      });
    return c.json(newNote, 201);
  } catch (error) {
    logerror('Error importing note:', error);
    return c.json({ error: 'Failed to import note' }, 500);
  }
});

export default app;
