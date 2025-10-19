import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { goto } from '$app/navigation';
import { auth } from './supabase';
import { toast } from 'svelte-sonner';
import { resolve } from '$app/paths';

export function useDeepLinkAuth() {
	const handleUrl = async (urls: string[]) => {
		const id = toast.loading('processing your request', {
			description: 'this may take a moment',
			duration: 10000
		});
		try {
			const url = urls[0];

			const urlObj = new URL(url);
			const searchParams = new URLSearchParams(urlObj.search.substring(1));

			const code = searchParams.get('code');
			if (code) {
				const { data, error } = await auth.exchangeCodeForSession(code);
				if (error) throw error;
				if (data.session) goto(resolve('/home'));
				return;
			}
		} catch (err) {
			console.error('Error handling deep link:', err);
			toast.error('Something went wrong', { id });
		} finally {
			toast.dismiss(id);
		}
	};
	onOpenUrl(handleUrl);
}
