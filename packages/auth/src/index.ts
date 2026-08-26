import { passkey } from "@better-auth/passkey";
import { createDb } from "@nota/db";
import {
	AI_CREDIT_TOPUP_CENTS,
	addAiCredits,
	DEFAULT_FREE_STORAGE_BYTES,
	findUserIdByCustomerOrEmail,
	PRO_STORAGE_BYTES,
	setUserPlanTier,
} from "@nota/db/data/user_quota";
import { userInit } from "@nota/db/data/utils";
import * as schema from "@nota/db/schema/auth";
import {
	getExistingUserSignupTemplate,
	getPasswordResetTemplate,
	getSignupVerificationTemplate,
	sendEmail,
} from "@nota/email";
import { env } from "@nota/env/server";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
	bearer,
	captcha,
	deviceAuthorization,
	lastLoginMethod,
} from "better-auth/plugins";
import { redis } from "bun";
import { polarClient } from "./lib/payments";

const WEBHOOK_EVENT_CACHE_PREFIX = "polar:event";
const USER_QUOTA_CACHE_PREFIX = "user_quota";

const acquireWebhookEventLock = async (
	eventId: string,
	ttlSeconds = 86400,
): Promise<boolean> => {
	try {
		const key = `${WEBHOOK_EVENT_CACHE_PREFIX}:${eventId}`;
		const nxRes = await redis.set(key, "1", "EX", ttlSeconds.toString(), "NX");
		return nxRes === "OK";
	} catch (error) {
		console.error(
			`Failed to acquire webhook lock for event ${eventId}:`,
			error,
		);
		return true;
	}
};

