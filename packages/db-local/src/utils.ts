import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { todos } from './schema/index';
import { z } from 'zod';
import { db } from './index';
import { eq } from 'drizzle-orm';

export const insertTodoSchema = createInsertSchema(todos);
export const selectTodoSchema = createSelectSchema(todos);
export const updateTodoSchema = createUpdateSchema(todos);

export type Todo = typeof todos.$inferSelect
export type TodoInsert = z.infer<typeof insertTodoSchema>;
export type TodoSelect = z.infer<typeof selectTodoSchema>;
export type TodoUpdate = z.infer<typeof updateTodoSchema>;

export async function getAllTodo(): Promise<Todo[]> {
  const result = await db.select().from(todos);
  const validated = selectTodoSchema.array().parse(result);
  return validated;
}

export async function createTodo(data: TodoInsert): Promise<Todo> {
  const validated = insertTodoSchema.parse(data);
  const result = await db.insert(todos).values(validated).returning();
  const validatedResult = selectTodoSchema.parse(result[0]);
  return validatedResult;
}

export async function updateTodo(id: string, data: TodoUpdate): Promise<Todo> {
  const validated = updateTodoSchema.parse(data);
  const result = await db.update(todos).set(validated).where(eq(todos.id, id)).returning();
  const validatedResult = selectTodoSchema.parse(result[0]);
  return validatedResult;
}

export async function deleteTodo(id: string): Promise<boolean> {
  const result = await db.delete(todos).where(eq(todos.id, id)).returning();
  return result.length > 0;
}
