// import { adminClient } from '$lib/supabase/admin';
import { dodoClient } from '$lib/dodopayments';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { logerror } from '$lib/sentry/index.js';
import { json, redirect } from '@sveltejs/kit';


export const GET = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');
  const userEmail = searchParams.get('user_email');
  const customerId = searchParams.get('external_user_id');
  if (productId === null || userEmail === null || customerId === null) {
    return json({ error: 'product_id, user_email, and external_user_id are required' }, { status: 400 });
  }
 
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
