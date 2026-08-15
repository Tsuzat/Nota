import { createDb } from "@nota/db";
import * as schema from "@nota/db/schema/auth";
import { env } from "@nota/env/server";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { redis } from "bun";
import { polarClient } from "./lib/payments";

export function createAuth() {
	const db = createDb();
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: schema,
		}),
		secondaryStorage: {
			get: async (key) => {
				return await redis.get(key);
			},
			set: async (key, value, ttl) => {
				if (ttl) await redis.set(key, value, "EX", ttl);
				else await redis.set(key, value);
			},
			delete: async (key) => {
				await redis.del(key);
			},
		},
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
			cookiePrefix: "nota_ink",
		},
		plugins: [
			bearer(),
			polar({
				client: polarClient,
				createCustomerOnSignUp: true,
				enableCustomerPortal: true,
				use: [
					checkout({
						products: [
							{
								productId: "your-product-id",
								slug: "pro",
							},
						],
						successUrl: env.POLAR_SUCCESS_URL,
						authenticatedUsersOnly: true,
					}),
					portal(),
				],
			}),
		],
	});
}

export const auth = createAuth();
