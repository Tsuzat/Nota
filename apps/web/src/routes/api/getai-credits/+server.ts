import { redirect } from '@sveltejs/kit';
import { adminClient } from '$lib/supabase/admin/index.js';

export const GET = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) {
    throw redirect(302, '/login');
  }
  await adminClient
    .from('profiles')
    .update({ ai_credit: 5000 })
    .eq('user_id', user.id)
    .is('promotional_ai_credits', false);

  return redirect(302, '/');
};
