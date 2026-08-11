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
import { openMoveNote, openNewNote } from '$lib/components/dialogs/index.js';
import Topbar from '$lib/components/topbar.svelte';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';

let { data } = $props();

const cloudWorkspaces = getWorkspacesContext();
const cloudNotes = getNotesContext();
const currentWorkspaceCtx = getCurrentWorkspace();

// Derived state
const workspace = $derived(cloudWorkspaces.workspaces.find((w) => w.id === data.id));
const notes = $derived(
  cloudNotes.notes.filter((n) => n.workspace_id === data.id && !n.deleted_at && !n.parent_note_id)
);

// Auto-sync sidebar context when this page loads
$effect(() => {
  if (workspace && currentWorkspaceCtx && currentWorkspaceCtx.get()?.id !== workspace.id) {
    currentWorkspaceCtx.set(workspace);
  }
});

function openNote(note: Note) {
  goto(resolve('/(app)/n/[id]', { id: note.id }));
}

async function updateWorkspace(icon: string, name: string) {
  if (!workspace) return;
  workspace.icon = icon;
  workspace.name = name;
  await cloudWorkspaces.update(workspace.id, name, icon);
}

async function moveToWorkspace(note: Note, newWorkspace: Workspace) {
  const ok = window.confirm(`Move note ${note.name} to workspace ${newWorkspace.name}?`);
  if (!ok) return;
  note.workspace_id = newWorkspace.id;
  await cloudNotes.update(note.id, { workspace_id: newWorkspace.id });
}

async function exportNote(note: Note) {
  const id = toast.loading(`Exporting ${note.name}`);
  try {
    const content = await cloudNotes.fetchContent(note.id);
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.name || 'Untitled'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    toast.dismiss(id);
  }
}

async function trashNote(note: Note) {
  const ok = window.confirm(`Trash note ${note.name}?`);
  if (!ok) return;
  note.deleted_at = new Date();
  await cloudNotes.update(note.id, { deleted_at: note.deleted_at });
}

async function togglePin(note: Note) {
  note.pinned = !note.pinned;
  await cloudNotes.update(note.id, { pinned: note.pinned });
}

async function deletePermanently(note: Note) {
  const ok = window.confirm(
    `Are you absolutely sure you want to permanently delete '${note.name}'? This action cannot be undone.`
  );
  if (!ok) return;
  try {
    await cloudNotes.delete(note.id);
    toast.success(`Note '${note.name}' permanently deleted`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Unknown error');
  }
}
</script>

<svelte:head>
  <title>Workspace | Nota</title>
</svelte:head>

{#if workspace}
  <div class="flex size-full min-h-0 overflow-hidden flex-col">
    <Topbar showSeparator={false} />
    <main class="flex-1 min-h-0 overflow-auto">
      <div class="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div class="mb-6 flex items-center gap-2">
          <IconPicker
            onSelect={(icon: string) => (workspace.icon = icon)}
            onClose={() => updateWorkspace(workspace.icon, workspace.name)}
          >
            <div
              class={buttonVariants({
                variant: "ghost",
                class:
                  "size-24 p-2 [&_img]:aspect-square [&_img]:size-full! [&_svg]:size-full!",
              })}
            >
              <IconRenderer
                icon={workspace.icon}
                class="text-muted-foreground text-[5rem]"
              />
            </div>
          </IconPicker>
          <div class="flex flex-col gap-2">
            <input
              value={workspace.name}
              class="hover:bg-muted truncate rounded px-1 py-0.5 text-2xl font-bold focus:outline-none"
              onchange={(e) => {
                const target = e.target as HTMLInputElement;
                const value = target.value;
                if (value.trim() === "") return;
                updateWorkspace(workspace.icon, value);
              }}
            />
            <div class="text-muted-foreground flex items-center gap-4">
              <SimpleToolTip content="Created At">
                <Button variant="ghost" size="sm">
                  <icons.CalendarDays />
                  {timeAgo(workspace.created_at.toISOString())}
                </Button>
              </SimpleToolTip>
              <SimpleToolTip content="Last Updated At">
                <Button variant="ghost" size="sm">
                  <icons.Clock />
                  {timeAgo(workspace.updated_at.toISOString())}
                </Button>
              </SimpleToolTip>
            </div>
          </div>
        </div>
        <div
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <Button
            class="group bg-muted/30 hover:bg-muted/50 flex h-48 flex-col items-center justify-center rounded-xl border border-dashed transition-colors"
            onclick={() => openNewNote(workspace.id)}
          >
            <div
              class="bg-background mb-2 flex size-10 items-center justify-center rounded-full shadow-sm transition-all duration-500 group-hover:scale-110"
            >
              <icons.Plus class="text-primary size-5" />
            </div>
            <span class="text-muted-foreground font-medium"
              >Create New Note</span
            >
          </Button>

          {#each notes as note (note.id)}
            <Card.Root
              class="group relative h-48 cursor-pointer overflow-hidden transition-all hover:shadow-md"
              onclick={() => openNote(note)}
            >
              <Card.Header class="pb-2">
                <Button variant="ghost" size="icon">
                  <IconRenderer icon={note.icon} />
                </Button>
                <Card.Title
                  class="line-clamp-1 flex items-center gap-1.5 text-base font-medium"
                >
                  {note.name}
                </Card.Title>
              </Card.Header>
              <Card.Footer>
                <div class="absolute right-4 bottom-4 left-4">
                  <div
                    class="text-muted-foreground flex items-center justify-between text-xs"
                  >
                    <div class="flex items-center gap-1">
                      <icons.Clock class="size-3" />
                      {timeAgo(note.updated_at.toISOString())}
                    </div>
                  </div>
                </div>
              </Card.Footer>
            </Card.Root>
          {/each}
        </div>
      </div>
    </main>
  </div>
{:else}
  <div class="flex h-full items-center justify-center">
    <div class="text-center">
      <h2 class="text-xl font-semibold">Workspace not found</h2>
      <p class="text-muted-foreground">
        The requested workspace could not be found.
      </p>
      <Button variant="link" href="/(app)/home">Go Home</Button>
    </div>
  </div>
{/if}
