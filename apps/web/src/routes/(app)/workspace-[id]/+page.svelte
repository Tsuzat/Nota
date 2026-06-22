<script lang="ts">
import { getNotesContext, getWorkspacesContext, type Note, type Workspace } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import { toast } from '@nota/ui/shadcn/sonner';
import { timeAgo } from '@nota/ui/utils';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { openNewNote } from '$lib/components/dialogs/index.js';
import Topbar from '$lib/components/topbar.svelte';

const cloudWorkspaces = getWorkspacesContext();
const cloudNotes = getNotesContext();

const activeWorkspaceId = $derived(page.params.id);
const workspace = $derived(cloudWorkspaces.workspaces.find((w) => String(w.id) === String(activeWorkspaceId)));
const notes = $derived(
  cloudNotes.notes.filter(
    (n) => String(n.workspace_id) === String(activeWorkspaceId) && !n.deleted_at && !n.parent_note_id
  )
);

let fileInput = $state<HTMLInputElement | null>(null);

function openNote(note: Note) {
  goto(resolve('/(app)/note-[id]', { id: note.id }));
}

async function updateWorkspace(icon: string, name: string) {
  if (!workspace) return;
  workspace.icon = icon;
  workspace.name = name;
  try {
    await cloudWorkspaces.update(workspace.id, name, icon);
    toast.success('Workspace updated successfully');
  } catch (e) {
    console.error(e);
    toast.error('Failed to update workspace');
  }
}

async function moveToWorkspace(note: Note, newWorkspace: Workspace) {
  const confirmed = confirm(`Move note "${note.name}" to workspace "${newWorkspace.name}"?`);
  if (!confirmed) return;
  try {
    await cloudNotes.moveNote(note.id, String(newWorkspace.id), null);
    toast.success('Note moved successfully');
  } catch (e) {
    console.error(e);
    toast.error('Failed to move note');
  }
}

async function exportNote(note: Note) {
  const id = toast.loading(`Exporting ${note.name}...`);
  try {
    const content = await cloudNotes.fetchContent(note.id);
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ name: note.name, content }))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${note.name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Note exported successfully', { id });
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Unknown error', { id });
  }
}

async function trashNote(note: Note) {
  const confirmed = confirm(`Trash note "${note.name}"? You can restore it later from the trash.`);
  if (!confirmed) return;
  try {
    await cloudNotes.update(note.id, { deleted_at: new Date() });
    toast.success('Moved to Trash');
  } catch (e) {
    console.error(e);
    toast.error('Failed to trash note');
  }
}

async function triggerImport() {
  fileInput?.click();
}

async function handleFileImport(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const id = toast.loading('Importing note...');
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.name || !data.content) {
      throw new Error('Invalid note format. Missing name or content.');
    }
    if (!workspace) {
      throw new Error('Workspace not found.');
    }
    await cloudNotes.import(data.name, workspace.id, data.content);
    toast.success('Note imported successfully', { id });
  } catch (err) {
    console.error(err);
    toast.error(err instanceof Error ? err.message : 'Import failed', { id });
  } finally {
    target.value = ''; // clear input
  }
}
</script>

<input
  type="file"
  accept=".json"
  bind:this={fileInput}
  class="hidden"
  onchange={handleFileImport}
/>

