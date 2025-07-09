import { initializeLocalDB } from '$lib/local/db';
import { ISTAURI } from '$lib/utils';

const init = async () => {
	if (ISTAURI) {
		await initializeLocalDB();
	}
};

init();
