<script lang="ts">
import { cn } from '@lib/utils.js';
import SimpleTooltip from '@nota/ui/custom/SimpleToolTip.svelte';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import { Separator } from '@nota/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { ask } from '@tauri-apps/plugin-dialog';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import AppLogoMenu from '$lib/components/app-menu.svelte';
import BackAndForthButtons from '$lib/components/back-and-forth-buttons.svelte';
import NewNotes from '$lib/components/dialogs/new-notes.svelte';
import WindowsButtons from '$lib/components/windows-buttons.svelte';
import { type CloudNote, useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
import { type CloudWorkspace, useCloudWorkspaces } from '$lib/supabase/db/cloudworkspace.svelte';
import { supabase } from '$lib/supabase/index.js';
import { ISMACOS, ISWINDOWS, importNotes, timeAgo, writeStringToFile } from '$lib/utils';

let { data } = $props();

const cloudWorkspaces = useCloudWorkspaces();
const cloudNotes = useCloudNotes();

// Derived state
const workspace = $derived(cloudWorkspaces.getWorkspaces().find((w) => w.id === data.id));
const notes = $derived(cloudNotes.getNotes().filter((n) => n.workspace === data.id && !n.trashed));
let openNewNote = $state(false);

function openNote(note: CloudNote) {
  goto(resolve('/(cloud)/note-[id]', { id: note.id }));
}

async function updateIcon(icon: string) {
  if (!workspace) return;
  workspace.icon = icon;
  await cloudWorkspaces.updateWorkspace(workspace);
}

async function updateName(name: string) {
  if (!workspace) return;
  workspace.name = name;
  await cloudWorkspaces.updateWorkspace(workspace);
}

async function moveToWorkspace(note: CloudNote, newWorkspace: CloudWorkspace) {
  const ok = await ask(`Move note ${note.name} to workspace ${newWorkspace.name}?`, {
    title: 'Move Note',
    kind: 'info',
    okLabel: 'Yes, Move',
  });
  if (!ok) return;
  note.workspace = newWorkspace.id;
  await cloudNotes.updateNote(note);
}

async function exportNote(note: CloudNote) {
  const id = toast.loading(`Exporting ${note.name}`);
  try {
    const { data, error } = await supabase.from('notes').select('content').eq('id', note.id).single();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data) {
      toast.error('Note not found');
      return;
    }
    await writeStringToFile(JSON.stringify(data), `${note.name}.json`);
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
  toast.info('Pushing note to cloud...', { id });
  await cloudNotes.createNote({
    name: data.name,
    workspace: workspace.id,
    userworkspace: workspace.userworkspace,
    owner: workspace.owner,
    icon: 'lucide:FileText',
    content: data.content,
  });
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
		<div class={cn('z-20 ml-auto flex items-center gap-2 px-3', ISWINDOWS && 'mr-30')}></div>
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
					<SimpleTooltip content="Created At">
						<Button variant="ghost" size="sm">
							<icons.CalendarDays />
							{timeAgo(workspace.created_at)}
						</Button>
					</SimpleTooltip>
					<SimpleTooltip content="Last Updated At">
						<Button variant="ghost" size="sm">
							<icons.Clock />
							{timeAgo(workspace.updated_at)}
						</Button>
					</SimpleTooltip>
				</div>
			</div>
			<div class="ml-auto">
				<SimpleTooltip content="Import Note from JSON file">
					<Button variant="outline" onclick={importNote}>
						<icons.Download />
						<span class="hidden sm:block">Import Note</span>
					</Button>
				</SimpleTooltip>
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
										<icons.EllipsisVertical class="size-4" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content>
									<DropdownMenu.Item onclick={() => exportNote(note)}>
										<icons.ArrowDownToLine />
										Export Notes
									</DropdownMenu.Item>
									<DropdownMenu.Sub>
										<DropdownMenu.SubTrigger disabled={cloudWorkspaces.getWorkspaces().length === 1}
											>Move to...</DropdownMenu.SubTrigger
										>
										<DropdownMenu.SubContent>
											{#each cloudWorkspaces.getWorkspaces() as workspace (workspace.id)}
												{#if workspace.id !== data.id}
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
										onclick={() => cloudNotes.moveToTrash(note)}
									>
										<icons.Trash2 class="mr-2 size-4" />
										Trash Note
									</DropdownMenu.Item>
									<DropdownMenu.Item
										variant="destructive"
										onclick={() => cloudNotes.deleteNote(note)}
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
