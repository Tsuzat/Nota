<script lang="ts">
	import AppLogoMenu from '$lib/components/custom/app-logo-menu.svelte';
	import BackAndForthButtons from '$lib/components/custom/back-and-forth-buttons.svelte';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';
	import { getNewUserWorkspace } from '$lib/components/custom/user-workspace';
	import { useCurrentUserWorkspaceContext } from '$lib/components/custom/user-workspace/userworkspace.svelte';
	import WindowsButtons from '$lib/components/custom/windows-buttons.svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import {
		getLocalUserWorkspaces,
		type LocalUserWorkspace
	} from '$lib/local/userworkspaces.svelte';
	import { getRecentsContext } from '$lib/recents.svelte';
	import {
		useCloudUserWorkspaces,
		type CloudUserWorkspace
	} from '$lib/supabase/db/clouduserworkspaces.svelte';
	import { cn, ISMACOS, ISTAURI, ISWINDOWS } from '$lib/utils';
	import PlusIcon from '@lucide/svelte/icons/plus';

	const sidebar = useSidebar();
	const localUserWorkspaces = getLocalUserWorkspaces();
	const cloudUserWorkspaces = useCloudUserWorkspaces();
	const currentUserWorkspace = $derived(useCurrentUserWorkspaceContext().getCurrentUserWorkspace());
	const localNotes = getLocalNotes();
	const useRecents = getRecentsContext();
	const useNewUserWorkspace = getNewUserWorkspace();
	const userWorkspaces: (LocalUserWorkspace | CloudUserWorkspace)[] = $derived.by(() => {
		return [...localUserWorkspaces.getUserWorkspaces(), ...cloudUserWorkspaces.getWorkspaces()];
	});

	const recentNotes = $derived.by(() => {
		const notes = localNotes.getNotes();
		const recents = useRecents.getRecents();
		const rn = [];
		for (const note of notes) {
			if (recents.has(note.id)) {
				rn.push(note);
			}
		}
		return rn;
	});
</script>

{#if currentUserWorkspace === null}
	<h2>No User Workspace Selected</h2>
{:else}
	{@const ISDESKTOP = (ISMACOS || ISWINDOWS) && ISTAURI}
	<header class="flex h-12 shrink-0 items-center gap-2">
		<div
			class={cn(
				'z-20 ml-18 flex items-center gap-2 px-3',
				ISMACOS && !sidebar.open && 'ml-18',
				ISWINDOWS && !sidebar.open && 'ml-0',
				ISDESKTOP && sidebar.open && 'md:ml-0'
			)}
		>
			{#if ISWINDOWS && !sidebar.open}
				<AppLogoMenu />
			{/if}
			<SidebarTrigger />
			<BackAndForthButtons />
			<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
			<h3>{currentUserWorkspace?.name}</h3>
		</div>
		<div class={cn('z-20 ml-auto px-3', ISWINDOWS && 'mr-30')}></div>
		{#if ISWINDOWS}
			<WindowsButtons />
		{/if}
	</header>
	<div
		class="mx-auto flex h-[calc(100vh-3rem)] w-3xl flex-1 flex-grow flex-col gap-8 overflow-auto"
	>
		<section class="my-2 flex w-full flex-col items-start gap-4 p-2">
			<div class="text-muted-foreground flex w-full items-center gap-2">
				<h4>User Workspaces</h4>
				<span class="text-foreground text-sm">{userWorkspaces.length}</span>
				<SimpleTooltip content="Add New UserWorkspace">
					<Button
						variant="ghost"
						class="size-7 rounded-full"
						onclick={() => (useNewUserWorkspace.open = true)}
					>
						<PlusIcon />
					</Button>
				</SimpleTooltip>
			</div>
			<div class="flex w-full items-center gap-2 overflow-x-auto">
				{#each userWorkspaces as workspace (workspace.id)}
					<Button
						variant="secondary"
						class={cn(
							'w-fit rounded-lg !p-6',
							currentUserWorkspace?.id === workspace.id && 'border-primary border'
						)}
					>
						<IconRenderer icon={workspace.icon} class="mr-2 size-4" />
						<span class="text-muted-foreground">{workspace.name}</span>
					</Button>
				{/each}
				{#if userWorkspaces.length === 0}
					<span class="text-muted-foreground">No Userworkspaces are found.</span>
				{/if}
			</div>
		</section>

		<section class="my-2 flex w-full flex-col items-start gap-4 p-2">
			<h4 class="text-foreground flex items-center gap-2">
				Recents
				<span class="text-muted-foreground text-sm">{recentNotes.length}</span>
			</h4>
			<div class="flex w-full items-center gap-2 overflow-x-auto">
				{#each recentNotes as recent (recent.id)}
					<a
						class="bg-card group relative flex w-fit items-center gap-2 rounded-lg p-4"
						href="/local-note-{recent.id}"
					>
						<IconRenderer icon={recent.icon} class="mr-2 size-4" />
						<span class="text-muted-foreground">{recent.name}</span>
					</a>
				{/each}
				{#if recentNotes.length === 0}
					<span class="text-muted-foreground">No recent notes are found.</span>
				{/if}
			</div>
		</section>
	</div>
{/if}
