import { z } from 'zod';

export const SubscriptionPlanSchema = z.enum(['free', 'pro']);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const SubscriptionTypeSchema = z.enum(['monthly', 'yearly']);
export type SubscriptionType = z.infer<typeof SubscriptionTypeSchema>;

export const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    emailVerified: z.boolean().default(false),
    image: z.string().nullable().optional(),
    aiCredits: z.number().int().default(0),
    assignedStorage: z.number().int().default(0),
    usedStorage: z.number().int().default(0),
    subscriptionPlan: SubscriptionPlanSchema.default('free'),
    subscriptionType: SubscriptionTypeSchema.nullable().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .partial();
export type User = z.infer<typeof UserSchema>;

export const UserWorkspaceSchema = z.object({
  id: z.uuid(),
  icon: z.string(),
  name: z.string(),
  owner: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type UserWorkspace = z.infer<typeof UserWorkspaceSchema>;

export const WorkspaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string().default('📁'),
  description: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  owner: z.uuid(),
  userworkspace: z.uuid(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const NoteSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string().default('📝'),
  workspace: z.uuid(),
  userworkspace: z.uuid(),
  owner: z.uuid(),
  favorite: z.boolean().default(false),
  trashed: z.boolean().default(false),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
  isPublic: z.boolean().default(false),
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
