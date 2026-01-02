import { PUBLIC_BACKEND_URL, PUBLIC_DODO_AI_CREDITS, PUBLIC_DODO_MONTLY_SUB, PUBLIC_DODO_YEARLY_SUB } from "$env/static/public";
import request from "./request";

export const sendToPaymentPortal = (which: 'monthly' | 'yearly' | 'ai_credits', quantity: number = 1) => {
  let productId = '';
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
  if (quantity && which === 'ai_credits') {
    quantity = 1;
  }
  const url = `${PUBLIC_BACKEND_URL}/api/payment/checkout?productId=${productId}&quantity=${quantity}`;
  request(url);
};
