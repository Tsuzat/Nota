import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { auth } from './supabase';

export function useDeepLinkAuth() {
	let isHandlingAuth = $state(false);

	$effect(() => {
		if (!browser) return;

		// Check URL parameters immediately
		const urlObj = new URL(window.location.href);
		const searchParams = new URLSearchParams(urlObj.search);
		const code = searchParams.get('code');

		if (code) {
			isHandlingAuth = true;
		}

		const handleUrl = async (urls: string[]) => {
			try {
				isHandlingAuth = true;
				const url = urls[0];

				const urlObj = new URL(url);
				const searchParams = new URLSearchParams(urlObj.search.substring(1));

				const code = searchParams.get('code');
				if (code) {
					const { data, error } = await auth.exchangeCodeForSession(code);
					if (error) throw error;
					if (data.session) goto('/');
					return;
				}
			} catch (err) {
				console.error('Error handling deep link:', err);
			} finally {
				isHandlingAuth = false;
			}
		};

		onOpenUrl(handleUrl);
	});

	return {
		get isHandlingAuth() {
			return isHandlingAuth;
		}
	};
}
