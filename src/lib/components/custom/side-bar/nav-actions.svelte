<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dropdown from '$lib/components/ui/dropdown-menu';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import StarIcon from '@lucide/svelte/icons/star';
	import { cn, exportContent, importNotes } from '$lib/utils';
	import PenTool from '@lucide/svelte/icons/pen-tool';
	import Bubbles from '@lucide/svelte/icons/bubbles';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import ArrowRightFromLine from '@lucide/svelte/icons/arrow-right-from-line';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Globe from '@lucide/svelte/icons/globe';
	import SimpleTooltip from '../simple-tooltip.svelte';
	import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { useCloudNotes, type CloudNote } from '$lib/supabase/db/cloudnotes.svelte';
	import { ask } from '@tauri-apps/plugin-dialog';
	import type { Editor } from '@tiptap/core';
	import { getGlobalSettings } from '../settings';

	interface Props {
		starred?: boolean;
		toggleStar?: () => void;
		note: LocalNote | CloudNote;
		editor?: Editor;
	}

	let { starred, toggleStar, note, editor }: Props = $props();

	const localNotes = getLocalNotes();
	const cloudNotes = useCloudNotes();
	const globalSettings = getGlobalSettings();
	const workspace = $derived(
		getLocalWorkspaces()
			.getWorkspaces()
			.find((w) => w.id === note.workspace)
	);

	let open = $state(false);
</script>

<div class="flex items-center gap-2 text-sm">
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
				<Dropdown.GroupHeading class="text-muted-foreground text-sm"
					>Page Settings
				</Dropdown.GroupHeading>
				<Dropdown.CheckboxItem bind:checked={globalSettings.useToolBar}>
					<PenTool />
					Toolbar
				</Dropdown.CheckboxItem>
				<Dropdown.CheckboxItem bind:checked={globalSettings.useBubbleMenu}>
					<Bubbles />
					Bubble Menu
				</Dropdown.CheckboxItem>
				<Dropdown.CheckboxItem bind:checked={globalSettings.useDragHandle}>
					<GripVertical />
					Drag Handle
				</Dropdown.CheckboxItem>
			</Dropdown.Group>
			<Dropdown.Separator />
			<Dropdown.Group>
				{#if 'owner' in note}
					<Dropdown.Item onclick={() => cloudNotes.togglePublic(note)}>
						<Globe />
						{note.isPublic ? 'Make Private' : 'Make Public'}
					</Dropdown.Item>
				{/if}

				<Dropdown.Item
					onclick={() => {
						if ('owner' in note) cloudNotes.duplicate(note);
						else if (workspace) localNotes.duplicateNote(workspace, note);
					}}
				>
					<CopyIcon />
					Duplicate
				</Dropdown.Item>
				<Dropdown.Item onclick={() => importNotes(editor)}>
					<ArrowDown />
					Import
				</Dropdown.Item>
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
						if ('owner' in note) cloudNotes.moveToTrash(note);
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
						if ('owner' in note) cloudNotes.deleteNote(note);
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
