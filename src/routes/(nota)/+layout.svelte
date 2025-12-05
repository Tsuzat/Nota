<script lang="ts">
	import { goto } from '$app/navigation';
	import { GlobalSearch, setGlobalSearch } from '$lib/components/custom/global-search';
	import NewWorkspace from '$lib/components/custom/dialogs/local/new-workspace.svelte';
	import AppSidebar from '$lib/components/custom/side-bar/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { setLocalNotes } from '$lib/local/notes.svelte';
	import { setLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
	import { setLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { handleKeydown, ISTAURI } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { GlobalSettings } from '$lib/components/custom/settings';
	import { NewUserWorkspace, setNewUserWorkspace } from '$lib/components/custom/user-workspace';
	import { setCloudUserWorkspaces } from '$lib/supabase/db/clouduserworkspaces.svelte';
	import { setCloudWorkspaces } from '$lib/supabase/db/cloudworkspace.svelte';
	import { setCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';
	import { setCurrentUserWorkspaceContext } from '$lib/components/custom/user-workspace/userworkspace.svelte.js';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	// Local Workspaces and Notes
	const localUserWorkspaces = setLocalUserWorkspaces();
	const localWorkspaces = setLocalWorkspaces();
	const localNotes = setLocalNotes();

	// Cloud Workspaces and Notes
	const cloudUserWorkspaces = setCloudUserWorkspaces();
	const cloudWorkspaces = setCloudWorkspaces();
	const cloudNotes = setCloudNotes();

	const currentUserWorkspace = setCurrentUserWorkspaceContext();

	const user = $derived(getSessionAndUserContext().getUser());

	$effect(() => {
		if (user === null) {
			cloudUserWorkspaces.setWorkspace([]);
			cloudWorkspaces.setWorkspaces([]);
			cloudNotes.setNotes([]);
		} else {
			cloudUserWorkspaces.fetchWorkspaces(user);
		}
	});
	setGlobalSearch();
	setNewUserWorkspace();

	const { children, data } = $props();

	let open = $state(false);

	onMount(() => {
		open = localStorage.getItem('sidebar-state') === 'open';
	});

	$effect(() => {
		if (
			ISTAURI &&
			(data.localUserWorkspaces === undefined ||
				data.currentUserWorkspace === undefined ||
				data.localWorkspaces === undefined ||
				data.localNotes === undefined)
		) {
			toast.error('Something went wrong when loading the local data');
			goto(resolve('/'));
		} else {
			currentUserWorkspace.setCurrentUserWorkspace(data.currentUserWorkspace!);
			localUserWorkspaces.setUserWorkspaces(data.localUserWorkspaces!);
			localWorkspaces.setWorkspaces(data.localWorkspaces!);
			localNotes.setNotes(data.localNotes!);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<GlobalSearch />
<GlobalSettings />
<NewUserWorkspace />

<Sidebar.Provider
	bind:open
	onOpenChange={(value) => {
		localStorage.setItem('sidebar-state', value ? 'open' : 'closed');
	}}
>
	<NewWorkspace />
	<AppSidebar />
	<Sidebar.Inset class="flex h-screen w-full flex-col overflow-hidden">
		<div data-tauri-drag-region class="absolute top-0 z-10! h-12 w-full"></div>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>

<style>
	:global(html) {
		user-select: none !important;
	}
</style>
