<script lang="ts">
	import NewWorkspace from '$lib/components/custom/dialogs/local/new-workspace.svelte';
	import AppSidebar from '$lib/components/custom/side-bar/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getLocalNotes, setLocalNotes } from '$lib/local/notes.svelte';
	import { getLocalUserWorkspaces, setLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
	import { getLocalWorkspaces, setLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { ISTAURI } from '$lib/utils';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	setLocalUserWorkspaces();
	setLocalWorkspaces();
	setLocalNotes();

	onMount(async () => {
		if (ISTAURI) {
			try {
				const localUserWorkspaces = getLocalUserWorkspaces();
				const localWorkspaces = getLocalWorkspaces();
				const localNotes = getLocalNotes();

				await localUserWorkspaces.fetchUserWorkspaces();
				const curLocUsrWrkspc = localUserWorkspaces.getCurrentUserWorkspace();
				if (curLocUsrWrkspc === undefined) {
					toast.warning('No user workspace found. Creating a new one');
					await localUserWorkspaces.createUserWorkspace('My Workspace', 'lucide:User');
				}
				if (curLocUsrWrkspc) {
					await localWorkspaces.fetchWorkspaces(curLocUsrWrkspc.id);
					await localNotes.fetchNotes(curLocUsrWrkspc.id);
				}
			} catch (e) {
				toast.error('Something went wrong when loading the local data');
				console.error(e);
			}
		}
	});

	const { children } = $props();
</script>

<Sidebar.Provider>
	<NewWorkspace />
	<AppSidebar />
	<Sidebar.Inset class="flex h-screen w-full flex-col overflow-hidden">
		<div data-tauri-drag-region class="absolute top-0 !z-10 h-12 w-full"></div>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
