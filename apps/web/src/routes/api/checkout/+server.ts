import type { User } from '@supabase/supabase-js';
import { json, redirect } from '@sveltejs/kit';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { dodoClient } from '$lib/dodopayments';
import { logerror } from '$lib/sentry/index.js';

export const GET = async ({ request, locals }) => {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (productId === null) {
    return json({ error: 'product_id is required' }, { status: 400 });
  }

  const { user }: { user: User | null } = await locals.safeGetSession();
  if (user === null) {
    return redirect(307, '/login');
  }

  const { data, error } = await locals.supabase.from('profile').select('external_customer_id').single();
  if (error) {
    logerror('Error when user was trying to get profile', { error, productId, userEmail: user.email });
    console.error(error);
    return json({ error: 'Error when user was trying to get profile' }, { status: 500 });
  }
  const userEmail = user.email;
  const customerId = String(data.external_customer_id);

  let checkOutURL = '';

  try {
    const session = await dodoClient.checkoutSessions.create({
      customer: userEmail ? { email: userEmail } : customerId ? { customer_id: customerId } : undefined,
      metadata: { nota_user_id: customerId },
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      return_url: PUBLIC_NOTA_FRONTEND_URL,
    });
    checkOutURL = session.checkout_url;
  } catch (err) {
    logerror('Error when user was trying to create checkout session', { err, productId, userEmail, customerId });
    console.error(err);
    return json({ error: 'Error when user was trying to create checkout session' }, { status: 500 });
  }
  return redirect(308, checkOutURL);
};
