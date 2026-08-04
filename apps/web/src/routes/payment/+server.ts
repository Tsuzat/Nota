import { redirect } from '@sveltejs/kit';
import { POLAR_AI_CREDIT, POLAR_MONTLY_SUB, POLAR_YEARLY_SUB } from '$env/static/private';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

export const GET = ({ url, locals: { user } }) => {
  if (user === null) {
    throw redirect(303, '/signin');
  }
  const type = url.searchParams.get('type');
  let productId = '';

  if (type === 'monthly') {
    productId = POLAR_MONTLY_SUB;
  } else if (type === 'credits') {
    productId = POLAR_AI_CREDIT;
  } else {
    productId = POLAR_YEARLY_SUB;
  }

  const sendTo = `${PUBLIC_BACKEND_URL}/api/v1/payments/checkout?productId=${productId}`;
  return redirect(303, sendTo);
};
