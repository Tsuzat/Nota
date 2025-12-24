import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { DB } from '../../db';
import { workspaces } from '../../db/schema';
import { authMiddleware } from '../middlewares/auth';

const app = new Hono<{ Variables: { userId: string; userEmail: string } }>();

// Protect all routes with auth middleware
app.use('*', authMiddleware);

// Schema for creating a workspace
const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  userworkspaceId: z.uuid('Userworkspace ID is required'),
  icon: z.string().optional(),
  description: z.string().optional(),
});

// Schema for updating a workspace
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
});

// 1. Get all workspaces (optionally filtered by userworkspaceId)
app.get('/', async (c) => {
  const userId = c.get('userId');
  const userworkspaceId = c.req.query('userworkspaceId');

  try {

    const result = DB.select()
      .from(workspaces)
      .where(
        userworkspaceId ? 
        and(eq(workspaces.owner, userId), eq(workspaces.userworkspace, userworkspaceId)) 
        : eq(workspaces.owner, userId)
      );
    return c.json(result);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return c.json({ error: 'Failed to fetch workspaces' }, 500);
  }
});

// 2. Create a new workspace
app.post('/', zValidator('json', createSchema), async (c) => {
  const userId = c.get('userId');
  const { name, userworkspaceId, icon, description } = c.req.valid('json');
  try {
    const [newWorkspace] = await DB.insert(workspaces)
      .values({
        name,
        userworkspace: userworkspaceId,
        owner: userId,
        icon: icon || '📁',
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return c.json(newWorkspace, 201);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return c.json({ error: 'Failed to create workspace' }, 500);
  }
});

// 3. Delete workspace by id
app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.req.param('id');

  try {
    const deleted = await DB.delete(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.owner, userId)))
      .returning();

    if (deleted.length === 0) {
      return c.json({ error: 'Workspace not found or unauthorized' }, 404);
    }

    return c.json({ message: 'Workspace deleted successfully', id: workspaceId });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return c.json({ error: 'Failed to delete workspace' }, 500);
  }
});

// 4. Update workspace by id
app.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.req.param('id');
  const { name, icon, description } = c.req.valid('json');

  if (!name && !icon && !description) {
    return c.json({ error: 'Nothing to update' }, 400);
  }

  try {
    const [updatedWorkspace] = await DB.update(workspaces)
      .set({
        ...(name ? { name } : {}),
        ...(icon ? { icon } : {}),
        ...(description ? { description } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.owner, userId)))
      .returning();

    if (!updatedWorkspace) {
      return c.json({ error: 'Workspace not found or unauthorized' }, 404);
    }

    return c.json(updatedWorkspace);
  } catch (error) {
    console.error('Error updating workspace:', error);
    return c.json({ error: 'Failed to update workspace' }, 500);
  }
});

export default app;
