import { DEFAULT_SETTINGS } from '$lib/types';

export const load = async ({ params }) => {
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
