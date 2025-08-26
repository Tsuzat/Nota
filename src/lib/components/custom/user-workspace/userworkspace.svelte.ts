import type { LocalUserWorkspace } from '$lib/local/userworkspaces.svelte';
import type { CloudUserWorkspace } from '$lib/supabase/db/clouduserworkspaces.svelte';
import { ISTAURI } from '$lib/utils';
import { getContext, setContext } from 'svelte';

class CurrentUserWorkspace {
	#userworkspace: LocalUserWorkspace | CloudUserWorkspace | null = $state(null);
	#isLocal: boolean = $state(ISTAURI);

	setCurrentUserWorkspace(userworkspace: LocalUserWorkspace | CloudUserWorkspace | null) {
		this.#userworkspace = userworkspace;
		this.#isLocal = userworkspace === null ? true : !('owner' in userworkspace);
	}

	getCurrentUserWorkspace() {
		return this.#userworkspace;
	}

	getIsLocal() {
		return this.#isLocal;
	}
}

const GLOBALCURRENTUSERWORKSPACEKEY = Symbol('GLOBALCURRENTUSERWORKSPACEKEY');

export const setCurrentUserWorkspaceContext = () => {
	return setContext(GLOBALCURRENTUSERWORKSPACEKEY, new CurrentUserWorkspace());
};

export const useCurrentUserWorkspaceContext = () => {
	return getContext<ReturnType<typeof setCurrentUserWorkspaceContext>>(
		GLOBALCURRENTUSERWORKSPACEKEY
	);
};
