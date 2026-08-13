import { sqliteTable, text, integer,  } from "drizzle-orm/sqlite-core";
import { nanoid } from 'nanoid'

export const todos = sqliteTable('todos', {
    id: text('id').primaryKey().$defaultFn(() => nanoid()),
    title: text('title').notNull(),
    description: text('description'),
    completed: integer('completed').default(0).notNull(),
})
