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
  goto(resolve(`/w/${note.workspace_id}/notes/${note.id}`));
}

async function updateWorkspace(icon: string, name: string) {
  if (!workspace) return;
  workspace.icon = icon;
  workspace.name = name;
  try {
    await cloudWorkspaces.update(icon, name, workspace.id);
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
  <main class="mx-auto w-full max-w-3xl flex-1 grow overflow-auto p-4 md:p-6">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="flex items-center gap-4">
        <IconPicker
          onSelect={(icon: string) => (workspace.icon = icon)}
          onClose={() => updateWorkspace(workspace.icon, workspace.name)}
        >
          <div
            class={buttonVariants({
              variant: "ghost",
              class: "size-20 p-1 [&_img]:aspect-square [&_img]:size-full! [&_svg]:size-full!",
            })}
          >
            <IconRenderer
              icon={workspace.icon}
              class="text-muted-foreground text-[4rem]"
            />
          </div>
        </IconPicker>
        <div class="flex flex-col gap-1.5">
          <input
            value={workspace.name}
            class="hover:bg-muted truncate rounded px-1.5 py-0.5 text-2xl font-bold focus:outline-none focus:bg-muted w-full max-w-md"
            onchange={(e) => {
              const target = e.target as HTMLInputElement;
              const value = target.value;
              if (value.trim() === "") return;
              updateWorkspace(workspace.icon, value);
            }}
          />
          <div class="text-muted-foreground flex items-center gap-4 text-xs">
            <SimpleToolTip content="Created At">
              <span class="flex items-center gap-1">
                <icons.CalendarDays class="size-3.5" />
                {timeAgo(workspace.created_at)}
              </span>
            </SimpleToolTip>
            <SimpleToolTip content="Last Updated At">
              <span class="flex items-center gap-1">
                <icons.Clock class="size-3.5" />
                {timeAgo(workspace.updated_at)}
              </span>
            </SimpleToolTip>
          </div>
        </div>
      </div>
      <div class="sm:ml-auto shrink-0">
        <SimpleToolTip content="Import Note from JSON file">
          <Button variant="outline" size="sm" onclick={triggerImport} class="gap-1.5">
            <icons.Download class="size-4" />
            <span>Import Note</span>
          </Button>
        </SimpleToolTip>
      </div>
    </div>

    <div
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <Button
        class="group bg-muted/20 hover:bg-muted/40 flex h-44 flex-col items-center justify-center rounded-xl border border-dashed transition-colors"
        onclick={() => openNewNote(String(workspace.id))}
      >
        <div
          class="bg-background mb-2 flex size-10 items-center justify-center rounded-full shadow-sm transition-all duration-300 group-hover:scale-110"
        >
          <icons.Plus class="text-primary size-5" />
        </div>
        <span class="text-muted-foreground font-medium text-sm">Create New Note</span>
      </Button>

      {#each notes as note (note.id)}
        <Card.Root
          class="group relative h-44 cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-muted-foreground/30 flex flex-col justify-between"
          onclick={() => openNote(note)}
        >
          <Card.Header class="pb-2 p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="bg-secondary size-9 shrink-0 flex items-center justify-center rounded-lg">
                  <IconRenderer icon={note.icon} class="size-4" />
                </div>
                <Card.Title class="line-clamp-2 text-sm font-medium leading-snug">
                  {note.name}
                </Card.Title>
              </div>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      {...props}
                      onclick={(e) => e.stopPropagation()}
                    >
                      <icons.EllipsisVertical class="size-4" />
                    </Button>
                  {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content onclick={(e) => e.stopPropagation()}>
                  <DropdownMenu.Item onclick={() => exportNote(note)}>
                    <icons.ArrowDownToLine class="size-4" />
                    Export Note
                  </DropdownMenu.Item>
                  {#if cloudWorkspaces.workspaces.length > 1}
                    <DropdownMenu.Sub>
                      <DropdownMenu.SubTrigger>Move to...</DropdownMenu.SubTrigger>
                      <DropdownMenu.SubContent>
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
                    <icons.Trash2 class="size-4" />
                    Trash Note
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </Card.Header>
          <Card.Content class="p-4 pt-0">
            <div class="flex items-center justify-between text-[11px] text-muted-foreground">
              <div class="flex items-center gap-1">
                <icons.Clock class="size-3" />
                {timeAgo(note.updated_at)}
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </main>
{:else}
  <div class="flex h-full items-center justify-center">
    <div class="text-center p-6">
      <h2 class="text-xl font-semibold mb-2">Workspace not found</h2>
      <p class="text-muted-foreground mb-4">
        The requested workspace could not be found or you do not have permission to view it.
      </p>
      <Button variant="outline" href="/w">Go to Workspace Home</Button>
    </div>
  </div>
{/if}
