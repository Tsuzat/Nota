import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const subscriptionPlans = pgEnum("subscription_plan", ["free", "pro"]);
export const subscriptionTypes = pgEnum("subscription_type", ["monthly", "yearly"]);


export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(), 
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: text("name"),
  encryptedPassword: text("encrypted_password"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationTokenExpiresAt: timestamp("email_verification_token_expires_at", { withTimezone: true }),
  avatarUrl: text("avatar_url"),
  provider: varchar("provider", { length: 50 }).notNull().$type<"google" | "github" | "credentials">(),
  providerId: varchar("provider_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  subscriptionPlan: subscriptionPlans("subscription_plan").default("free").notNull(),
  aiCredits: integer("ai_credits").default(0).notNull(),
  subscriptionType: subscriptionTypes("subscription_type").default("monthly"),
  externalCustomerId: varchar("external_customer_id", { length: 255 }),
});

export const userworkspaces = pgTable("userworkspaces", {
  id: uuid().primaryKey().defaultRandom(),
  icons: text("icons").notNull(),
  name: text("name"),
  owner: uuid("owner").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid().primaryKey().defaultRandom(),
  name: text("name"),
  icon: text("icon").default("📁"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  owner: uuid("owner").references(() => users.id, { onDelete: 'cascade' }),
  userworkspace: uuid("userworkspace").references(() => userworkspaces.id, { onDelete: 'cascade' }),
}, (table) => [
  index("idx_workspaces_userworkspace").on(table.userworkspace),
]);

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  icon: text("icon").default('📝'),
  workspace: uuid("workspace").notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userworkspace: uuid("userworkspace").notNull().references(() => userworkspaces.id, { onDelete: 'cascade' }),
  owner: uuid("owner").notNull().references(() => users.id, { onDelete: 'cascade' }),
  favorite: boolean("favorite").default(false),
  trashed: boolean("trashed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  content: jsonb("content").default({}),
}, (table) => [
  index("idx_notes_userworkspace").on(table.userworkspace),
]);

export type User = typeof users.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.enumValues;
export type SubscriptionType = typeof subscriptionTypes.enumValues;

export type UserWorkspace = typeof userworkspaces.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Note = typeof notes.$inferSelect;