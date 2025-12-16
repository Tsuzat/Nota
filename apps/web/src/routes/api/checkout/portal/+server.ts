import { dodoClient } from '$lib/dodopayments';
import { redirect } from '@sveltejs/kit';

export const GET = async({request}) => {
    const { searchParams } = new URL(request.url);
    const external_user_id = searchParams.get('external_user_id');
    if (!external_user_id) {
      return new Response('external_user_id is required', { status: 400 });
    }
    const customerPortal = await dodoClient.customers.customerPortal.create(external_user_id);
    return redirect(307,customerPortal.link)
}