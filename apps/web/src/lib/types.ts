export interface UserProfile {
  id: string;
  created_at: string;
  storage_used: number;
  storage_allotted: number;
  subscription_tier: 'free' | 'pro';
  subscription_type: 'monthtly' | 'yearly' | null;
  payment_status: string | null;
  subscription_start_date: string | null;
  next_billing_date: string | null;
  payment_method_id: string | null;
  ai_credits: number;
  external_customer_id: string | null;
}
