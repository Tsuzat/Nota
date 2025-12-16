import { DODO_MODE, DODO_PAYMENT_API_KEY, DODO_PAYMENT_WEBHOOK_SECRET } from '$env/static/private';
import DodoPayments from 'dodopayments';

const getMode = () => {
  switch (DODO_MODE) {
    case 'live_mode':
      return 'live_mode';
    case 'test_mode':
      return 'test_mode';
    default:
      return 'test_mode';
  }
};

export const dodoClient = new DodoPayments({
  bearerToken: DODO_PAYMENT_API_KEY,
  webhookKey: DODO_PAYMENT_WEBHOOK_SECRET,
  environment: getMode(),
});
