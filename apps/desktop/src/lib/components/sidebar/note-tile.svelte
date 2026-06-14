<script lang="ts">
  import * as Sidebar from "@nota/ui/shadcn/sidebar";
  import * as Collapsible from "@nota/ui/shadcn/collapsible";
  import { getLocalNotes, type LocalNote } from "$lib/local/notes.svelte";
  import { getNotesContext, type Note } from "@nota/client";
  import { IconRenderer, icons } from "@lib/icons";
  import NoteTile from "./note-tile.svelte";
  import { resolve } from "$app/paths";
  import { cn } from "@lib/utils";
  import { page } from "$app/state";

  interface Props {
    note: LocalNote | Note;
    depth?: number;
  }
  const { note, depth = 0 }: Props = $props();
  const childNotes = $derived.by(() => {
    const allNotes =
      "owner" in note ? getNotesContext().notes : getLocalNotes().getNotes();
    return allNotes.filter(
      (n) => n.parent_note_id === note.id && !n.deleted_at,
    );
  });
</script>

<Collapsible.Root>
  {@const href =
    "owner" in note
      ? resolve("/(cloud)/note-[id]", { id: note.id })
      : resolve("/(local)/local-note-[id]", { id: note.id })}
  {@const isActive = page.url.pathname.endsWith(href)}
  <Sidebar.MenuItem class="my-px" style={`margin-left: ${depth}rem`}>
    <Sidebar.MenuButton class={cn(isActive && "bg-muted")}>
      {#snippet child({ props })}
        {@const href =
          "owner" in note
            ? resolve("/(cloud)/note-[id]", { id: note.id })
            : resolve("/(local)/local-note-[id]", { id: note.id })}
        <a {href} {...props}>
          <IconRenderer class="size-4 shrink-0" icon={note.icon} />
          <span>{note.name}</span>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
    <Collapsible.Trigger>
      {#snippet child({ props })}
        <Sidebar.MenuAction
          {...props}
          class="bg-sidebar-accent size-5! text-sidebar-accent-foreground inset-s-1 data-[state=open]:rotate-90"
          showOnHover
        >
          <icons.ChevronRight />
        </Sidebar.MenuAction>
      {/snippet}
    </Collapsible.Trigger>
    <Sidebar.MenuAction showOnHover>
      <icons.Plus />
    </Sidebar.MenuAction>
    <Collapsible.Content>
      <Sidebar.MenuItem>
        {#if childNotes.length > 0}
          {#each childNotes as note (note.id)}
            <NoteTile {note} depth={depth + 1} />
          {/each}
        {:else}
          <div class="ml-6 flex my-px items-center gap-1 text-muted-foreground">
            <icons.File class="size-4" />
            <small>No Sub Notes...</small>
          </div>
        {/if}
      </Sidebar.MenuItem>
    </Collapsible.Content>
  </Sidebar.MenuItem>
</Collapsible.Root>
