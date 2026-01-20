import { checkout, polar, portal, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { eq, sql } from 'drizzle-orm';
import {
  BACKEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  POLAR_AI_CREDITS,
  POLAR_API_KEY,
  POLAR_MONTLY_SUB,
  POLAR_SERVER,
  POLAR_SUCCESS_URL,
  POLAR_WEBHOOK_SECRET,
  POLAR_YEARLY_SUB,
} from './constants';
import { DB } from './db';
import { user } from './db/schema';
import { logerror } from './logging';

// Helpers
function getCreditsToAdd(productId: string): number {
  if (productId === POLAR_MONTLY_SUB) return 2_000_000;
  if (productId === POLAR_YEARLY_SUB) return 25_000_000;
  if (productId === POLAR_AI_CREDITS) return 5_000_000;
  return 0;
}

function getStorageToAdd(productId: string): number {
  if (productId === POLAR_MONTLY_SUB) return 1_000_000_000;
  if (productId === POLAR_YEARLY_SUB) return 1_500_000_000;
  return 0;
}

function getSubscriptionTier(productId: string): 'pro' | 'free' {
  if (productId === POLAR_MONTLY_SUB || productId === POLAR_YEARLY_SUB) return 'pro';
  return 'free';
}

function getSubscriptionTime(productId: string): 'monthly' | 'yearly' {
  if (productId === POLAR_MONTLY_SUB) return 'monthly';
  if (productId === POLAR_YEARLY_SUB) return 'yearly';
  return 'monthly';
}

const polarClient = new Polar({
  accessToken: POLAR_API_KEY,
  server: POLAR_SERVER,
});

export const auth = betterAuth({
  baseURL: BACKEND_URL,
  database: drizzleAdapter(DB, {
    provider: 'pg',
  }),
  socialProviders: {
    github: {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    bearer(),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: POLAR_AI_CREDITS,
              slug: 'ai-credits',
            },
            {
              productId: POLAR_MONTLY_SUB,
              slug: 'monthly',
            },
            {
              productId: POLAR_YEARLY_SUB,
              slug: 'yearly',
            },
          ],
          successUrl: POLAR_SUCCESS_URL,
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: POLAR_WEBHOOK_SECRET,
          onSubscriptionActive: async (payload) => {
            const userId = payload.data.customer.externalId;
            if (!userId) {
              logerror('Customer ID not found in webhook payload', {
                ...payload,
              });
              return;
            }
            const productId = payload.data.productId;
            const creditsToAdd = getCreditsToAdd(productId);
            const storageToAdd = getStorageToAdd(productId);
            const subscriptionTier = getSubscriptionTier(productId);
            const subscriptionTime = getSubscriptionTime(productId);
            await DB.update(user)
              .set({
                aiCredits: sql`${user.aiCredits} + ${creditsToAdd}`,
                assignedStorage: sql`${storageToAdd}`,
                subscriptionPlan: subscriptionTier,
                subscriptionType: subscriptionTime,
              })
              .where(eq(user.id, userId));
          },
          onSubscriptionCanceled: async (payload) => {
            const userId = payload.data.customer.externalId;
            if (!userId) {
              logerror('Customer ID not found in webhook payload', {
                ...payload,
              });
              return;
            }
            await DB.update(user)
              .set({
                aiCredits: 0,
                assignedStorage: 0,
                subscriptionPlan: 'free',
                subscriptionType: null,
              })
              .where(eq(user.id, userId));
          },
          onSubscriptionUpdated: async (payload) => {
            const userId = payload.data.customer.externalId;
            if (!userId) {
              logerror('Customer ID not found in webhook payload', {
                ...payload,
              });
              return;
            }
            const productId = payload.data.productId;
            const creditsToAdd = getCreditsToAdd(productId);
            const storageToAdd = getStorageToAdd(productId);
            const subscriptionTier = getSubscriptionTier(productId);
            const subscriptionTime = getSubscriptionTime(productId);
            await DB.update(user)
              .set({
                aiCredits: sql`${user.aiCredits} + ${creditsToAdd}`,
                assignedStorage: sql`${storageToAdd}`,
                subscriptionPlan: subscriptionTier,
                subscriptionType: subscriptionTime,
              })
              .where(eq(user.id, userId));
          },
        }),
      ],
    }),
  ],
});
