import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const userworkspaces = pgTable("userworkspaces", {
  id: uuid().primaryKey().defaultRandom(),
  icon: text("icon").notNull(),
  name: text("name"),
  owner: text("owner").references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text("name"),
    icon: text("icon").default("📁"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    owner: text("owner").references(() => user.id, { onDelete: "cascade" }),
    userworkspace: uuid("userworkspace").references(() => userworkspaces.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [index("idx_workspaces_userworkspace").on(table.userworkspace)],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    icon: text("icon").default("📝").notNull(),
    workspace: uuid("workspace")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userworkspace: uuid("userworkspace")
      .notNull()
      .references(() => userworkspaces.id, { onDelete: "cascade" }),
    owner: text("owner")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    favorite: boolean("favorite").default(false).notNull(),
    trashed: boolean("trashed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    isPublic: boolean("is_public").default(false),
    content: jsonb("content").default({}),
  },
  (table) => [index("idx_notes_userworkspace").on(table.userworkspace)],
);

export type UserWorkspace = typeof userworkspaces.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Note = typeof notes.$inferSelect;
