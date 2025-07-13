import { ISTAURI } from '$lib/utils';
import { toast } from 'svelte-sonner';
import type { PageLoad } from './$types';
import { goto } from '$app/navigation';

export const load: PageLoad = ({ params }) => {
	if (!ISTAURI) {
		toast.warning('Can not load a local note in browser');
		goto('/home');
	}
	const { id } = params;

	return {
		id
	};
};
