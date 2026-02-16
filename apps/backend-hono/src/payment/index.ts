import DodoPayments from 'dodopayments';
import { DODO_API_KEY, DODO_MODE, DODO_WEBHOOK_SECRET } from '../constants';

export const dodoClient = new DodoPayments({
  bearerToken: DODO_API_KEY,
  environment: DODO_MODE,
  webhookKey: DODO_WEBHOOK_SECRET,
});
