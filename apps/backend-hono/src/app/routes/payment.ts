import { Checkout, CustomerPortal, Webhooks } from '@polar-sh/hono';
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import {
  FRONTEND_URL,
  POLAR_AI_CREDITS,
  POLAR_API_KEY,
  POLAR_MONTLY_SUB,
  POLAR_SERVER,
  POLAR_SUCCESS_URL,
  POLAR_WEBHOOK_SECRET,
  POLAR_YEARLY_SUB,
} from '../../constants';
import { DB } from '../../db';
import { users } from '../../db/schema';
import type { Variables } from '..';
import { authMiddleware } from '../middlewares/auth';

const app = new Hono<{ Variables: Variables }>();

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

// 1. Checkout Endpoint
app.get(
  '/checkout',
  authMiddleware,
  Checkout({
    accessToken: POLAR_API_KEY,
    successUrl: POLAR_SUCCESS_URL,
    returnUrl: FRONTEND_URL,
    server: POLAR_SERVER,
    theme: 'dark',
  })
);

// 2. Portal Endpoint
app.get(
  '/portal',
  authMiddleware,
  CustomerPortal({
    accessToken: POLAR_API_KEY,
    getCustomerId: (event) => {
      const user = event.get('user');
      return user.externalCustomerId || '';
    },
    returnUrl: FRONTEND_URL,
    server: POLAR_SERVER,
  })
);

// 3. Webhook Endpoint
// NOTE: This endpoint is NOT protected by authMiddleware
app.post(
  '/hooks',
  Webhooks({
    webhookSecret: POLAR_WEBHOOK_SECRET,
    onSubscriptionActive: async (payload) => {
      const email = payload.data.customer.email;
      const productId = payload.data.productId;
      const creditsToAdd = getCreditsToAdd(productId);
      const storageToAdd = getStorageToAdd(productId);
      await DB.update(users)
        .set({
          aiCredits: sql`${users.aiCredits} + ${creditsToAdd}`,
          assignedStorage: sql`${storageToAdd}`,
          subscriptionPlan: getSubscriptionTier(productId),
          subscriptionType: getSubscriptionTime(productId),
          externalCustomerId: payload.data.customerId,
        })
        .where(eq(users.email, email));
    },
    onSubscriptionCanceled: async (payload) => {
      const email = payload.data.customer.email;
      await DB.update(users)
        .set({
          assignedStorage: 0,
          subscriptionPlan: 'free',
          subscriptionType: null,
        })
        .where(eq(users.email, email));
    },
    onSubscriptionUpdated: async (payload) => {
      const email = payload.data.customer.email;
      const productId = payload.data.productId;
      const creditsToAdd = getCreditsToAdd(productId);
      const storageToAdd = getStorageToAdd(productId);
      await DB.update(users)
        .set({
          aiCredits: sql`${users.aiCredits} + ${creditsToAdd}`,
          assignedStorage: sql`${storageToAdd}`,
          subscriptionPlan: getSubscriptionTier(productId),
          subscriptionType: getSubscriptionTime(productId),
        })
        .where(eq(users.email, email));
    },
  })
);

export default app;
