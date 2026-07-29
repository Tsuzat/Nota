import { z } from 'zod';

export const SubscriptionPlanSchema = z.enum(['free', 'pro', '']);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const SubscriptionTypeSchema = z.enum(['monthly', 'yearly', '']);
export type SubscriptionType = z.infer<typeof SubscriptionTypeSchema>;

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  provider: z.enum(['google', 'github', 'email']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  is_verified: z.boolean().default(false),
  subscription_plan: SubscriptionPlanSchema.default('free'),
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

export const WorkspaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string().default('📁'),
  description: z.string().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  owner: z.uuid(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const NoteSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  parent_note_id: z.uuid().nullable().optional(),
  name: z.string(),
  icon: z.string().default('📝'),
  owner: z.uuid(),
  pinned: z.boolean().default(false),
  deleted_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date().default(() => new Date()),
  updated_at: z.coerce.date().default(() => new Date()),
  is_public: z.boolean().default(false),
  content: z.record(z.any(), z.any()).default({}).nullable().optional(),
});
export type Note = z.infer<typeof NoteSchema>;

export const NoteVersionSchema = z.object({
  id: z.uuid(),
  note_id: z.uuid(),
  workspace_id: z.uuid(),
  content_hash: z.string(),
  size_bytes: z.number().int(),
  compressed_size_bytes: z.number().int(),
  version_type: z.enum(['auto', 'manual', 'restore']).default('auto'),
  label: z.string().nullable().optional(),
  created_by: z.uuid().nullable().optional(),
  created_at: z.coerce.date(),
});
export type NoteVersion = z.infer<typeof NoteVersionSchema>;

export const AssetSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  workspace_id: z.uuid(),
  note_id: z.uuid().nullable().optional(),
  name: z.string(),
  path: z.string(),
  mime_type: z.string(),
  size: z.number().int(),
  created_at: z.coerce.date().default(() => new Date()),
  updated_at: z.coerce.date().default(() => new Date()),
  deleted_at: z.coerce.date().nullable().optional(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const NotaFileSchema = z.object({
  key: z.string(),
  size: z.number().int(),
  lastModified: z.coerce.date(),
  url: z.url(),
});
export type NotaFile = z.infer<typeof NotaFileSchema>;

export const SubscriptionDetailsSchema = z.object({
  subscription_plan: SubscriptionPlanSchema,
  subscription_type: SubscriptionTypeSchema.nullable().optional(),
  status: z.string().nullable().optional(),
  current_period_start: z.coerce.date().nullable().optional(),
  current_period_end: z.coerce.date().nullable().optional(),
  cancel_at_period_end: z.boolean().nullable().optional(),
  canceled_at: z.coerce.date().nullable().optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
});
export type SubscriptionDetails = z.infer<typeof SubscriptionDetailsSchema>;

export const CheckoutDetailsSchema = z.object({
  id: z.string(),
  status: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  payment_method: z.string().nullable().optional(),
});
export type CheckoutDetails = z.infer<typeof CheckoutDetailsSchema>;
