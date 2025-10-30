<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dropdown from '$lib/components/ui/dropdown-menu';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import StarIcon from '@lucide/svelte/icons/star';
	import { type NotePageSettingsType } from '$lib/types';
	import { cn, exportContent, getKeyboardShortcut } from '$lib/utils';
	import Lock from '@lucide/svelte/icons/lock';
	import PenTool from '@lucide/svelte/icons/pen-tool';
	import SpellCheck from '@lucide/svelte/icons/spell-check';
	import Bubbles from '@lucide/svelte/icons/bubbles';
	import Film from '@lucide/svelte/icons/film';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import Settings2Icon from '@lucide/svelte/icons/settings-2';
	import ArrowRightFromLine from '@lucide/svelte/icons/arrow-right-from-line';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import SimpleTooltip from '../simple-tooltip.svelte';
	import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { useCloudNotes, type CloudNote } from '$lib/supabase/db/cloudnotes.svelte';
	import { ask } from '@tauri-apps/plugin-dialog';
	import type { Editor } from '@tiptap/core';

	interface Props {
		settings: NotePageSettingsType;
		starred?: boolean;
		toggleStar?: () => void;
		note: LocalNote | CloudNote;
		editor?: Editor;
	}

	let { settings = $bindable(), starred, toggleStar, note, editor }: Props = $props();

	const localNotes = getLocalNotes();
	const cloudNotes = useCloudNotes();
	const workspace = $derived(
		getLocalWorkspaces()
			.getWorkspaces()
			.find((w) => w.id === note.workspace)
	);

	let open = $state(false);
</script>

<div class="flex items-center gap-2 text-sm">
	{#if settings.locked}
		<SimpleTooltip>
			<Button
				variant="ghost"
				size="icon"
				class="size-7"
				onclick={() => (settings = { ...settings, locked: !settings.locked })}
			>
				<Lock />
			</Button>
			{#snippet child()}
				<div class="flex flex-col">
					<span class="font-semibold">Content Read-only</span>
					<span>
						Click to unlock
						<span class="bg-background text-primary rounded p-0.5"
							>{getKeyboardShortcut('L', true)}</span
						>
					</span>
				</div>
			{/snippet}
		</SimpleTooltip>
	{/if}
	<SimpleTooltip content="Toggle Favorite">
		<Button variant="ghost" size="icon" class="size-7" onclick={toggleStar}>
			<StarIcon class={cn(starred && 'fill-yellow-500 text-yellow-500')} />
		</Button>
	</SimpleTooltip>
	<Dropdown.Root bind:open>
		<Dropdown.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'icon',
				class: 'data-[state=open]:bg-accent size-7'
			})}
		>
			<EllipsisIcon />
		</Dropdown.Trigger>
		<Dropdown.Content class="bg-popover h-full w-fit overflow-auto" align="end">
			<Dropdown.Group>
				<Dropdown.Sub>
					<Dropdown.SubTrigger>
						<Settings2Icon />
						Settings
					</Dropdown.SubTrigger>
					<Dropdown.SubContent>
						<Dropdown.CheckboxItem
							checked={settings.locked}
							onclick={() => (settings = { ...settings, locked: !settings.locked })}
						>
							<Lock />
							{settings.locked ? 'Unlock' : 'Lock'}
						</Dropdown.CheckboxItem>
						<Dropdown.CheckboxItem
							checked={settings.showtoolbar}
							onclick={() => (settings = { ...settings, showtoolbar: !settings.showtoolbar })}
						>
							<PenTool />
							Toolbar
						</Dropdown.CheckboxItem>
						<Dropdown.CheckboxItem
							checked={settings.spellcheck}
							onclick={() => (settings = { ...settings, spellcheck: !settings.spellcheck })}
						>
							<SpellCheck />
							Spell Check
						</Dropdown.CheckboxItem>
						<Dropdown.CheckboxItem
							checked={settings.showbubblemenu}
							onclick={() => (settings = { ...settings, showbubblemenu: !settings.showbubblemenu })}
						>
							<Bubbles />
							Bubble Menu
						</Dropdown.CheckboxItem>
						<Dropdown.CheckboxItem
							checked={settings.compressmedia}
							onclick={() => (settings = { ...settings, compressmedia: !settings.compressmedia })}
						>
							<Film />
							Compress Media
						</Dropdown.CheckboxItem>
					</Dropdown.SubContent>
				</Dropdown.Sub>
			</Dropdown.Group>
			<Dropdown.Separator />
			<Dropdown.Group>
				<Dropdown.Item
					onclick={() => {
						if ('owner' in note) cloudNotes.duplicate(note);
						else if (workspace) localNotes.duplicateNote(workspace, note);
					}}
				>
					<CopyIcon />
					Duplicate
				</Dropdown.Item>
				<!-- <Dropdown.Item onclick={() => localNotes.importNote()}>
					<ArrowDown />
					Import
				</Dropdown.Item>
				<Dropdown.Item onclick={() => localNotes.exportNote(note)}>
					<ArrowUp />
					Export
				</Dropdown.Item> -->
				<Dropdown.Sub>
					<Dropdown.SubTrigger>
						<ArrowRightFromLine />
						Export As
					</Dropdown.SubTrigger>
					<Dropdown.SubContent>
						<Dropdown.Item
							onclick={() => {
								if (editor) exportContent(editor, note.name, 'JSON');
							}}>JSON</Dropdown.Item
						>
						<Dropdown.Item
							onclick={() => {
								if (editor) exportContent(editor, note.name, 'HTML');
							}}>HTML</Dropdown.Item
						>
						<Dropdown.Item
							onclick={() => {
								if (editor) exportContent(editor, note.name, 'TEXT');
							}}>Text</Dropdown.Item
						>
						<Dropdown.Item
							onclick={() => {
								if (editor) exportContent(editor, note.name, 'MD');
							}}>Markdown</Dropdown.Item
						>
					</Dropdown.SubContent>
				</Dropdown.Sub>
			</Dropdown.Group>
			<Dropdown.Separator />
			<Dropdown.Group>
				<Dropdown.Item
					onclick={() => {
						if ('owner' in note) cloudNotes.moveToTrash(note.id);
						else localNotes.trashNote(note);
					}}
				>
					<Trash2Icon />
					<span>Move to Trash</span>
				</Dropdown.Item>
				<Dropdown.Item
					variant="destructive"
					onclick={async () => {
						const shouldDelete = await ask(
							'This action will permanently delete the note. Are you sure you want to continue?',
							{
								title: `Delete ${note.name}`,
								okLabel: 'Delete',
								cancelLabel: 'Cancel'
							}
						);
						if (!shouldDelete) return;
						if ('owner' in note) cloudNotes.deleteNote(note.id);
						else localNotes.deleteNote(note);
						window.location.replace('/home');
					}}
				>
					<Trash2Icon />
					<span>Delete Note</span>
				</Dropdown.Item>
			</Dropdown.Group>
		</Dropdown.Content>
	</Dropdown.Root>
</div>
