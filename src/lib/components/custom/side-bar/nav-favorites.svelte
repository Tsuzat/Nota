<script lang="ts">
	import { page } from '$app/state';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
	import { ISMACOS, ISTAURI } from '$lib/utils';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import LinkIcon from '@lucide/svelte/icons/link';
	import StarOffIcon from '@lucide/svelte/icons/star-off';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { openUrl, openPath as reveal } from '@tauri-apps/plugin-opener';
	import { toast } from 'svelte-sonner';
	import { linear } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { dirname } from '@tauri-apps/api/path';
	import { type CloudNote, useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
	import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
	import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
	import { ask } from '@tauri-apps/plugin-dialog';

	const sidebar = useSidebar();
	let showMore = $state(false);
	const localNotes = getLocalNotes();
	const cloudNotes = useCloudNotes();
	const currentUserWorkspace = useCurrentUserWorkspaceContext();
	const notes = $derived.by(() => {
		let notes: LocalNote[] | CloudNote[] = [];
		if (currentUserWorkspace.getIsLocal()) notes = localNotes.getNotes();
		else notes = cloudNotes.getNotes();
		return notes.filter((n) => n.favorite && !n.trashed);
	});

	async function toggleStar(note: LocalNote | CloudNote) {
		try {
			note.favorite = !note.favorite;
			if ('owner' in note) await cloudNotes.updateNote(note);
			else await localNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note starred');
			console.error(e);
		}
	}

	async function openPath(note: LocalNote) {
		const dir = await dirname(note.path);
		await reveal(dir);
	}

	async function trashNote(note: LocalNote | CloudNote) {
		const shouldDelete = await ask(
			'This action will put the note in Trash. You can still access it and restore it later.',
			{
				title: `Trash ${note.name}`,
				okLabel: 'Trash',
				cancelLabel: 'Cancel'
			}
		);
		if (!shouldDelete) return;
		try {
			if ('owner' in note) await cloudNotes.moveToTrash(note.id);
			else await localNotes.trashNote(note);
		} catch (e) {
			toast.error('Could not update note starred');
			console.error(e);
		}
	}
	async function deleteNote(note: LocalNote | CloudNote) {
		const shouldDelete = await ask(
			'This action will permanently delete the note. Are you sure you want to continue?',
			{
				title: `Delete ${note.name}`,
				okLabel: 'Delete',
				cancelLabel: 'Cancel'
			}
		);
		if (!shouldDelete) return;
		try {
			if ('owner' in note) await cloudNotes.deleteNote(note.id);
			else await localNotes.deleteNote(note);
		} catch (e) {
			toast.error('Could not update note starred');
			console.error(e);
		}
	}
</script>

{#if notes.length > 0}
	<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
		<Sidebar.GroupLabel>Favorites</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each notes.filter((n) => n.favorite && !n.trashed) as note (note.id)}
				{@const isCloud = 'owner' in note}
				{@const href = `${isCloud ? '' : 'local-'}note-${note.id}`}
				{@const isActive = page.url.pathname.endsWith(href)}
				<div transition:slide={{ easing: linear, duration: 200 }}>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton {isActive}>
							{#snippet child({ props })}
								<a {href} title={note.name} {...props}>
									<IconRenderer icon={note.icon} />
									<span>{note.name}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuAction showOnHover {...props}>
										<EllipsisIcon />
										<span class="sr-only">More</span>
									</Sidebar.MenuAction>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content
								class="w-fit rounded-lg"
								side={sidebar.isMobile ? 'bottom' : 'right'}
								align={sidebar.isMobile ? 'end' : 'start'}
							>
								<DropdownMenu.Item onclick={() => toggleStar(note)}>
									<StarOffIcon />
									Unfavorites
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								{#if !isCloud}
									<DropdownMenu.Item
										onclick={() => window.navigator.clipboard.writeText(note.path)}
									>
										<LinkIcon />
										Copy Path
									</DropdownMenu.Item>
									<DropdownMenu.Item onclick={() => openPath(note)}>
										<ArrowUpRightIcon />
										Open in {ISMACOS ? 'Finder' : 'File Explorer'}
									</DropdownMenu.Item>
								{/if}
								{#if isCloud}
									<DropdownMenu.Item
										onclick={() =>
											window.navigator.clipboard.writeText(
												`${PUBLIC_NOTA_FRONTEND_URL}/note-preview-${note.id}`
											)}
									>
										<LinkIcon />
										Copy Url
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onclick={async () => {
											const url = `${PUBLIC_NOTA_FRONTEND_URL}/note-preview-${note.id}`;
											if (ISTAURI) await openUrl(url);
											else window.open(url, '_blank');
										}}
									>
										<ArrowUpRightIcon />
										Open In {ISTAURI ? 'Browser' : 'New Tab'}
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Separator />
								<DropdownMenu.Item variant="destructive" onclick={() => trashNote(note)}>
									<Trash2Icon />
									Move To Trash
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => deleteNote(note)} variant="destructive">
									<Trash2Icon />
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Sidebar.MenuItem>
				</div>
			{/each}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					class="text-sidebar-foreground/70"
					onclick={() => (showMore = !showMore)}
				>
					<EllipsisIcon />
					<span>{showMore ? 'Less' : 'More'}</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Group>
{/if}
