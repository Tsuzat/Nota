<script lang="ts">
	import { writable } from 'svelte/store';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import NavActions from '$lib/components/customs/sidebar/nav-actions.svelte';
	import ShadEditor from '$lib/components/shad-editor/shad-editor.svelte';
	import {
		getNotesById,
		type NotesDB,
		type Notes,
		updateNotesDB,
		duplicateNote,
		moveToTrash
	} from '$lib/database/notes';
	import { load, type Store } from '@tauri-apps/plugin-store';
	import type { Content } from '@tiptap/core';
	import { error } from '@tauri-apps/plugin-log';
	import { toast } from 'svelte-sonner';
	import { redirect } from '@sveltejs/kit';
	import { Loader2, LockKeyhole } from 'lucide-svelte';
	import { page } from '$app/state';

	import '@fontsource-variable/inter';
	import { APPWINDOW, NOTES, OS, WORKSPACES } from '$lib/contants';
	import Iconpicker from '$lib/components/icons/iconpicker.svelte';
	import { updateNOTES } from '$lib/utils';
	import IconRender from '$lib/components/icons/icon-render.svelte';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/customs/navigation.svelte';
	import { addNoteToRecents } from '$lib/recents';
	import Tooltip from '$lib/components/customs/tooltip.svelte';
	import { fade } from 'svelte/transition';

	const notes = writable<Notes | null>(null);
	const notesDB = writable<NotesDB | null>(null);
	const path = writable<string>('');
	let store: Store | undefined = undefined;
	let isAFavorite = $derived.by(() => {
		if ($notesDB === null) return false;
		return $NOTES.find((note) => note.id === $notesDB.id)?.favorite ?? false;
	});

	let notesId = $derived.by(() => {
		return page.url.pathname.split('/')[1];
	});

	// Page Related settings
	let isLocked = $state(false);

	$effect(() => {
		loadNotes(notesId);
	});

	// Loads the Notes fro Database and also the store
	async function loadNotes(notesId: string) {
		notes.set(null);
		notesDB.set(null);
		store = undefined;
		const tmpNotesDB = await getNotesById(notesId);
		notesDB.set(tmpNotesDB);
		if ($notesDB === null) {
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
		const notePath = $notesDB.path;
		store = await load(notePath, { autoSave: false });

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
				description: `Note with id ${$notesDB.id} not found or corrupted. You'll be redirected to home page`,
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

		const workspace = $WORKSPACES.find((workspace) => workspace.id === $notesDB.workspace);
		if (workspace === undefined) return;
		path.set(workspace.path);
		// Set the APP Window as notes name
		APPWINDOW.setTitle(`Nota - ${name}`);
		if (notesDB !== null) addNoteToRecents($notesDB.id);
	}

	// On notesDB changes, uodate DB and gloabal variable
	notesDB.subscribe((notes) => {
		if (notes === null) return;
		updateNotesDB(notes);
		updateNOTES(notes);
	});

	async function updateContent(content: Content) {
		notes.update((note) => {
			if (note === null) return note;
			note.content = content;
			note.updatedAt = new Date().toISOString();
			return note;
		});
		if (!store) return;
		await store.set('updatedAt', new Date().toISOString());
		await store.set('content', content);
		await store.save();
	}

	async function onIconChange(icon: string) {
		notes.update((note) => {
			if (note === null) return note;
			note.icon = icon;
			note.updatedAt = new Date().toISOString();
			return note;
		});
		if (!store) return;
		await store.set('icon', icon);
		await store.save();

		if ($notesDB === null) return;
		$notesDB.icon = icon;
	}

	async function onTitleChange(title: string) {
		notes.update((note) => {
			if (note === null) return note;
			note.name = title;
			note.updatedAt = new Date().toISOString();
			return note;
		});
		if (!store) return;
		// store.set('updatedAt', new Date().toISOString());
		await store.set('name', title);
		await store.save();
		if ($notesDB === null) return;
		$notesDB.name = title;
	}

	onMount(() => {
		return async () => {
			if (store) await store.close();
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'l' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			isLocked = !isLocked;
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

{#key notesId}
	{#if $notes === null || $notesDB === null}
		<div class="flex h-full w-full items-center justify-center">
			<div class="text-center flex items-center">
				<span class="text-xl mr-4"> <Loader2 class="animate-spin" /> </span>
				<span class="text-xl font-bold">Loading...</span>
			</div>
		</div>
	{:else}
		<main transition:fade={{ duration: 100 }} class="flex flex-col w-full h-full">
			<header class="flex h-12 shrink-0 items-center gap-2">
				<div class="flex flex-1 items-center gap-2 px-3">
					<Tooltip text="Toggle Sidebar" key={`${OS === 'macos' ? '⌘' : 'Ctrl'} \\`}>
						<Sidebar.Trigger />
					</Tooltip>
					<Separator orientation="vertical" class="mr-2 h-4" />
					<Navigation />
					<div class="flex items-center gap-2 text-xl font-bold">
						<Iconpicker onSelect={onIconChange}>
							<IconRender icon={$notes.icon} class="text-xl" />
						</Iconpicker>
						<input
							type="text"
							class="text-ellipsis max-w-60 w-fit bg-transparent focus:outline-none hover:bg-muted/50 p-0.5 rounded"
							bind:value={$notes.name}
							oninput={(e) => {
								//@ts-ignore
								if (e.target && e.target.value) onTitleChange(e.target.value);
							}}
						/>
					</div>
				</div>
				<div class="ml-auto px-3">
					<NavActions
						bind:lastEdited={$notes.updatedAt}
						bind:isLocked
						favorite={isAFavorite}
						onFavorite={() => {
							$notesDB.favorite = !isAFavorite;
						}}
						onDuplicate={() => {
							const workspace = $WORKSPACES.find(
								(workspace) => workspace.id === $notesDB.workspace
							);
							if (workspace === undefined) return;
							duplicateNote($notesDB, workspace);
						}}
						onTrash={() => {
							moveToTrash($notesDB);
						}}
					/>
				</div>
			</header>
			<ShadEditor
				showToolbar={!isLocked}
				editable={!isLocked}
				class="flex-grow max-h-[calc(100vh-3rem)] flex flex-col h-full w-full printable"
				path={$path}
				content={$notes.content}
				onChange={updateContent}
			/>
		</main>
	{/if}
{/key}
