import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const subscriptionPlans = pgEnum("subscription_plan", ["free", "pro"]);
export const subscriptionTypes = pgEnum("subscription_type", ["monthly", "yearly"]);


export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(), 
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  provider: varchar("provider", { length: 50 }).notNull().$type<"google" | "github" | "credentials">(),
  providerId: varchar("provider_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  subscriptionPlan: subscriptionPlans("subscription_plan").default("free").notNull(),
  aiCredits: integer("ai_credits").default(0).notNull(),
  subscriptionType: subscriptionTypes("subscription_type").default("monthly"),
  externalCustomerId: varchar("external_customer_id", { length: 255 }),
});



export type User = typeof users.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.enumValues;
export type SubscriptionType = typeof subscriptionTypes.enumValues;
