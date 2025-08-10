import { PUBLIC_SUPABASE_API_KEY, PUBLIC_SUPABASE_ENDPOINT } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = PUBLIC_SUPABASE_ENDPOINT;
const supabaseKey = PUBLIC_SUPABASE_API_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		flowType: 'pkce',
		detectSessionInUrl: true,
		autoRefreshToken: true
	}
});

export const auth = supabase.auth;
