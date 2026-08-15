import { db } from "../../index";
import { user } from "../../schema/auth";
import { workspace, notes, noteGuests } from "../../schema/app";
import { sql } from "drizzle-orm";

export const createTestUser = async (id: string, name = "Test User") => {
  await db
    .insert(user)
    .values({
      id,
      name,
      email: `${id}@test.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
};

export const createTestWorkspace = async (
  id: string,
  ownerId: string,
  name = "Test Workspace",
) => {
  await db
    .insert(workspace)
    .values({
      id,
      ownerId,
      name,
    })
    .onConflictDoNothing();
};

export const cleanupTestData = async () => {
  // Explicitly delete in reverse order to avoid foreign key violations,
  // as ON DELETE CASCADE might not be configured for all relationships (e.g. invitedBy)
  
  await db.delete(noteGuests).where(
    sql`invited_by IN (SELECT id FROM "user" WHERE email LIKE '%@test.com') OR user_id IN (SELECT id FROM "user" WHERE email LIKE '%@test.com')`
  );

  await db.delete(notes).where(
    sql`owner_id IN (SELECT id FROM "user" WHERE email LIKE '%@test.com')`
  );

  await db.delete(workspace).where(
    sql`owner_id IN (SELECT id FROM "user" WHERE email LIKE '%@test.com')`
  );

  await db.delete(user).where(sql`email LIKE '%@test.com'`);
};
