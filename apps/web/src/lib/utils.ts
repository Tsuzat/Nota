import { request } from '@nota/client';
import { goto, invalidateAll } from '$app/navigation';
import { resolve } from '$app/paths';
import {
  PUBLIC_BACKEND_URL,
  PUBLIC_DODO_AI_CREDITS,
  PUBLIC_DODO_MONTLY_SUB,
  PUBLIC_DODO_YEARLY_SUB,
} from '$env/static/public';

export const sendToPaymentPortal = (which: 'monthly' | 'yearly' | 'ai_credits', productQuantity = 1) => {
  let productId = '';
  let quantity = productQuantity;
  switch (which) {
    case 'monthly':
      productId = PUBLIC_DODO_MONTLY_SUB;
      break;
    case 'yearly':
      productId = PUBLIC_DODO_YEARLY_SUB;
      break;
    case 'ai_credits':
      productId = PUBLIC_DODO_AI_CREDITS;
      break;
    default:
      throw new Error('Invalid subscription type');
  }
  if (quantity && which !== 'ai_credits') {
    quantity = 1;
  }
  const url = `${PUBLIC_BACKEND_URL}/api/payment/checkout?productId=${productId}&quantity=${quantity}`;
  window.location.href = url;
};

export const logout = async () => {
  await request(`${PUBLIC_BACKEND_URL}/api/auth/logout`);
  await invalidateAll();
  return goto(resolve('/'));
};
