import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { DB } from '../../db';
import { userworkspaces } from '../../db/schema';
import { logerror } from '../../logging';
import type { Variables } from '..';
import { authMiddleware } from '../middlewares/auth';
import { proMiddleWare } from '../middlewares/checkpro';

const app = new Hono<{ Variables: Variables }>();

// Protect all routes with auth middleware and pro middleware
app.use('*', authMiddleware, proMiddleWare);

// Schema for creating/updating a userworkspace
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().min(1, 'Icon is required'), // Assuming 'icon' is a string (emoji or url)
});

// 1. Get all userworkspaces of owner
app.get('/', async (c) => {
  const userId = c.get('userId');

  try {
    const userWorkspaces = await DB.select().from(userworkspaces).where(eq(userworkspaces.owner, userId));

    return c.json(userWorkspaces);
  } catch (error) {
    logerror('Error fetching userworkspaces:', error);
    return c.json({ error: 'Failed to fetch userworkspaces' }, 500);
  }
});

// 2. Create a new userworkspace
app.post('/', zValidator('json', schema), async (c) => {
  const userId = c.get('userId');
  const { name, icon } = c.req.valid('json');

  try {
    const [newWorkspace] = await DB.insert(userworkspaces)
      .values({
        name,
        icon: icon,
        owner: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return c.json(newWorkspace, 201);
  } catch (error) {
    logerror('Error creating userworkspace:', error);
    return c.json({ error: 'Failed to create userworkspace' }, 500);
  }
});

// 3. Delete userworkspace by id
app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.req.param('id');

  try {
    // Check ownership and delete in one go if possible, or verify first
    const deleted = await DB.delete(userworkspaces)
      .where(and(eq(userworkspaces.id, workspaceId), eq(userworkspaces.owner, userId)))
      .returning();

    if (deleted.length === 0) {
      return c.json({ error: 'Userworkspace not found or unauthorized' }, 404);
    }

    return c.json({ message: 'Userworkspace deleted successfully', id: workspaceId });
  } catch (error) {
    logerror('Error deleting userworkspace:', error);
    return c.json({ error: 'Failed to delete userworkspace' }, 500);
  }
});

// 4. Update userworkspace by id
app.patch('/:id', zValidator('json', schema.partial()), async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.req.param('id');
  const { name, icon } = c.req.valid('json');

  if (!name && !icon) {
    return c.json({ error: 'Nothing to update' }, 400);
  }

  try {
    const [updatedWorkspace] = await DB.update(userworkspaces)
      .set({
        ...(name ? { name } : {}),
        ...(icon ? { icon } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(userworkspaces.id, workspaceId), eq(userworkspaces.owner, userId)))
      .returning();

    if (!updatedWorkspace) {
      return c.json({ error: 'Userworkspace not found or unauthorized' }, 404);
    }

    return c.json(updatedWorkspace);
  } catch (error) {
    logerror('Error updating userworkspace:', error);
    return c.json({ error: 'Failed to update userworkspace' }, 500);
  }
});

export default app;
