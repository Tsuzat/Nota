<script lang="ts">
import type { Content } from '@lib/components/edra/types.js';
import { getNotesContext, getWorkspacesContext, type Note, type Workspace } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import { toast } from '@nota/ui/shadcn/sonner';
import { timeAgo } from '@nota/ui/utils';
import { ask } from '@tauri-apps/plugin-dialog';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { openNewNote } from '$lib/components/dialogs/index.js';
import Topbar from '$lib/components/topbar.svelte';
import { importNotes, writeStringToFile } from '$lib/utils';

let { data } = $props();

const cloudWorkspaces = getWorkspacesContext();
const cloudNotes = getNotesContext();

// Derived state
const workspace = $derived(cloudWorkspaces.workspaces.find((w) => w.id === data.id));
const notes = $derived(
  cloudNotes.notes.filter((n) => n.workspace_id === data.id && !n.deleted_at && !n.parent_note_id)
);

function openNote(note: Note) {
  goto(resolve('/(cloud)/note-[id]', { id: note.id }));
}

async function updateWorkspace(icon: string, name: string) {
  if (!workspace) return;
  workspace.icon = icon;
  workspace.name = name;
  await cloudWorkspaces.update(icon, name, workspace.id);
}

async function moveToWorkspace(note: Note, newWorkspace: Workspace) {
  toast.warning('To be implemented..');
  const ok = await ask(`Move note ${note.name} to workspace ${newWorkspace.name}?`, {
    title: 'Move Note',
    kind: 'info',
    okLabel: 'Yes, Move',
  });
  if (!ok) return;
  note.workspace_id = newWorkspace.id;
  await cloudNotes.update(note.id, { workspace_id: newWorkspace.id });
}

async function exportNote(note: Note) {
  const id = toast.loading(`Exporting ${note.name}`);
  try {
    const content: Content = await cloudNotes.fetchContent(note.id);
    await writeStringToFile(JSON.stringify(content), `${note.name}.json`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    toast.dismiss(id);
  }
}

async function trashNote(note: Note) {
  const ok = await ask(`Trash note ${note.name}?`, {
    title: 'Trash Note',
    kind: 'info',
    okLabel: 'Yes, Trash',
  });
  if (!ok) return;
  note.deleted_at = new Date();
  await cloudNotes.update(note.id, { deleted_at: note.deleted_at });
}

async function importNote() {
  const id = toast.loading('Importing note...');
  const data = await importNotes(undefined, true);
  if (!data) {
    toast.error('Something went wrong. We could not import the note.', {
      id,
    });
    return;
  }
  if (!workspace) {
    toast.error('Workspace not found.', { id });
    return;
  }
  toast.loading('Pushing note to cloud...', { id });
  await cloudNotes.import(data.name, workspace.id, data.content);
  toast.success('Note pushed to cloud.', { id });
}
</script>

{#if workspace}
  <Topbar showSeparator={false} />
  <main class="mx-auto w-full max-w-3xl flex-1 grow overflow-auto p-2">
    <div class="mb-4 flex items-center gap-2">
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
      <div class="ml-auto">
        <SimpleToolTip content="Import Note from JSON file">
          <Button variant="outline" onclick={importNote}>
            <icons.Download />
            <span class="hidden sm:block">Import Note</span>
          </Button>
        </SimpleToolTip>
      </div>
    </div>
    <div
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <Button
        class="group bg-muted/30 hover:bg-muted/50 flex h-48 flex-col items-center justify-center rounded-xl border border-dashed transition-colors"
        onclick={() => openNewNote()}
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
                    <DropdownMenu.SubTrigger
                      disabled={cloudWorkspaces.workspaces.length === 1}
                      >Move to...</DropdownMenu.SubTrigger
                    >
                    <DropdownMenu.SubContent>
                      {#each cloudWorkspaces.workspaces as workspace (workspace.id)}
                        {#if workspace.id !== data.id}
                          <DropdownMenu.Item
                            onclick={() => moveToWorkspace(note, workspace)}
                          >
                            {workspace.name}
                          </DropdownMenu.Item>
                        {/if}
                      {/each}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    variant="destructive"
                    onclick={() => trashNote(note)}
                  >
                    <icons.Trash2 class="mr-2 size-4" />
                    Trash Note
                  </DropdownMenu.Item>
                  <!-- <DropdownMenu.Item
                    variant="destructive"
                    onclick={() => deleteNote(note)}
                  >
                    <icons.Trash2 class="mr-2 size-4" />
                    Delete Note
                  </DropdownMenu.Item> -->
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </Card.Header>
          <Card.Content>
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
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </main>
{:else}
  <div class="flex h-full items-center justify-center">
    <div class="text-center">
      <h2 class="text-xl font-semibold">Workspace not found</h2>
      <p class="text-muted-foreground">
        The requested workspace could not be found.
      </p>
      <Button variant="link" href="/">Go Home</Button>
    </div>
  </div>
{/if}
