import { Webhooks } from '@dodopayments/sveltekit';
import type { WebhookPayload } from 'dodopayments/resources';
import { DODO_PAYMENT_WEBHOOK_SECRET } from '$env/static/private';
import { PUBLIC_NOTA_AI_CREDITS, PUBLIC_NOTA_MONTLY_SUB, PUBLIC_NOTA_YEARLY_SUB } from '$env/static/public';
import { logerror, loginfo } from '$lib/sentry';
import { adminClient } from '$lib/supabase/admin';
import type { UserProfile } from '$lib/types';

async function getUserIdFromPayload(customerId?: string, notaUserId?: string): Promise<UserProfile | null> {
  if (!customerId && !notaUserId) return null;

  try {
    const filters: string[] = [];
    if (notaUserId) filters.push(`id.eq.${notaUserId}`);
    if (customerId) filters.push(`external_customer_id.eq.${customerId}`);

    const { data, error } = await adminClient.from('profiles').select('*').or(filters.join(',')).maybeSingle();

    if (error) {
      console.error('getUserIdFromPayload query error:', error);
      return null;
    }

    return data as UserProfile | null;
  } catch (e) {
    console.error('getUserIdFromPayload failed', { e });
    return null;
  }
}

//! MAY BE ADD ENV VARIABLE FOR CREDITS AMOUNT
function getCreditsToAdd(productId: string | null): number {
  if (productId === PUBLIC_NOTA_MONTLY_SUB) return 2_000_000;
  if (productId === PUBLIC_NOTA_YEARLY_SUB) return 25_000_000;
  if (productId === PUBLIC_NOTA_AI_CREDITS) return 5_000_000;
  return 0;
}

function getSubscriptionTier(productId: string | null): 'pro' | 'free' {
  if (productId === PUBLIC_NOTA_MONTLY_SUB || productId === PUBLIC_NOTA_YEARLY_SUB) return 'pro';
  return 'free';
}

export const POST = Webhooks({
  webhookKey: DODO_PAYMENT_WEBHOOK_SECRET,

  onPaymentSucceeded: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Payment;
    const user = await getUserIdFromPayload(data.customer.customer_id, data.metadata.nota_user_id);
    console.log('onPaymentSucceeded: payload', JSON.stringify(payload));
    if (!user) {
      console.log('onPaymentSucceeded: user not found', JSON.stringify(payload));
      logerror('onPaymentSucceeded: user not found', { payload });
      return;
    }
    try {
      //## If there is a subscription_id, we delegate to onSubscriptionActive
      if (data.subscription_id) {
        loginfo('onPaymentSucceeded: subscription payment, handled in onSubscriptionActive', {
          subscriptionId: data.subscription_id,
        });
        console.log('onPaymentSucceeded: subscription payment, handled in onSubscriptionActive', {
          subscriptionId: data.subscription_id,
        });
        return;
      }

      if (data.product_cart) {
        const creditsToAdd = data.product_cart.reduce(
          (acc, item) => acc + getCreditsToAdd(item.product_id) * item.quantity,
          0
        );
        const { error } = await adminClient
          .from('profiles')
          .update({ ai_credits: user.ai_credits + creditsToAdd })
          .eq('id', user.id);
        if (error) throw error;
        console.log('onPaymentSucceeded: ai credits updated', { userId: user.id, creditsToAdd });
        loginfo('onPaymentSucceeded: ai credits updated', { userId: user.id, creditsToAdd });
      }
    } catch (e) {
      console.error('onPaymentSucceeded failed', { e, userId: user.id });
      logerror('onPaymentSucceeded failed', { e, userId: user.id });
    }
  },

  onSubscriptionActive: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Subscription;
    console.log('ON SUBSCRIPTION ACTIVE', JSON.stringify(payload));
    const user = await getUserIdFromPayload(data.customer.customer_id, data.metadata.nota_user_id);
    if (!user) {
      console.log('onSubscriptionActive: user not found', JSON.stringify(payload));
      logerror('onSubscriptionActive: user not found', { payload });
      return;
    }

    const productId = data.product_id;
    const tier = getSubscriptionTier(productId);
    const creditsToAdd = getCreditsToAdd(productId);

    try {
      const newCredits = user.ai_credits + creditsToAdd;
      const patch = {
        ai_credits: newCredits,
        subscription_tier: tier === 'pro' ? 'pro' : 'free',
        payment_status: data.status,
        next_billing_date: data.next_billing_date,
        payment_method_id: data.payment_method_id,
        external_customer_id: data.customer.customer_id,
        subscription_type:
          productId === PUBLIC_NOTA_MONTLY_SUB ? 'monthly' : productId === PUBLIC_NOTA_YEARLY_SUB ? 'yearly' : null,
      };

      const { error } = await adminClient.from('profiles').update(patch).eq('id', user.id);
      if (error) throw error;
      loginfo('onSubscriptionActive: profile updated', { userId: user.id });
    } catch (e) {
      console.error('onSubscriptionActive failed', { e, userId: user.id });
      logerror('onSubscriptionActive failed', { e, userId: user.id });
    }
  },

  onSubscriptionCancelled: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Subscription;
    const user = await getUserIdFromPayload(data.customer.customer_id, data.metadata.nota_user_id);
    if (!user) return;

    try {
      const patch = {
        subscription_tier: 'free',
        payment_status: 'canceled',
        next_billing_date: null,
      };

      const { error } = await adminClient.from('profiles').update(patch).eq('id', user.id);
      if (error) throw error;

      console.log('onSubscriptionCancelled: payload', payload);
      loginfo('onSubscriptionCancelled: profile set to free', { userId: user.id });
    } catch (e) {
      console.error('onSubscriptionCancelled failed', { e, userId: user.id });
      logerror('onSubscriptionCancelled failed', { e, userId: user.id });
    }
  },

  onSubscriptionExpired: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Subscription;
    const user = await getUserIdFromPayload(data.customer.customer_id, data.metadata.nota_user_id);
    if (!user) return;

    try {
      const patch = {
        subscription_tier: 'free',
        payment_status: 'failed',
        next_billing_date: null,
      };

      const { error } = await adminClient.from('profiles').update(patch).eq('id', user.id);
      if (error) throw error;

      console.log('onSubscriptionExpired: payload', payload);
      loginfo('onSubscriptionExpired: profile set to free', { userId: user.id });
    } catch (e) {
      console.error('onSubscriptionExpired failed', { e, userId: user.id });
      logerror('onSubscriptionExpired failed', { e, userId: user.id });
    }
  },

  onPaymentFailed: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Payment;
    const user = await getUserIdFromPayload(data.customer.customer_id, data.metadata.nota_user_id);
    if (!user) return;
    console.log('onPaymentFailed: payload', payload);
    loginfo('onPaymentFailed', { userId: user.id, payload });
  },
});
