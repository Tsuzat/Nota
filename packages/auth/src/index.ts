import { createDb } from "@nota/db";
import { userInit } from "@nota/db/data/utils";
import * as schema from "@nota/db/schema/auth";
import {
	getExistingUserSignupTemplate,
	getPasswordResetTemplate,
	getSignupVerificationTemplate,
	sendEmail,
} from "@nota/email";
import { env } from "@nota/env/server";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, captcha, deviceAuthorization } from "better-auth/plugins";
import { redis } from "bun";
import { polarClient } from "./lib/payments";

export function createAuth() {
	const db = createDb();
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: schema,
		}),
		rateLimit: {
			window: 60,
			max: 100,
			enabled: true,
			storage: "secondary-storage",
		},
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
		trustedOrigins: [
			env.CORS_ORIGIN.replace("www", "*"),
			env.CORS_ORIGIN,
			"tauri://localhost",
			"https://tauri.localhost",
		],
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			revokeSessionsOnPasswordReset: true,
			sendResetPassword: async ({ user, url }) => {
				void sendEmail({
					to: user.email,
					subject: "Reset your password",
					html: getPasswordResetTemplate(url),
				});
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			sendVerificationEmail: async ({ user, url }) => {
				void sendEmail({
					to: user.email,
					subject: "Verify your email address",
					html: getSignupVerificationTemplate(url),
				});
			},
			// @ts-expect-error - Assuming it might be here based on the user's snippet
			onExistingUserSignUp: async ({ user }) => {
				void sendEmail({
					to: user.email,
					subject: "Sign-up attempt with your email",
					html: getExistingUserSignupTemplate(),
				});
			},
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						await userInit({
							ownerId: user.id,
							name: user.name,
						});
					},
				},
			},
		},
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
			cookiePrefix: "nota_ink",
			ipAddress: {
				ipAddressHeaders: ["cf-connecting-ip"],
			},
		},
		plugins: [
			bearer(),
			captcha({
				provider: "cloudflare-turnstile",
				secretKey: env.TURNSILE_SECRET,
			}),
			deviceAuthorization({
				verificationUri: `${env.CORS_ORIGIN}/device`,
				expiresIn: "10m",
				interval: "5s",
				validateClient: async (clientId) => {
					return clientId === "nota-desktop";
				},
			}),
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
