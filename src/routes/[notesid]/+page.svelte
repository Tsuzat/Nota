<script lang="ts">
	import { writable } from 'svelte/store';
	import type { PageData } from './$types';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import NavActions from '$lib/components/customs/sidebar/nav-actions.svelte';
	import ShadEditor from '$lib/components/shad-editor/shad-editor.svelte';
	import { getNotesById, type Notes } from '$lib/database/notes';
	import { onMount } from 'svelte';
	import { load, type Store } from '@tauri-apps/plugin-store';
	import type { Content } from '@tiptap/core';
	import { error } from '@tauri-apps/plugin-log';
	import { toast } from 'svelte-sonner';
	import { redirect } from '@sveltejs/kit';
	import { Loader2 } from 'lucide-svelte';
	import { page } from '$app/stores';

	const notes = writable<Notes | null>(null);
	let store: Store | undefined = undefined;

	let notesId = $derived.by(() => {
		return $page.url.pathname.split('/')[1];
	});

	$effect(() => {
		loadNotes();
	});

	async function loadNotes() {
		notes.set(null);
		store = undefined;
		const notesDB = await getNotesById(notesId);
		if (notesDB === null) {
			toast.warning('Note not found', {
				description: `Note with id ${notesId} not found`,
				action: {
					label: 'Ok',
					onClick: () => {}
				}
			});
			redirect(307, '/');
		}

		// Get the path of the notes
		const notePath = notesDB.path;
		store = await load(notePath, { autoSave: true });

		// Load all the notes data
		const id = await store.get<string>('id');
		const name = await store.get<string>('name');
		const icon = await store.get<string>('icon');
		const cover = await store.get<string>('cover');
		const description = await store.get<string>('description');
		const createdAt = await store.get<string>('createdAt');
		const updatedAt = await store.get<string>('updatedAt');
		const content = await store.get<Content>('content');

		/**
		 * ! TODO: Need to create a function which checks the cardinality of the data
		 */
		if (
			id === undefined ||
			name === undefined ||
			icon === undefined ||
			cover === undefined ||
			description === undefined ||
			createdAt === undefined ||
			updatedAt === undefined ||
			content === undefined
		) {
			error('Note data not found');
			console.error(
				'Note data not found',
				id,
				name,
				icon,
				cover,
				description,
				createdAt,
				updatedAt
			);
			toast.error('Note data not found', {
				description: `Note with id ${notesDB.id} not found or corrupted. You'll be redirected to home page`,
				action: {
					label: 'Ok',
					onClick: () => {}
				}
			});
			redirect(307, '/');
		}
		notes.set({
			id,
			name,
			icon,
			cover,
			description,
			createdAt,
			updatedAt,
			content
		});
	}

	notes.subscribe((note) => {
		if (store === undefined || note === null) return;
		store.set('name', note.name);
		store.set('icon', note.icon);
		store.set('cover', note.cover);
		store.set('description', note.description);
		store.set('updatedAt', new Date().toISOString());
		store.set('content', note.content);
	});
</script>

{#key notesId}
	{#if $notes === null}
		<div class="flex h-full w-full items-center justify-center">
			<div class="text-center flex items-center">
				<span class="text-xl mr-4"> <Loader2 class="animate-spin" /> </span>
				<span class="text-xl font-bold">Loading...</span>
			</div>
		</div>
	{:else}
		<main class="flex flex-col w-full h-screen">
			<header class="flex h-14 shrink-0 items-center gap-2">
				<div class="flex flex-1 items-center gap-2 px-3">
					<Sidebar.Trigger />
					<Separator orientation="vertical" class="mr-2 h-4" />
					<div class="line-clamp-1 flex items-center gap-2 text-xl font-bold">
						<span>{$notes.icon}</span>
						<span>{$notes.name}</span>
					</div>
				</div>
				<div class="ml-auto px-3">
					<NavActions lastEdited={$notes.updatedAt} />
				</div>
			</header>
			<div class="flex-1 overflow-y-auto">
				<div class="mx-auto max-w-3xl p-2">
					<ShadEditor bind:content={$notes.content} />
				</div>
			</div>
		</main>
	{/if}
{/key}
