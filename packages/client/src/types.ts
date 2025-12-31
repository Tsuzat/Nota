import { size, z } from 'zod';

export const SubscriptionPlanSchema = z.enum(['free', 'pro']);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const SubscriptionTypeSchema = z.enum(['monthly', 'yearly']);
export type SubscriptionType = z.infer<typeof SubscriptionTypeSchema>;

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable().optional(),
  encryptedPassword: z.string().nullable().optional(),
  emailVerified: z.boolean().default(false),
  emailVerifiedAt: z.coerce.date().nullable().optional(),
  emailVerificationToken: z.string().nullable().optional(),
  emailVerificationTokenExpiresAt: z.coerce.date().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  provider: z.enum(['google', 'github', 'credentials']),
  providerId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isVerified: z.boolean().default(false),
  subscriptionPlan: SubscriptionPlanSchema.default('free'),
  aiCredits: z.number().int().default(0),
  subscriptionType: SubscriptionTypeSchema.nullable().optional(),
  externalCustomerId: z.string().nullable().optional(),
  assignedStorage: z.number().int().default(0),
  usedStorage: z.number().int().default(0),
  nextBillingAt: z.coerce.date().nullable().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  id: z.uuid(),
  userId: z.uuid().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  refreshedAt: z.coerce.date().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  ip: z.string().nullable().optional(),
  pkceChallenge: z.string().nullable().optional(),
  pkceChallengeMethod: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  browser: z.string().nullable().optional(),
  os: z.string().nullable().optional(),
  device: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  revoked: z.boolean().default(false),
  expiresAt: z.coerce.date().nullable().optional(),
});
export type Session = z.infer<typeof SessionSchema>;

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
  url: z.url()
})
export type NotaFile = z.infer<typeof NotaFileSchema>;
