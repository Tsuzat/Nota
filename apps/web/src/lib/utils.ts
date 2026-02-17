import type { User } from '@nota/client';
import {
  PUBLIC_BACKEND_URL,
  PUBLIC_POLAR_AI_CREDITS,
  PUBLIC_POLAR_MONTLY_SUB,
  PUBLIC_POLAR_YEARLY_SUB,
} from '$env/static/public';

export const sendToPaymentPortal = (which: 'monthly' | 'yearly' | 'ai_credits', user: User) => {
  let productId = '';
  switch (which) {
    case 'monthly':
      productId = PUBLIC_POLAR_MONTLY_SUB;
      break;
    case 'yearly':
      productId = PUBLIC_POLAR_YEARLY_SUB;
      break;
    case 'ai_credits':
      productId = PUBLIC_POLAR_AI_CREDITS;
      break;
    default:
      throw new Error('Invalid subscription type');
  }
  const url = `${PUBLIC_BACKEND_URL}/api/v1/payments/checkout?productId=${productId}&customerExternalId=${user.id}&customerEmail=${user.email}&customerName=${user.name}`;
  window.location.href = url;
};
