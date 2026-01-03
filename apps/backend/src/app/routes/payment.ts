import type { WebhookPayload } from 'dodopayments/resources';
import { eq, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { Webhook } from 'standardwebhooks';
import { DODO_AI_CREDITS, DODO_MONTLY_SUB, DODO_WEBHOOK_SECRET, DODO_YEARLY_SUB, FRONTEND_URL } from '../../constants';
import { DB } from '../../db';
import { users } from '../../db/schema';
import { logerror, loginfo, logwarn } from '../../logging';
import { dodoClient } from '../../payment';
import type { Variables } from '..';
import { authMiddleware } from '../middlewares/auth';

const app = new Hono<{ Variables: Variables }>();

// Helpers
function getCreditsToAdd(productId: string | null): number {
  if (productId === DODO_MONTLY_SUB) return 2_000_000;
  if (productId === DODO_YEARLY_SUB) return 25_000_000;
  if (productId === DODO_AI_CREDITS) return 5_000_000;
  return 0;
}

function getStorageToAdd(productId: string | null): number {
  if (productId === DODO_MONTLY_SUB) return 1_000_000_000;
  if (productId === DODO_YEARLY_SUB) return 1_500_000_000;
  return 0;
}

function getSubscriptionTier(productId: string | null): 'pro' | 'free' {
  if (productId === DODO_MONTLY_SUB || productId === DODO_YEARLY_SUB) return 'pro';
  return 'free';
}

const processedWebhooks = new Set<string>();

// 1. Checkout Endpoint
app.get('/checkout', authMiddleware, async (c) => {
  const user = c.get('user');
  const userEmail = c.get('userEmail');
  const userId = c.get('userId');
  const { productId, quantity } = c.req.query();

  if (!productId || !quantity) {
    return c.json({ error: 'Product ID and quantity are required' }, 400);
  }

  try {
    const subscriptionTier = user.subscriptionPlan;
    const customerId = user.externalCustomerId;
    const isSubscriptionProduct = getSubscriptionTier(productId) === 'pro';

    // If user is already pro and trying to buy subscription again, redirect to portal (or inform)
    if (subscriptionTier === 'pro' && isSubscriptionProduct) {
      // Create portal link
      if (customerId) {
        const portal = await dodoClient.customers.customerPortal.create(customerId);
        return c.redirect(portal.link, 303);
      }
      return c.json({ error: 'User is already Pro but no customer ID found.' }, 400);
    }

    const session = await dodoClient.checkoutSessions.create({
      customer: customerId ? { customer_id: customerId } : userEmail ? { email: userEmail } : undefined,
      metadata: { nota_user_id: userId },
      product_cart: [
        {
          product_id: productId,
          quantity: Number.parseInt(quantity, 10),
        },
      ],
      return_url: FRONTEND_URL,
    });
    if (!session.checkout_url) {
      return c.json({ error: 'Failed to create checkout session' }, 500);
    }
    return c.redirect(session.checkout_url, 303);
  } catch (error) {
    logerror('Checkout error:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

// 2. Portal Endpoint
app.get('/portal', authMiddleware, async (c) => {
  const user = c.get('user');
  try {
    if (!user.externalCustomerId) {
      return c.json({ error: 'No billing account found' }, 404);
    }
    const portal = await dodoClient.customers.customerPortal.create(user.externalCustomerId);
    return c.redirect(portal.link, 303);
  } catch (error) {
    logerror('Portal error:', error);
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

// 3. Webhook Endpoint
// NOTE: This endpoint is NOT protected by authMiddleware
app.post('/hooks', async (c) => {
  const webhookId = c.req.header('webhook-id');
  const webhookSignature = c.req.header('webhook-signature');
  const webhookTimestamp = c.req.header('webhook-timestamp');

  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  if (processedWebhooks.has(webhookId)) {
    return c.json({ received: true }, 200);
  }

  let payload: WebhookPayload;

  try {
    const rawBody = await c.req.text();
    const headers = {
      'webhook-id': webhookId,
      'webhook-signature': webhookSignature,
      'webhook-timestamp': webhookTimestamp,
    };
    const wh = new Webhook(DODO_WEBHOOK_SECRET);
    // standardwebhooks verify expects headers object
    payload = wh.verify(rawBody, headers) as WebhookPayload;

    // Mark as processed only after successful verification
    processedWebhooks.add(webhookId);
  } catch (e) {
    logerror('Webhook Verification Failed:', e);
    return c.json({ error: 'Invalid Signature' }, 401);
  }

  const { type } = payload;
  loginfo(`Received webhook: ${type}`);

  try {
    switch (type) {
      case 'payment.succeeded': {
        const data = payload.data as WebhookPayload.Payment;
        const customerId = data.customer.customer_id;
        const notaUserId = data.metadata.nota_user_id;
        const query = notaUserId
          ? or(eq(users.externalCustomerId, customerId), eq(users.id, notaUserId))
          : eq(users.externalCustomerId, customerId);
        const user = await DB.query.users.findFirst({ where: query });

        if (!user) {
          logwarn('Webhook: User not found', { customerId, notaUserId });
          return c.json({ received: true });
        }
        // If it's a subscription payment, we might skip logic here if 'subscription.active' handles it,
        // OR we handle one-time credits here.
        if (data.subscription_id) {
          loginfo('Skipping payment.succeeded for subscription');
          break;
        }

        if (data.product_cart) {
          const creditsToAdd = data.product_cart.reduce(
            (acc: number, item: any) => acc + getCreditsToAdd(item.product_id) * item.quantity,
            0
          );
          if (creditsToAdd > 0) {
            await DB.update(users)
              .set({ aiCredits: sql`${users.aiCredits} + ${creditsToAdd}` })
              .where(eq(users.id, user.id));
            loginfo(`Added ${creditsToAdd} credits to user ${user.id}`);
          }
        }
        break;
      }

      case 'subscription.active': {
        const data = payload.data as WebhookPayload.Subscription;
        const customerId = data.customer?.customer_id;
        const notaUserId = data.metadata?.nota_user_id;
        const query = notaUserId
          ? or(eq(users.externalCustomerId, customerId), eq(users.id, notaUserId))
          : eq(users.externalCustomerId, customerId);
        const user = await DB.query.users.findFirst({ where: query });

        if (!user) {
          logwarn('Webhook: User not found', { customerId, notaUserId });
          return c.json({ received: true });
        }
        const productId = data.product_id;
        const tier = getSubscriptionTier(productId);
        const creditsToAdd = getCreditsToAdd(productId);
        const storageToAdd = getStorageToAdd(productId);
        const subscriptionType =
          productId === DODO_MONTLY_SUB ? 'monthly' : productId === DODO_YEARLY_SUB ? 'yearly' : null;

        await DB.update(users)
          .set({
            aiCredits: sql`${users.aiCredits} + ${creditsToAdd}`,
            assignedStorage: storageToAdd,
            subscriptionPlan: tier,
            subscriptionType: subscriptionType as 'monthly' | 'yearly' | null,
            externalCustomerId: data.customer.customer_id,
            nextBillingAt: data.next_billing_date ? new Date(data.next_billing_date) : null,
          })
          .where(eq(users.id, user.id));
        loginfo(`Activated subscription for user ${user.id}`);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const data = payload.data as WebhookPayload.Subscription;
        const customerId = data.customer?.customer_id;
        const notaUserId = data.metadata?.nota_user_id;
        const query = notaUserId
          ? or(eq(users.externalCustomerId, customerId), eq(users.id, notaUserId))
          : eq(users.externalCustomerId, customerId);
        const user = await DB.query.users.findFirst({ where: query });

        if (!user) {
          logwarn('Webhook: User not found', { customerId, notaUserId });
          return c.json({ received: true });
        }
        await DB.update(users)
          .set({
            subscriptionPlan: 'free',
            assignedStorage: 0,
            subscriptionType: null,
            nextBillingAt: null,
          })
          .where(eq(users.id, user.id));
        loginfo(`Subscription ended for user ${user.id}`);
        break;
      }
      case 'payment.failed': {
        loginfo('Payment failed for user. Payload = ', payload);
        break;
      }
    }
    return c.json({ received: true });
  } catch (err) {
    logerror('Webhook processing error:', err);
    return c.json({ error: 'Webhook handler failed' }, 500);
  }
});

export default app;
