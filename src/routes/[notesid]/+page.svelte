<script lang="ts">
	import { writable } from 'svelte/store';
	import src from '$lib/assets/static/icon.png';
	import * as Sidebar from '$lib/components/ui/sidebar';
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
	import { page } from '$app/state';

	import '@fontsource-variable/inter';
	import { APPWINDOW, CURRENT_ACTIVE_NOTE, NOTES, OS, WORKSPACES } from '$lib/contants';
	import Iconpicker from '$lib/components/icons/iconpicker.svelte';
	import { cn, updateNOTES } from '$lib/utils';
	import IconRender from '$lib/components/icons/icon-render.svelte';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/customs/navigation.svelte';
	import { addNoteToRecents } from '$lib/recents';
	import Tooltip from '$lib/components/customs/tooltip.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { SHOW_DECORATION, SIDEBAR_OPEN } from '$lib/app_settings';
	import { APP_MENU } from '$lib/app_menu';
	import { Button } from '$lib/components/ui/button';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { goto } from '$app/navigation';

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
	let showToolbar = $state(false);
	let spellCheck = $state(true);

	$effect(() => {
		loadNotes(notesId);
	});

	// Loads the Notes from Database and also the store
	async function loadNotes(notesId: string) {
		notes.set(null);
		notesDB.set(null);
		// wait for 5 seconds to avoid race condition
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
			goto('/');
			return;
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
			goto('/');
			return;
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
		CURRENT_ACTIVE_NOTE.set($notesDB);
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

	const sidebar = useSidebar();
	onMount(() => {
		sidebar.setOpen($SIDEBAR_OPEN);
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
	<main class="flex flex-col w-full h-full overflow-auto">
		<header
			{...$SHOW_DECORATION ? {} : { 'data-tauri-drag-region': '' }}
			class={cn(
				$SHOW_DECORATION === false && 'mr-36',
				'max-w-[calc(100%-0px)] flex h-10 items-center p-2 gap-2 transition-all'
			)}
		>
			<div class="flex items-center gap-2 px-3">
				{#if sidebar.state === 'collapsed'}
					{#if $SHOW_DECORATION}
						<img {src} alt="user-icon" class="size-5" />
					{:else}
						<Button variant="ghost" size="icon" class="size-6 p-1" onclick={() => APP_MENU.popup()}>
							<img {src} alt="user-icon" class="size-full" />
						</Button>
					{/if}
				{/if}
				<Tooltip text="Toggle Sidebar" key={`${OS === 'macos' ? '⌘' : 'Ctrl'} \\`}>
					<Sidebar.Trigger
						onclick={() => {
							SIDEBAR_OPEN.set(sidebar.state === 'collapsed');
						}}
					/>
				</Tooltip>
				<Navigation />
				<div class="flex items-center gap-2 text-xl font-bold">
					{#if $notes !== null}
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
					{:else}
						<div class="flex items-center gap-2">
							<Skeleton class="size-8 rounded" />
							<Skeleton class="h-8 w-60 rounded" />
						</div>
					{/if}
				</div>
			</div>
			{#if $notes !== null && $notesDB !== null}
				<div class="ml-auto px-3">
					<NavActions
						bind:lastEdited={$notes.updatedAt}
						bind:isLocked
						bind:showToolbar
						bind:spellCheck
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
			{/if}
		</header>
		<div class="flex-grow-0 flex-shrink flex flex-col z-10 max-h-full h-[calc(-2.5rem+100vh)]">
			{#if $notes !== null}
				<ShadEditor
					showToolbar={!isLocked && showToolbar}
					editable={!isLocked}
					{spellCheck}
					class="max-h-[calc(100dvh-3rem)] flex flex-col w-full"
					path={$path}
					content={$notes.content}
					onChange={updateContent}
				/>
			{:else}
				<div class="flex-grow max-h-[calc(90vh)] w-full rounded">
					<Skeleton class="size-full max-w-3xl bg-muted/50 m-auto" />
				</div>
			{/if}
		</div>
	</main>
{/key}
