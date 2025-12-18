import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { PUBLIC_NOTA_AI_CREDITS, PUBLIC_NOTA_MONTLY_SUB, PUBLIC_NOTA_YEARLY_SUB } from '$env/static/public';

export const sendToPaymentPortal = (which: 'monthly' | 'yearly' | 'ai_credits') => {
  let productId = '';
  switch (which) {
    case 'monthly':
      productId = PUBLIC_NOTA_MONTLY_SUB;
      break;
    case 'yearly':
      productId = PUBLIC_NOTA_YEARLY_SUB;
      break;
    case 'ai_credits':
      productId = PUBLIC_NOTA_AI_CREDITS;
      break;
    default:
      throw new Error('Invalid subscription type');
  }
  goto(resolve(`/api/checkout?product_id=${productId}${which === 'ai_credits' ? '&quantity=1' : ''}`));
};
