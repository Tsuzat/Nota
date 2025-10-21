import { PUBLIC_SUPABASE_API_ENDURL } from '$env/static/public';
import { fetch } from '@tauri-apps/plugin-http';

export async function callAI(prompt: string, token: string) {
	const res = await fetch(PUBLIC_SUPABASE_API_ENDURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ prompt })
	});
	const data = await res.json();
	if (res.ok) {
		return data.text;
	} else {
		throw new Error('Somthing went wrong when calling AI');
	}
}
