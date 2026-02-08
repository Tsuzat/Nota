import { z } from "zod";

export const SubscriptionPlanSchema = z.enum(["free", "pro", ""]);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const SubscriptionTypeSchema = z.enum(["monthly", "yearly", ""]);
export type SubscriptionType = z.infer<typeof SubscriptionTypeSchema>;

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  provider: z.enum(["google", "github", "email"]),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  is_verified: z.boolean().default(false),
  subscription_plan: SubscriptionPlanSchema.default("free"),
  ai_credits: z.number().int().default(0),
  subscription_type: SubscriptionTypeSchema.nullable().optional(),
  external_customer_id: z.string().nullable().optional(),
  email_verified: z.boolean().default(false),
  assigned_storage: z.number().int().default(0),
  used_storage: z.number().int().default(0),
  next_billing_at: z.coerce.date().nullable().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  refreshed_at: z.coerce.date().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  ip: z.string().nullable().optional(),
  pkce_challenge: z.string().nullable().optional(),
  pkce_challenge_method: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  browser: z.string().nullable().optional(),
  os: z.string().nullable().optional(),
  device: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  revoked: z.boolean().default(false),
  expires_at: z.coerce.date().nullable().optional(),
});
export type Session = z.infer<typeof SessionSchema>;

export const UserWorkspaceSchema = z.object({
  id: z.uuid(),
  icon: z.string(),
  name: z.string(),
  owner: z.uuid(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type UserWorkspace = z.infer<typeof UserWorkspaceSchema>;

export const WorkspaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string().default("📁"),
  description: z.string().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  owner: z.uuid(),
  userworkspace: z.uuid(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const NoteSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string().default("📝"),
  workspace: z.uuid(),
  userworkspace: z.uuid(),
  owner: z.uuid(),
  favorite: z.boolean().default(false),
  trashed: z.boolean().default(false),
  created_at: z.coerce.date().default(() => new Date()),
  updated_at: z.coerce.date().default(() => new Date()),
  is_public: z.boolean().default(false),
  content: z.record(z.any(), z.any()).default({}),
});
export type Note = z.infer<typeof NoteSchema>;

export const NotaFileSchema = z.object({
  key: z.string(),
  size: z.number().int(),
  lastModified: z.coerce.date(),
  url: z.url(),
});
export type NotaFile = z.infer<typeof NotaFileSchema>;
