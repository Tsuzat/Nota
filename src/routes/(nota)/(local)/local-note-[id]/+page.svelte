<script lang="ts">
	import { goto } from '$app/navigation';
	import NavActions from '$lib/components/custom/side-bar/nav-actions.svelte';
	import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor } from '$lib/components/edra/shadcn';
	import IconPicker from '$lib/components/icons/icon-picker.svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger } from '$lib/components/ui/sidebar';
	import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte.js';
	import { Loader } from '@lucide/svelte';
	import { load, Store } from '@tauri-apps/plugin-store';
	import type { Editor, Content } from '@tiptap/core';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	let content = $state<Content>();
	let editor = $state<Editor>();
	const { data } = $props();

	const localNotes = getLocalNotes();
	let note = $state<LocalNote>();
	let isLoading = $state(false);
	let store = $state<Store>();
	let syncing = $state(false);

	$effect(() => {
		loadNotes(data.id);
	});

	async function loadNotes(id: string) {
		isLoading = true;
		note = localNotes.getNotes().find((n) => n.id === id);
		if (note === undefined) {
			toast.error(`Workspace is not found`);
			goto('/home');
			return;
		}
		store = await load(note.path, { autoSave: false });
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
				toast.warning('Could not save workspace note content');
			});
	}
	onDestroy(() => {
		store?.close();
	});

	async function updateIcon(icon: string) {
		if (note === undefined) return;
		try {
			syncing = true;
			await store?.set('icon', icon);
			await store?.save();
			note.icon = icon;
			await localNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note icon');
			console.error(e);
		} finally {
			syncing = false;
		}
	}

	async function updateName(name: string) {
		if (note === undefined) return;
		try {
			syncing = true;
			await store?.set('name', name);
			await store?.save();
			note.name = name;
			await localNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note name');
			console.error(e);
		} finally {
			syncing = false;
		}
	}
</script>

{#if note === undefined && isLoading}
	<div class="flex size-full flex-col items-center justify-center">
		<div class="flex items-center gap-4">
			<Loader class="text-primary animate-spin" />
			<h4>Loading Local Notes</h4>
		</div>
	</div>
{:else if note !== undefined}
	<header class="flex h-14 shrink-0 items-center gap-2">
		<div class="flex flex-1 items-center gap-2 px-3">
			<SidebarTrigger />
			<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
			<IconPicker onSelect={updateIcon}>
				<div class={buttonVariants({ variant: 'ghost', class: '!size-7 p-1' })}>
					<IconRenderer icon={note.icon} />
				</div>
			</IconPicker>
			<h4>{note.name}</h4>
		</div>
		<div class="ml-auto px-3">
			<NavActions />
		</div>
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
