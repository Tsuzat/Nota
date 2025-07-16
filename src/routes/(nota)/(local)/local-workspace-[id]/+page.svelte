<script lang="ts">
	import { goto } from '$app/navigation';
	import NavActions from '$lib/components/custom/side-bar/nav-actions.svelte';
	import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor } from '$lib/components/edra/shadcn';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { getLocalWorkspaces, type LocalWorkSpace } from '$lib/local/workspaces.svelte.js';
	import { cn, ISMACOS, ISTAURI } from '$lib/utils.js';
	import { Loader } from '@lucide/svelte';
	import { resolve } from '@tauri-apps/api/path';
	import { load, Store } from '@tauri-apps/plugin-store';
	import type { Editor, Content } from '@tiptap/core';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	let content = $state<Content>();
	let editor = $state<Editor>();
	const { data } = $props();
	const sidebar = useSidebar();

	const localWorkspaces = getLocalWorkspaces();
	let workspace = $state<LocalWorkSpace>();
	let isLoading = $state(false);
	let store = $state<Store>();

	$effect(() => {
		loadWorkspace(data.id);
	});

	async function loadWorkspace(id: string) {
		isLoading = true;
		workspace = localWorkspaces.getWorkspaces().find((w) => w.id === id);
		if (workspace === undefined) {
			toast.error(`Workspace is not found`);
			goto('/home');
			return;
		}
		const path = await resolve(workspace.path, '.workspace.nota');
		store = await load(path, { autoSave: false });
		content = await store.get<Content>('content');
		isLoading = false;
	}

	async function onUpdate() {
		content = editor?.getJSON();
		store
			?.set('content', content)
			.then(() => {
				store?.save();
			})
			.catch((e) => {
				console.error(e);
				toast.warning('Could not save workspace notes content');
			});
	}

	onDestroy(() => {
		store?.close();
	});
</script>

{#if workspace === undefined && isLoading}
	<div class="flex size-full flex-col items-center justify-center">
		<div class="flex items-center gap-4">
			<Loader class="text-primary animate-spin" />
			<h4>Loading Local Workspace</h4>
		</div>
	</div>
{:else if workspace !== undefined}
	<header class="flex h-14 shrink-0 items-center gap-2">
		<div
			data-open={ISMACOS && sidebar.open}
			class={cn(
				'z-20 ml-18 flex items-center gap-2 px-3 data-[open=false]:ml-18',
				ISTAURI && 'md:ml-0'
			)}
		>
			<SidebarTrigger />
			<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
			<h3>{workspace.name}</h3>
		</div>
		<!-- <div class="ml-auto px-3">
			<NavActions />
		</div> -->
	</header>
	<div class="flex h-[calc(100vh-4rem)] flex-1 flex-grow flex-col overflow-auto">
		<div class="mx-auto h-full w-full max-w-3xl flex-1 flex-grow">
			{#if editor && !editor?.isDestroyed}
				<EdraBubbleMenu {editor} />
				<EdraDragHandleExtended {editor} />
			{/if}
			<EdraEditor bind:editor {content} class="size-full !p-8" {onUpdate} />
		</div>
	</div>
{:else}
	<div class="flex size-full flex-col items-center justify-center gap-4">
		<h4>Something went wrong.</h4>
		<a href="/home">Got to Home</a>
	</div>
{/if}