{#if workspace}
  <Topbar showSeparator={false} />
  <main class="mx-auto w-full max-w-5xl flex-1 grow overflow-auto p-4 md:p-10 animate-in fade-in duration-500">
    <div class="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b pb-6">
      <div class="flex items-center gap-6">
        <IconPicker
          onSelect={(icon: string) => (workspace.icon = icon)}
          onClose={() => updateWorkspace(workspace.icon, workspace.name)}
        >
          <div
            class={buttonVariants({
              variant: "ghost",
              class: "size-24 p-2 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors [&_img]:aspect-square [&_img]:size-full! [&_svg]:size-full!",
            })}
          >
            <IconRenderer
              icon={workspace.icon}
              class="text-primary text-[4.5rem]"
            />
          </div>
        </IconPicker>
        <div class="flex flex-col gap-2">
          <input
            value={workspace.name}
            class="hover:bg-muted/50 rounded-xl px-2 py-1 text-4xl font-bold tracking-tight focus:outline-none focus:bg-muted/50 focus:ring-2 ring-primary/20 transition-all w-full max-w-md bg-transparent"
            onchange={(e) => {
              const target = e.target as HTMLInputElement;
              const value = target.value;
              if (value.trim() === "") return;
              updateWorkspace(workspace.icon, value);
            }}
          />
          <div class="text-muted-foreground flex items-center gap-4 text-sm px-2">
            <SimpleToolTip content="Created At">
              <span class="flex items-center gap-1.5 opacity-80">
                <icons.CalendarDays class="size-4" />
                {timeAgo(workspace.created_at)}
              </span>
            </SimpleToolTip>
            <span class="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
            <SimpleToolTip content="Last Updated At">
              <span class="flex items-center gap-1.5 opacity-80">
                <icons.Clock class="size-4" />
                {timeAgo(workspace.updated_at)}
              </span>
            </SimpleToolTip>
          </div>
        </div>
      </div>
      <div class="sm:ml-auto shrink-0 flex items-center gap-3">
        <SimpleToolTip content="Import Note from JSON file">
          <Button variant="outline" size="sm" onclick={triggerImport} class="gap-2 rounded-full px-4 h-10 shadow-sm hover:shadow-md transition-all">
            <icons.Download class="size-4" />
            <span>Import</span>
          </Button>
        </SimpleToolTip>
        <Button size="sm" onclick={() => openNewNote(String(workspace.id))} class="gap-2 rounded-full px-4 h-10 shadow-sm hover:shadow-md transition-all">
          <icons.Plus class="size-4" />
          <span>New Note</span>
        </Button>
      </div>
    </div>

    {#if notes.length === 0}
      <div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-muted p-16 text-center mt-10">
        <div class="mx-auto flex size-20 items-center justify-center rounded-full bg-muted/50 text-muted-foreground shadow-sm mb-6">
          <icons.FileText class="size-8" />
        </div>
        <h2 class="text-xl font-semibold mb-2">This workspace is empty</h2>
        <p class="text-muted-foreground mb-6 max-w-sm">
          Start capturing your thoughts by creating your first note here.
        </p>
        <Button onclick={() => openNewNote(String(workspace.id))} class="gap-2 rounded-full">
          <icons.Plus class="size-4" />
          Create Note
        </Button>
      </div>
    {:else}
      <div
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <Button
          class="group bg-muted/10 hover:bg-muted/30 flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed transition-all duration-300 hover:border-primary/40 hover:shadow-sm"
          onclick={() => openNewNote(String(workspace.id))}
        >
          <div
            class="bg-background mb-3 flex size-12 items-center justify-center rounded-full shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/10"
          >
            <icons.Plus class="text-primary size-6" />
          </div>
          <span class="text-muted-foreground font-medium text-sm">Create New Note</span>
        </Button>

        {#each notes as note (note.id)}
          <Card.Root
            class="group relative h-48 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 flex flex-col justify-between bg-card/80 backdrop-blur-sm"
            onclick={() => openNote(note)}
          >
            <Card.Header class="pb-2 p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="bg-linear-to-br from-secondary to-muted size-10 shrink-0 flex items-center justify-center rounded-xl shadow-inner mt-0.5">
                    <IconRenderer icon={note.icon} class="size-5 text-foreground/80" />
                  </div>
                  <Card.Title class="line-clamp-2 text-base font-semibold leading-snug mt-1 group-hover:text-primary transition-colors">
                    {note.name}
                  </Card.Title>
                </div>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 z-10 relative"
                        {...props}
                        onclick={(e) => e.stopPropagation()}
                      >
                        <icons.EllipsisVertical class="size-4" />
                      </Button>
                    {/snippet}
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content onclick={(e) => e.stopPropagation()} class="rounded-xl shadow-lg">
                    <DropdownMenu.Item onclick={() => exportNote(note)}>
                      <icons.ArrowDownToLine class="size-4 mr-2" />
                      Export Note
                    </DropdownMenu.Item>
                    {#if cloudWorkspaces.workspaces.length > 1}
                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger>
                          <icons.FolderSymlink class="size-4 mr-2" />
                          Move to...
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent class="rounded-xl shadow-lg">
                          {#each cloudWorkspaces.workspaces as ws (ws.id)}
                            {#if String(ws.id) !== String(workspace.id)}
                              <DropdownMenu.Item
                                onclick={() => moveToWorkspace(note, ws)}
                              >
                                {ws.name}
                              </DropdownMenu.Item>
                            {/if}
                          {/each}
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Sub>
                    {/if}
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      variant="destructive"
                      onclick={() => trashNote(note)}
                    >
                      <icons.Trash2 class="size-4 mr-2" />
                      Trash Note
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </Card.Header>
            <Card.Content class="p-5 pt-0 mt-auto">
              <div class="flex items-center justify-between text-xs text-muted-foreground/70 font-medium">
                <div class="flex items-center gap-1.5">
                  <icons.Clock class="size-3.5" />
                  {timeAgo(note.updated_at)}
                </div>
                {#if note.pinned}
                  <icons.Pin class="size-3.5 text-amber-500 fill-amber-500" />
                {/if}
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </main>
{:else}
  <div class="flex h-full items-center justify-center animate-in fade-in">
    <div class="text-center p-8 max-w-md">
      <div class="mx-auto flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <icons.CircleAlert class="size-10" />
      </div>
      <h2 class="text-2xl font-bold mb-3">Workspace not found</h2>
      <p class="text-muted-foreground mb-8">
        The requested workspace could not be found or you do not have permission to view it.
      </p>
      <Button variant="default" href="/home" class="rounded-full px-8 shadow-md">Go to Dashboard</Button>
    </div>
  </div>
{/if}
