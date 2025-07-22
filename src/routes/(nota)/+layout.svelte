<script lang="ts">
	import { goto } from '$app/navigation';
	import { GlobalSearch, setGlobalSearch } from '$lib/components/custom/global-search';
	import NewWorkspace from '$lib/components/custom/dialogs/local/new-workspace.svelte';
	import AppSidebar from '$lib/components/custom/side-bar/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getLocalNotes, setLocalNotes } from '$lib/local/notes.svelte';
	import { getLocalUserWorkspaces, setLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
	import { getLocalWorkspaces, setLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { handleKeydown, ISTAURI } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { GlobalSettings, setGlobalSettings } from '$lib/components/custom/settings';
	import { NewUserWorkspace, setNewUserWorkspace } from '$lib/components/custom/user-workspace';
	import { setRecentsContext } from '$lib/recents.svelte.js';
	import { page } from '$app/state';

	setLocalUserWorkspaces();
	setLocalWorkspaces();
	setLocalNotes();
	setGlobalSearch();
	setGlobalSettings();
	setNewUserWorkspace();
	const useRecents = setRecentsContext();

	const { children, data } = $props();

	$effect(() => {
		if (page.url.pathname.includes('local-note')) {
			const id = page.url.pathname.split('-').splice(2).join('-');
			useRecents.add(id);
		}
	});

	$effect(() => {
		if (
			data.localUserWorkspaces === undefined ||
			data.currentUserWorkspace === undefined ||
			data.localWorkspaces === undefined ||
			data.localNotes === undefined
		) {
			toast.error('Something went wrong when loading the local data');
			goto('/');
		}
	});

	if (
		ISTAURI &&
		data.currentUserWorkspace &&
		data.localUserWorkspaces &&
		data.localWorkspaces &&
		data.localNotes
	) {
		const localUserWorkspaces = getLocalUserWorkspaces();
		const localWorkspaces = getLocalWorkspaces();
		const localNotes = getLocalNotes();
		localUserWorkspaces.setUserWorkspaces(data.localUserWorkspaces);
		localUserWorkspaces.setCurrentUserWorkspace(data.currentUserWorkspace);
		localWorkspaces.setWorkspaces(data.localWorkspaces);
		localNotes.setNotes(data.localNotes);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<GlobalSearch />
<GlobalSettings />
<NewUserWorkspace />

<Sidebar.Provider>
	<NewWorkspace />
	<AppSidebar />
	<Sidebar.Inset class="flex h-screen w-full flex-col overflow-hidden">
		<div data-tauri-drag-region class="absolute top-0 !z-10 h-12 w-full"></div>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