const deleteCachedUserQuota = async (userId: string): Promise<void> => {
	try {
		await redis.del(`${USER_QUOTA_CACHE_PREFIX}:${userId}`);
	} catch (error) {
		console.error(
			`Failed to invalidate user quota cache for ${userId}:`,
			error,
		);
	}
};

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
			customRules: {
				"/sign-in/email": {
					window: 10,
					max: 3,
				},
				"/sign-up/email": {
					window: 10,
					max: 3,
				},
				"/forget-password": {
					window: 10,
					max: 3,
				},
				"/reset-password": {
					window: 10,
					max: 3,
				},
				"/send-verification-email": {
					window: 10,
					max: 3,
				},
			},
		},
		secondaryStorage: {
			get: async (key) => {
				return await redis.get(key);
			},
			set: async (key, value, ttl) => {
				if (ttl) await redis.set(key, value, "EX", ttl.toString());
				else await redis.set(key, value);
			},
			delete: async (key) => {
				await redis.del(key);
			},
			getAndDelete: async (key) => {
				return await redis.getdel(key);
			},
			increment: async (key, ttl) => {
				const count = await redis.incr(key);
				if (count === 1 && ttl) {
					await redis.expire(key, ttl);
				}
				return count;
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
			passkey(),
			bearer(),
			lastLoginMethod(),
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
								productId: env.POLAR_AI_CREDIT_ID,
								slug: "ai-credit",
							},
							{
								productId: env.POLAR_PRO_MONTHLY_PLAN_ID,
								slug: "pro-monthly",
							},
							{
								productId: env.POLAR_PRO_YEARLY_PLAN_ID,
								slug: "pro-yearly",
							},
						],
						successUrl: env.POLAR_SUCCESS_URL,
						authenticatedUsersOnly: true,
					}),
					portal(),
					webhooks({
						secret: env.POLAR_WEBHOOK_SECRET,
						onOrderPaid: async (payload) => {
							const order = payload.data;
							if (!order) return;

							const acquired = await acquireWebhookEventLock(
								`order:paid:${order.id}`,
							);
							if (!acquired) {
								console.log(
									`[Polar Webhook] Duplicate order.paid event ignored: ${order.id}`,
								);
								return;
							}

							// 1. One-time purchase: AI Credits
							if (order.productId === env.POLAR_AI_CREDIT_ID) {
								const userId = await findUserIdByCustomerOrEmail(
									order.customer?.externalId,
									order.customer?.email,
								);
								if (!userId) {
									console.error(
										`[Polar Webhook] User not found for AI credit order: ${order.id}`,
									);
									return;
								}

								await addAiCredits(userId, AI_CREDIT_TOPUP_CENTS);
								await deleteCachedUserQuota(userId);
								console.log(
									`[Polar Webhook] Added ${AI_CREDIT_TOPUP_CENTS} cents AI credits to user: ${userId}`,
								);
							}
						},
						onSubscriptionActive: async (payload) => {
							const subscription = payload.data;
							if (!subscription) return;

							const acquired = await acquireWebhookEventLock(
								`sub:active:${subscription.id}:${subscription.modifiedAt ?? subscription.createdAt}`,
							);
							if (!acquired) {
								console.log(
									`[Polar Webhook] Duplicate subscription.active event ignored: ${subscription.id}`,
								);
								return;
							}

							if (
								subscription.productId === env.POLAR_PRO_MONTHLY_PLAN_ID ||
								subscription.productId === env.POLAR_PRO_YEARLY_PLAN_ID
							) {
								const userId = await findUserIdByCustomerOrEmail(
									subscription.customer?.externalId,
									subscription.customer?.email,
								);
								if (!userId) {
									console.error(
										`[Polar Webhook] User not found for subscription: ${subscription.id}`,
									);
									return;
								}

								await setUserPlanTier(userId, "pro", PRO_STORAGE_BYTES);
								await deleteCachedUserQuota(userId);
								console.log(
									`[Polar Webhook] Activated Pro plan for user: ${userId}`,
								);
							}
						},
						onSubscriptionCreated: async (payload) => {
							const subscription = payload.data;
							if (!subscription) return;

							if (
								subscription.status === "active" ||
								subscription.status === "trialing"
							) {
								const acquired = await acquireWebhookEventLock(
									`sub:created:${subscription.id}`,
								);
								if (!acquired) return;

								if (
									subscription.productId === env.POLAR_PRO_MONTHLY_PLAN_ID ||
									subscription.productId === env.POLAR_PRO_YEARLY_PLAN_ID
								) {
									const userId = await findUserIdByCustomerOrEmail(
										subscription.customer?.externalId,
										subscription.customer?.email,
									);
									if (!userId) return;

									await setUserPlanTier(userId, "pro", PRO_STORAGE_BYTES);
									await deleteCachedUserQuota(userId);
									console.log(
										`[Polar Webhook] Created & activated Pro plan for user: ${userId}`,
									);
								}
							}
						},
						onSubscriptionUpdated: async (payload) => {
							const subscription = payload.data;
							if (!subscription) return;

							const acquired = await acquireWebhookEventLock(
								`sub:updated:${subscription.id}:${subscription.status}:${subscription.modifiedAt ?? Date.now()}`,
							);
							if (!acquired) return;

							const isProProduct =
								subscription.productId === env.POLAR_PRO_MONTHLY_PLAN_ID ||
								subscription.productId === env.POLAR_PRO_YEARLY_PLAN_ID;

							if (!isProProduct) return;

							const userId = await findUserIdByCustomerOrEmail(
								subscription.customer?.externalId,
								subscription.customer?.email,
							);
							if (!userId) {
								console.error(
									`[Polar Webhook] User not found for subscription update: ${subscription.id}`,
								);
								return;
							}

							if (
								subscription.status === "active" ||
								subscription.status === "trialing"
							) {
								await setUserPlanTier(userId, "pro", PRO_STORAGE_BYTES);
								await deleteCachedUserQuota(userId);
								console.log(
									`[Polar Webhook] Updated & maintained Pro plan for user: ${userId}`,
								);
							} else if (
								subscription.status === "canceled" ||
								subscription.status === "paused" ||
								subscription.status === "past_due" ||
								subscription.status === "unpaid" ||
								subscription.status === "incomplete_expired"
							) {
								await setUserPlanTier(
									userId,
									"free",
									DEFAULT_FREE_STORAGE_BYTES,
								);
								await deleteCachedUserQuota(userId);
								console.log(
									`[Polar Webhook] Downgraded user ${userId} to Free plan due to status: ${subscription.status}`,
								);
							}
						},
						onSubscriptionCanceled: async (payload) => {
							const subscription = payload.data;
							if (!subscription) return;

							// If period ended or immediate cancellation
							if (
								subscription.status === "canceled" ||
								!subscription.cancelAtPeriodEnd
							) {
								const acquired = await acquireWebhookEventLock(
									`sub:canceled:${subscription.id}`,
								);
								if (!acquired) return;

								const userId = await findUserIdByCustomerOrEmail(
									subscription.customer?.externalId,
									subscription.customer?.email,
								);
								if (!userId) return;

								await setUserPlanTier(
									userId,
									"free",
									DEFAULT_FREE_STORAGE_BYTES,
								);
								await deleteCachedUserQuota(userId);
								console.log(
									`[Polar Webhook] Downgraded user ${userId} to Free plan (canceled).`,
								);
							}
						},
						onSubscriptionRevoked: async (payload) => {
							const subscription = payload.data;
							if (!subscription) return;

							const acquired = await acquireWebhookEventLock(
								`sub:revoked:${subscription.id}`,
							);
							if (!acquired) return;

							const userId = await findUserIdByCustomerOrEmail(
								subscription.customer?.externalId,
								subscription.customer?.email,
							);
							if (!userId) return;

							await setUserPlanTier(userId, "free", DEFAULT_FREE_STORAGE_BYTES);
							await deleteCachedUserQuota(userId);
							console.log(
								`[Polar Webhook] Revoked Pro plan for user ${userId} (downgraded to Free).`,
							);
						},
						onSubscriptionUncanceled: async (payload) => {
							const subscription = payload.data;
							if (!subscription) return;

							const acquired = await acquireWebhookEventLock(
								`sub:uncanceled:${subscription.id}`,
							);
							if (!acquired) return;

							const isProProduct =
								subscription.productId === env.POLAR_PRO_MONTHLY_PLAN_ID ||
								subscription.productId === env.POLAR_PRO_YEARLY_PLAN_ID;

							if (!isProProduct) return;

							const userId = await findUserIdByCustomerOrEmail(
								subscription.customer?.externalId,
								subscription.customer?.email,
							);
							if (!userId) return;

							await setUserPlanTier(userId, "pro", PRO_STORAGE_BYTES);
							await deleteCachedUserQuota(userId);
							console.log(
								`[Polar Webhook] Uncanceled / restored Pro plan for user ${userId}.`,
							);
						},
					}),
				],
			}),
		],
	});
}

export const auth = createAuth();
