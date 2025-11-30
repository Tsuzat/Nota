<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { cn, ISMACOS, ISTAURI, ISWINDOWS, timeAgo, writeStringToFile } from '$lib/utils';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { goto } from '$app/navigation';
	import Plus from '@lucide/svelte/icons/plus';
	import MoreVertical from '@lucide/svelte/icons/more-vertical';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Clock from '@lucide/svelte/icons/clock';
	import Calendar from '@lucide/svelte/icons/calendar';
	import { resolve } from '$app/paths';
	import AppLogoMenu from '$lib/components/custom/app-logo-menu.svelte';
	import BackAndForthButtons from '$lib/components/custom/back-and-forth-buttons.svelte';
	import WindowsButtons from '$lib/components/custom/windows-buttons.svelte';
	import IconPicker from '$lib/components/icons/icon-picker.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { useSidebar, SidebarTrigger } from '$lib/components/ui/sidebar';
	import { ask } from '@tauri-apps/plugin-dialog';
	import NewNotes from '$lib/components/custom/dialogs/local/new-notes.svelte';
	import { ArrowDownToLine } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { getLocalWorkspaces, type LocalWorkSpace } from '$lib/local/workspaces.svelte';
	import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
	import { DB } from '$lib/local/db';

	let { data } = $props();

	const localWorkspaces = getLocalWorkspaces();
	const localNotes = getLocalNotes();

	// Derived state
	const workspace = $derived(localWorkspaces.getWorkspaces().find((w) => String(w.id) === data.id));
	const notes = $derived(
		localNotes.getNotes().filter((n) => String(n.workspace) === data.id && !n.trashed)
	);
	let openNewNote = $state(false);

	async function deleteNote(note: LocalNote) {
		const ok = await ask(`Permanently delete note ${note.name}?`, {
			title: 'Delete Note',
			kind: 'warning',
			okLabel: 'Yes, Delete'
		});
		if (!ok) return;
		await localNotes.deleteNote(note);
	}

	async function trashNote(note: LocalNote) {
		const ok = await ask(`Move note ${note.name} to trash?`, {
			title: 'Trash Note',
			kind: 'warning',
			okLabel: 'Yes, Move to Trash'
		});
		if (!ok) return;
		await localNotes.trashNote(note);
	}

	function openNote(note: LocalNote) {
		goto(resolve('/(nota)/(local)/local-note-[id]', { id: String(note.id) }));
	}

	async function updateIcon(icon: string) {
		if (!workspace) return;
		workspace.icon = icon;
		await localWorkspaces.updateWorkspace(workspace);
	}

	async function updateName(name: string) {
		if (!workspace) return;
		workspace.name = name;
		await localWorkspaces.updateWorkspace(workspace);
	}

	async function moveToWorkspace(note: LocalNote, newWorkspace: LocalWorkSpace) {
		const ok = await ask(`Move note ${note.name} to workspace ${newWorkspace.name}?`, {
			title: 'Move Note',
			kind: 'info',
			okLabel: 'Yes, Move'
		});
		if (!ok) return;
		note.workspace = newWorkspace.id;
		await localNotes.updateNote(note);
	}

	async function exportNote(note: LocalNote) {
		const id = toast.loading(`Exporting ${note.name}`);
		try {
			const data = await DB.select<{ content: string }[]>(
				'SELECT content FROM notes WHERE id = $1',
				[note.id]
			);
			if (data.length === 0) {
				toast.error(`Notes content with id ${id} not found`, { id });
				return;
			}
			const content = data[0].content;
			await writeStringToFile(JSON.stringify(content), `${note.name}.json`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			toast.dismiss(id);
		}
	}
</script>

{#if workspace}
	<NewNotes bind:open={openNewNote} {workspace} />
	<header class="flex h-12 shrink-0 items-center gap-2">
		<div
			class={cn(
				'z-20 ml-18 flex items-center gap-2 px-3',
				ISMACOS && !useSidebar().open && 'ml-18',
				ISWINDOWS && !useSidebar().open && 'ml-0',
				(ISMACOS || ISWINDOWS) && ISTAURI && useSidebar().open && 'md:ml-0'
			)}
		>
			{#if ISWINDOWS && !useSidebar().open}
				<AppLogoMenu />
			{/if}
			<SidebarTrigger />
			<BackAndForthButtons />
			<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
		</div>
		<div class={cn('z-20 ml-auto flex items-center gap-2 px-3', ISWINDOWS && 'mr-30')}></div>
		{#if ISWINDOWS}
			<Separator orientation="vertical" class="h-4" />
			<WindowsButtons />
		{/if}
	</header>
	<main class="mx-auto w-full max-w-3xl flex-1 grow overflow-auto">
		<div class="mb-4 inline-flex items-center gap-2">
			<IconPicker onSelect={updateIcon}>
				<div
					class={buttonVariants({
						variant: 'ghost',
						class: 'size-24 p-2 [&_img]:aspect-square [&_img]:size-full! [&_svg]:size-full!'
					})}
				>
					<IconRenderer icon={workspace.icon} class="text-muted-foreground text-[5rem]" />
				</div>
			</IconPicker>
			<div class="flex flex-col gap-2">
				<input
					value={workspace.name}
					class="hover:bg-muted truncate rounded px-1 py-0.5 text-2xl font-bold focus:outline-none"
					onchange={(e) => {
						const target = e.target as HTMLInputElement;
						const value = target.value;
						if (value.trim() === '') return;
						updateName(target.value);
					}}
				/>
				<div class="text-muted-foreground inline-flex items-center justify-between">
					<span class="inline-flex items-center gap-1 text-xs">
						<Calendar size={12} />
						<span>{timeAgo(workspace.created_at)}</span>
					</span>
					<span class="inline-flex items-center gap-1 text-xs">
						<Clock size={12} />
						<span>{timeAgo(workspace.updated_at)}</span>
					</span>
				</div>
			</div>
		</div>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			<Button
				class="group bg-muted/30 hover:bg-muted/50 flex h-48 flex-col items-center justify-center rounded-xl border border-dashed transition-colors"
				onclick={() => (openNewNote = true)}
			>
				<div
					class="bg-background mb-2 flex size-10 items-center justify-center rounded-full shadow-sm transition-all duration-500 group-hover:scale-110"
				>
					<Plus class="text-primary size-5" />
				</div>
				<span class="text-muted-foreground font-medium">Create New Note</span>
			</Button>

			{#each notes as note (note.id)}
				<Card.Root
					class="group relative h-48 cursor-pointer overflow-hidden transition-all hover:shadow-md"
					onclick={() => openNote(note)}
				>
					<Card.Header class="pb-2">
						<div class="flex items-start justify-between gap-2">
							<div class="flex items-center gap-2">
								<div
									class="bg-secondary/50 flex size-8 shrink-0 items-center justify-center rounded-md"
								>
									<IconRenderer icon={note.icon} class="size-4" />
								</div>
								<Card.Title class="line-clamp-1 text-base font-medium">
									{note.name}
								</Card.Title>
							</div>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									<Button
										variant="ghost"
										size="icon"
										class="size-8 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<MoreVertical class="size-4" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content>
									<DropdownMenu.Item onclick={() => exportNote(note)}>
										<ArrowDownToLine />
										Export Notes
									</DropdownMenu.Item>
									<DropdownMenu.Sub>
										<DropdownMenu.SubTrigger disabled={localWorkspaces.getWorkspaces().length === 1}
											>Move to...</DropdownMenu.SubTrigger
										>
										<DropdownMenu.SubContent>
											{#each localWorkspaces.getWorkspaces() as workspace (workspace.id)}
												{#if String(workspace.id) !== data.id}
													<DropdownMenu.Item onclick={() => moveToWorkspace(note, workspace)}>
														{workspace.name}
													</DropdownMenu.Item>
												{/if}
											{/each}
										</DropdownMenu.SubContent>
									</DropdownMenu.Sub>
									<DropdownMenu.Separator />
									<DropdownMenu.Item variant="destructive" onclick={() => trashNote(note)}>
										<Trash2 class="mr-2 size-4" />
										Trash Note
									</DropdownMenu.Item>
									<DropdownMenu.Item variant="destructive" onclick={() => deleteNote(note)}>
										<Trash2 class="mr-2 size-4" />
										Delete Note
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="absolute right-4 bottom-4 left-4">
							<div class="text-muted-foreground flex items-center justify-between text-xs">
								<div class="flex items-center gap-1">
									<Clock class="size-3" />
									{timeAgo(note.updated_at)}
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</main>
{:else}
	<div class="flex h-full items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-semibold">Workspace not found</h2>
			<p class="text-muted-foreground">The requested workspace could not be found.</p>
			<Button variant="link" href="/">Go Home</Button>
		</div>
	</div>
{/if}
