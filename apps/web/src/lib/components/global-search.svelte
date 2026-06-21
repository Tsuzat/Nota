<script lang="ts" module>
let open = $state(false);
export const openGlobalSearch = () => {
  open = true;
};
</script>

<script lang="ts">
  import { getNotesContext, getWorkspacesContext, type Workspace } from "@nota/client";
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { IconRenderer, icons } from "@nota/ui/icons/index.js";
  import * as Command from "@nota/ui/shadcn/command";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { openNewNote } from "$lib/components/dialogs";
  import { openNewWorkspace } from "$lib/components/dialogs/new-workspace.svelte";
  import { toast } from "@nota/ui/shadcn/sonner";

  const cloudWorkspaces = getWorkspacesContext();
  const cloudNotes = getNotesContext();

  const activeWorkspaceId = $derived(page.params.id);

  const workspaces = $derived.by(() => {
    return cloudWorkspaces.workspaces;
  });

  const notes = $derived.by(() => {
    return cloudNotes.notes.filter(
      (n) => !n.deleted_at,
    );
  });

  const trashedNotes = $derived.by(() => {
    return cloudNotes.notes.filter(
      (n) => n.deleted_at,
    );
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open = true;
    }
  }

  function switchWorkspace(workspace: Workspace) {
    if (String(activeWorkspaceId) === String(workspace.id)) {
      return toast.info("Already in this workspace.")
    }
  }
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog
  bind:open={open}
  class="border"
  title="Search"
  description="Search notes, workspaces, and actions"
>
  <Command.Input
    class="h-10 p-2 transition-colors"
    placeholder="Search notes, workspaces, and actions..."
  />
  <Command.List>
    <Command.Empty>
      <div class="flex flex-col items-center gap-2 py-4">
        <icons.SearchX class="text-muted-foreground size-8" />
        <p class="text-muted-foreground text-sm">No results found</p>
      </div>
    </Command.Empty>

    <!-- Quick Actions -->
    <Command.Group heading="Quick Actions">
      <Command.Item
        value="home"
        onselect={() => {
          goto(resolve("/home"));
          open = false;
        }}
        onclick={() => {
          goto(resolve("/home"));
          open = false;
        }}
      >
        <icons.House class="mr-2 size-4" />
        <span>Go Home</span>
        <Command.Shortcut>
          <kbd class="bg-muted rounded px-1 py-0.5 text-[10px]">⌘H</kbd>
        </Command.Shortcut>
      </Command.Item>
      <Command.Item
        value="new note"
        onselect={() => {
          openNewNote();
          open = false;
        }}
        onclick={() => {
          openNewNote();
          open = false;
        }}
      >
        <icons.FilePlus class="mr-2 size-4" />
        <span>New Note</span>
      </Command.Item>
      <Command.Item
        value="new workspace"
        onselect={() => {
          openNewWorkspace();
          open = false;
        }}
        onclick={() => {
          openNewWorkspace();
          open = false;
        }}
      >
        <icons.FolderPlus class="mr-2 size-4" />
        <span>New Workspace</span>
      </Command.Item>
    </Command.Group>

    <Command.Separator />

    <!-- Workspaces -->
    <Command.Group
      value="Workspaces"
      heading={"Workspaces · " + workspaces.length}
    >
      {#each workspaces as workspace (workspace.id)}
        {@const isActive =
          activeWorkspaceId &&
          String(activeWorkspaceId) === String(workspace.id)}
        {@const onselect = () => {
          goto(
            resolve("/(app)/workspace-[id]", { id: workspace.id }),
          );
          switchWorkspace(workspace);
          open = false;
        }}
        <Command.Item
          itemid={workspace.id.toString()}
          value={workspace.name}
          {onselect}
          onclick={onselect}
        >
          <IconRenderer icon={workspace.icon} class="mr-2 size-4" />
          <span>{workspace.name}</span>
          <Command.Shortcut class="flex items-center gap-1.5">
            {#if isActive}
              <span
                class="bg-primary/10 text-primary rounded px-1 py-0.5 text-[9px] font-semibold"
                >Active</span
              >
            {/if}
            <SimpleToolTip content="Cloud">
              <icons.Cloud class="size-3 opacity-50" />
            </SimpleToolTip>
          </Command.Shortcut>
        </Command.Item>
      {/each}
    </Command.Group>

    <Command.Separator />

    <!-- Notes -->
    <Command.Group value="Notes" heading={"Notes · " + notes.length}>
      {#each notes as note (note.id)}
        {@const onselect = () => {
          goto(resolve("/(app)/note-[id]", {id: note.id}));
          open = false;
        }}
        <Command.Item
          itemid={note.id.toString()}
          value={note.name}
          {onselect}
          onclick={onselect}
        >
          <IconRenderer icon={note.icon} class="mr-2 size-4" />
          <span class="flex-1 truncate">{note.name}</span>
          <Command.Shortcut class="flex items-center gap-1.5">
            {#if note.pinned}
              <SimpleToolTip content="Pinned">
                <icons.Pin class="size-3 fill-amber-500 text-amber-500" />
              </SimpleToolTip>
            {/if}
            <icons.Cloud class="size-3 opacity-40" />
          </Command.Shortcut>
        </Command.Item>
      {/each}
    </Command.Group>

    <!-- Trash (only show if there are trashed notes) -->
    {#if trashedNotes.length > 0}
      <Command.Separator />
      <Command.Group value="Trash" heading={"Trash · " + trashedNotes.length}>
        {#each trashedNotes as note (note.id)}
          {@const onselect = () => {
            goto(resolve("/(app)/note-[id]", {id: note.id}));
            open = false;
          }}
          <Command.Item
            itemid={note.id.toString()}
            value={note.name + " trash"}
            {onselect}
            onclick={onselect}
            class="opacity-60"
          >
            <IconRenderer icon={note.icon} class="mr-2 size-4" />
            <span class="flex-1 truncate line-through">{note.name}</span>
            <Command.Shortcut class="flex items-center gap-1.5">
              <SimpleToolTip content="Trashed">
                <icons.Trash2 class="size-3 text-destructive" />
              </SimpleToolTip>
            </Command.Shortcut>
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
