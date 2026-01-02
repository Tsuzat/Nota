<script lang="ts">
import { toast } from '@lib/components/ui/sonner/index.js';
import { cn } from '@lib/utils.js';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import { Separator } from '@nota/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@nota/ui/shadcn/sidebar';
import { ask } from '@tauri-apps/plugin-dialog';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import AppLogoMenu from '$lib/components/app-menu.svelte';
import BackAndForthButtons from '$lib/components/back-and-forth-buttons.svelte';
import NewNotes from '$lib/components/dialogs/new-notes.svelte';
import WindowsButtons from '$lib/components/windows-buttons.svelte';
import { DB } from '$lib/local/db';
import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
import { getLocalWorkspaces, type LocalWorkSpace } from '$lib/local/workspaces.svelte';
import { ISMACOS, ISWINDOWS, importNotes, timeAgo, writeStringToFile } from '$lib/utils';

let { data } = $props();

const localWorkspaces = getLocalWorkspaces();
const localNotes = getLocalNotes();

// Derived state
const workspace = $derived(localWorkspaces.getWorkspaces().find((w) => String(w.id) === data.id));
const notes = $derived(localNotes.getNotes().filter((n) => String(n.workspace) === data.id && !n.trashed));
let openNewNote = $state(false);

function openNote(note: LocalNote) {
  goto(resolve('/(local)/local-note-[id]', { id: note.id }));
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
    okLabel: 'Yes, Move',
  });
  if (!ok) return;
  note.workspace = newWorkspace.id;
  await localNotes.updateNote(note);
}

async function exportNote(note: LocalNote) {
  const id = toast.loading(`Exporting ${note.name}`);
  try {
    const data = await DB.select<{ content: string }[]>('SELECT content FROM notes WHERE id = $1', [note.id]);
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

async function importNote() {
  const id = toast.loading('Importing note...');
  const data = await importNotes(undefined, true);
  if (!data) {
    toast.error('Something went wrong. We could not import the note.', { id });
    return;
  }
  if (!workspace) {
    toast.error('Workspace not found.', { id });
    return;
  }
  toast.info('Storing note locally...', { id });
  await localNotes.createNote(data.name, 'lucide:FileText', false, workspace, workspace.userworkspace);
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
				useSidebar().open && 'md:ml-0'
			)}
		>
			{#if ISWINDOWS && !useSidebar().open}
				<AppLogoMenu />
			{/if}
			<SidebarTrigger />
			<BackAndForthButtons />
			<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
		</div>
		{#if ISWINDOWS}
			<Separator orientation="vertical" class="h-4" />
			<WindowsButtons />
		{/if}
	</header>
	<main class="mx-auto w-full max-w-3xl flex-1 grow overflow-auto p-2">
		<div class="mb-4 flex items-center gap-2">
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
				<div class="text-muted-foreground flex items-center gap-4">
					<SimpleToolTip content="Created At">
						<Button variant="ghost" size="sm">
							<icons.CalendarDays />
							{timeAgo(workspace.created_at)}
						</Button>
					</SimpleToolTip>
					<SimpleToolTip content="Last Updated At">
						<Button variant="ghost" size="sm">
							<icons.Clock />
							{timeAgo(workspace.updated_at)}
						</Button>
					</SimpleToolTip>
				</div>
			</div>
			<div class="ml-auto">
				<SimpleToolTip content="Import Note from JSON file">
					<Button variant="outline" onclick={importNote}>
						<icons.Download />
						<span class="hidden sm:block">Import Note</span>
					</Button>
				</SimpleToolTip>
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
					<icons.Plus class="text-primary size-5" />
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
								<Button variant="ghost" size="icon" class="bg-muted">
									<IconRenderer icon={note.icon} />
								</Button>
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
										<icons.EllipsisVertical class="size-4" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content>
									<DropdownMenu.Item onclick={() => exportNote(note)}>
										<icons.ArrowDownToLine />
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
									<DropdownMenu.Item
										variant="destructive"
										onclick={() => localNotes.trashNote(note)}
									>
										<icons.Trash2 class="mr-2 size-4" />
										Trash Note
									</DropdownMenu.Item>
									<DropdownMenu.Item
										variant="destructive"
										onclick={() => localNotes.deleteNote(note)}
									>
										<icons.Trash2 class="mr-2 size-4" />
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
									<icons.Clock class="size-3" />
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
