import { SUPABASE_ADMIN_API_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_ENDPOINT } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export const adminClient = createClient(PUBLIC_SUPABASE_ENDPOINT, SUPABASE_ADMIN_API_KEY);
