<script lang="ts">
	import { page } from '$app/state';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
	import { ISMACOS } from '$lib/utils';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import LinkIcon from '@lucide/svelte/icons/link';
	import StarOffIcon from '@lucide/svelte/icons/star-off';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { openPath as reveal } from '@tauri-apps/plugin-opener';
	import { toast } from 'svelte-sonner';
	import { linear } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { dirname } from '@tauri-apps/api/path';

	const sidebar = useSidebar();
	let showMore = $state(false);
	const localNotes = getLocalNotes();
	const notes = $derived(
		localNotes
			.getNotes()
			.filter((n) => n.favorite && !n.trashed)
			.slice(0, showMore ? undefined : 5)
	);

	async function toggleStar(note: LocalNote) {
		try {
			note.favorite = !note.favorite;
			await localNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note starred');
			console.error(e);
		}
	}

	async function openPath(note: LocalNote) {
		const dir = await dirname(note.path);
		await reveal(dir);
	}
</script>

{#if notes.length > 0}
	<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
		<Sidebar.GroupLabel>Favorites</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each notes as note (note.id)}
				{@const href = `local-note-${note.id}`}
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
								<DropdownMenu.Item onclick={() => window.navigator.clipboard.writeText(note.path)}>
									<LinkIcon />
									Copy Path
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => openPath(note)}>
									<ArrowUpRightIcon />
									Open in {ISMACOS ? 'Finder' : 'File Explorer'}
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item variant="destructive" onclick={() => localNotes.trashNote(note)}>
									<Trash2Icon />
									Move to trash
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => localNotes.deleteNote(note)}
									variant="destructive"
								>
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
