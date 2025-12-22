import { z } from "zod";

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().min(1).nullable(),
  avatarUrl: z.url(),
  provider: z.enum(["google", "github", "credentials"]),
  providerId: z.string().min(1).nullable(), // null if credentials
  isVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const updateUserSchema = userSchema.pick({
  name: true,
  avatarUrl: true,
}).partial();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
