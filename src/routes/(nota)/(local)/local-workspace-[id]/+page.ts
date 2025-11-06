import { ISTAURI } from '$lib/utils';
import { toast } from 'svelte-sonner';
import type { PageLoad } from './$types';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { DEFAULT_SETTINGS } from '$lib/types';

export const load: PageLoad = async ({ params }) => {
	if (!ISTAURI) {
		toast.warning('Can not load a local workspace in browser');
		goto(resolve('/home'));
		return;
	}

	let settings = DEFAULT_SETTINGS;
	try {
		const pageSettings = localStorage.getItem('pageSettings');
		if (pageSettings) {
			settings = JSON.parse(pageSettings);
		} else {
			localStorage.setItem('pageSettings', JSON.stringify(DEFAULT_SETTINGS));
		}
	} catch (error) {
		console.log(error);
		localStorage.setItem('pageSettings', JSON.stringify(DEFAULT_SETTINGS));
	}

	return {
		id: params.id,
		settings
	};
};
