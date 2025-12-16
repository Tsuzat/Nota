import { Webhooks } from '@dodopayments/sveltekit';
import { DODO_PAYMENT_WEBHOOK_SECRET } from '$env/static/private';
import { PUBLIC_NOTA_MONTLY_SUB, PUBLIC_NOTA_YEARLY_SUB } from '$env/static/public';
import { adminClient } from '$lib/supabase/admin';
import { logerror, loginfo } from '$lib/sentry';
import type { WebhookPayload } from 'dodopayments/resources';
import { dodoClient } from '$lib/dodopayments';

interface UserProfile {
  id: string;
  created_at: string;
  storage_used: number;
  storage_allotted: number;
  user_type: "free" | "pro";
  subscription_type: "monthtly" |"yearly" | null;
  payment_status: string | null;
  subscription_start_date: string | null;
  next_billing_date: string | null;
  payment_method_id: string | null;
  ai_credits: number;
  external_customer_id: string | null;
}


async function getUserIdFromPayload(customerId?: string, noteUserId?: string): Promise<UserProfile | null> {
  if (!customerId && !noteUserId) return null;

  try {
    const filters: string[] = [];
    if (noteUserId) filters.push(`id.eq.${noteUserId}`);
    if (customerId) filters.push(`external_customer_id.eq.${customerId}`);

    const { data, error } = await adminClient
      .from('profiles')
      .select('*')
      .or(filters.join(',')) 
      .maybeSingle();       

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

function getCreditsToAdd(productId: string | null): number {
  if (productId === PUBLIC_NOTA_MONTLY_SUB) return 5_000_000;
  if (productId === PUBLIC_NOTA_YEARLY_SUB) return 60_000_000;
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
    console.log("ON PAYMENT SUCCESS", JSON.stringify(payload));
    const user = await getUserIdFromPayload(data.customer.customer_id, data.metadata["nota_user_id"]);
    if (!user) {
      console.log('onPaymentSucceeded: user not found', JSON.stringify(payload));
      logerror('onPaymentSucceeded: user not found', { payload });
      return;
    }
    try {
    //## If there is a subscription_id, we need to update the user's profile
    if (data.subscription_id) {
    const subscriptionDetails = await dodoClient.subscriptions.retrieve(data.subscription_id);
    const productId = subscriptionDetails.product_id;
    const creditsToAdd = getCreditsToAdd(productId);
    const tier = getSubscriptionTier(productId); 
      const newCredits = user.ai_credits + creditsToAdd;
         const patch = {
        ai_credits: newCredits,
        subscription_tier: tier === 'pro' ? 'pro' : 'free',
        payment_status: 'active',
        next_billing_date: subscriptionDetails.next_billing_date,
        payment_method_id: subscriptionDetails.payment_method_id,
        subscription_type: productId === PUBLIC_NOTA_MONTLY_SUB ? 'monthly' : (productId === PUBLIC_NOTA_YEARLY_SUB ? 'yearly' : null)
      };
      const { error } = await adminClient.from('profiles').update(patch).eq('id', user.id);
      if (error) throw error;
      else return;
    }

    //!! may be later
    if (data.product_cart){

    }
    
    } catch (e) {
      console.error('onPaymentSucceeded failed', { e, userId: user.id });
      logerror('onPaymentSucceeded failed', { e, userId: user.id });
    }
  },

  onSubscriptionActive: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Subscription;
    console.log("ON SUBSCRIPTION ACTIVE", JSON.stringify(payload));
    const user = await getUserIdFromPayload(data.customer.customer_id, data.metadata["nota_user_id"]);
    if (!user) {
      console.log('onSubscriptionActive: user not found', JSON.stringify(payload));
      logerror('onSubscriptionActive: user not found', { payload });
      return;
    }

    const productId = data.product_id;
    const tier = getSubscriptionTier(productId);

    try {
      // Just update status, don't add credits here (handled in payment succeeded)
      const patch = {
        subscription_tier: tier === 'pro' ? 'pro' : 'free',
        payment_status: data.status,
        next_billing_date: data.next_billing_date,
        payment_method_id: data.payment_method_id,
        subscription_type: productId === PUBLIC_NOTA_MONTLY_SUB ? 'monthly' : (productId === PUBLIC_NOTA_YEARLY_SUB ? 'yearly' : null)
      };

      const { error } = await adminClient.from('profiles').update(patch).eq('id', user.id);
      if (error) throw error;

      console.log('onSubscriptionActive: payload', payload);
      loginfo('onSubscriptionActive: profile updated', { userId: user.id });
    } catch (e) {
      console.error('onSubscriptionActive failed', { e, userId: user.id });
      logerror('onSubscriptionActive failed', { e, userId: user.id });
    }
  },

  onSubscriptionCancelled: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Subscription;
    const userId = await getUserIdFromPayload(data.customer.customer_id, data.metadata["nota_user_id"]);
    if (!userId) return;

    try {
      const patch = {
        subscription_tier: 'free',
        payment_status: 'canceled',
        next_billing_date: null
      };

      const { error } = await adminClient.from('profiles').update(patch).eq('id', userId);
      if (error) throw error;

      console.log('onSubscriptionCancelled: payload', payload);
      loginfo('onSubscriptionCancelled: profile set to free', { userId });
    } catch (e) {
      console.error('onSubscriptionCancelled failed', { e, userId });
      logerror('onSubscriptionCancelled failed', { e, userId });
    }
  },

  onSubscriptionExpired: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Subscription;
    const userId = await getUserIdFromPayload(data.customer.customer_id, data.metadata["nota_user_id"]);
    if (!userId) return;

    try {
      const patch = {
        subscription_tier: 'free',
        payment_status: 'failed',
        next_billing_date: null
      };

      const { error } = await adminClient.from('profiles').update(patch).eq('id', userId);
      if (error) throw error;
      
      console.log('onSubscriptionExpired: payload', payload);
      loginfo('onSubscriptionExpired: profile set to free', { userId });
    } catch (e) {
      console.error('onSubscriptionExpired failed', { e, userId });
      logerror('onSubscriptionExpired failed', { e, userId });
    }
  },
  
  onPaymentFailed: async (payload: WebhookPayload) => {
    const data = payload.data as WebhookPayload.Payment;
    const userId = await getUserIdFromPayload(data.customer.customer_id, data.metadata["nota_user_id"]);
    if (!userId) return;
    console.log('onPaymentFailed: payload', payload);
    loginfo('onPaymentFailed', { userId, payload });
  }
});
