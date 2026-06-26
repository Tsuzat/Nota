<script lang="ts">
  import { IconRenderer, icons } from "@lib/icons";
  import { cn } from "@lib/utils";
  import { getAuthContext, getNotesContext, type Note } from "@nota/client";
  import * as Collapsible from "@nota/ui/shadcn/collapsible";
  import * as DropdownMenu from "@nota/ui/shadcn/dropdown-menu";
  import * as Sidebar from "@nota/ui/shadcn/sidebar";
  import { toast } from "@nota/ui/shadcn/sonner";
  import { ask } from "@tauri-apps/plugin-dialog";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { getLocalNotes, type LocalNote } from "$lib/local/notes.svelte";
  import { openMoveNote, openNewNote, openRenameNote } from "../dialogs";
  import NoteTile from "./note-tile.svelte";
  import { PUBLIC_NOTA_FRONTEND_URL } from "$env/static/public";
  import { invoke } from "@tauri-apps/api/core";

  interface Props {
    note: LocalNote | Note;
    depth?: number;
  }
  const { note, depth = 0 }: Props = $props();

  const localNotes = getLocalNotes();
  const cloudNotes = getNotesContext();
  const isCloud = $derived("owner" in note);
  const user = $derived(getAuthContext().user);

  const href = $derived(
    isCloud
      ? resolve("/(cloud)/note-[id]", { id: note.id })
      : resolve("/(local)/local-note-[id]", { id: note.id }),
  );
  const isActive = $derived(page.url.pathname.endsWith(href));

  const openPreviewLink = async () => {
    const url = PUBLIC_NOTA_FRONTEND_URL + `/p/${note.id}`;
    await invoke("plugin:shell|open", { path: url });
  };

  const childNotes = $derived.by(() => {
    const allNotes = isCloud ? cloudNotes.notes : localNotes.getNotes();
    return allNotes.filter(
      (n) => n.parent_note_id === note.id && !n.deleted_at,
    );
  });

  async function togglePin() {
    try {
      if (isCloud) {
        await cloudNotes.update(note.id, { pinned: !note.pinned });
      } else {
        await localNotes.togglePinned(note as LocalNote);
      }
      toast.success(
        note.pinned ? "Removed from Favorites" : "Added to Favorites",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update favorite status");
    }
  }

  async function copyLink() {
    try {
      const link = window.location.origin + href;
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy link");
    }
  }

  async function duplicateNote() {
    try {
      if (isCloud) {
        await cloudNotes.duplicate(note.id);
      } else {
        await localNotes.duplicateNote(note.id);
      }
      toast.success("Note duplicated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate note");
    }
  }

  async function trashNote() {
    try {
      const confirm = await ask(
        "You will still be able to access the note from the trash. Do you want to continue?",
        {
          title: `Move ${note.name} to trash?`,
          kind: "info",
          okLabel: "Trash it",
        },
      );
      if (!confirm) return;
      if (isCloud) {
        await cloudNotes.update(note.id, { deleted_at: new Date() });
        toast.success("Note moved to trash");
      } else {
        await localNotes.trashNote(note as LocalNote);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to move note to trash");
    }
  }

  async function deleteNote() {
    try {
      const confirm = await ask(
        "This note will be deleted permanently. Do you want to continue?",
        {
          title: `Delete ${note.name}?`,
          kind: "warning",
          okLabel: "Delete",
        },
      );
      if (!confirm) return;
      if (page.url.pathname.endsWith(`note-${note.id}`)) goto(resolve("/"));
      if (isCloud) {
        await cloudNotes.delete(note.id);
        toast.success("Note deleted successfully");
      } else {
        await localNotes.delete(note.id);
        toast.success("Note deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to move note to trash");
    }
  }

  function formatDate(val: number | Date | null | undefined) {
    if (!val) return "";
    const date = typeof val === "number" ? new Date(val * 1000) : new Date(val);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    if (date.toDateString() === now.toDateString()) {
      return `Today at ${timeStr}`;
    }
    if (diffDays === 1) {
      return `Yesterday at ${timeStr}`;
    }
    return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${timeStr}`;
  }
</script>

<Collapsible.Root>
  <Sidebar.MenuItem class="my-px" style={`margin-left: ${depth}rem`}>
    <Sidebar.MenuButton class={cn(isActive && "bg-muted")}>
      {#snippet child({ props })}
        <a {href} {...props}>
          <IconRenderer class="size-4 shrink-0" icon={note.icon} />
          <span class="truncate">{note.name}</span>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
    <Collapsible.Trigger>
      {#snippet child({ props })}
        <Sidebar.MenuAction
          {...props}
          class="bg-sidebar-accent size-6 top-1! text-sidebar-accent-foreground inset-s-1 data-[state=open]:rotate-90"
          showOnHover
        >
          <icons.ChevronRight />
        </Sidebar.MenuAction>
      {/snippet}
    </Collapsible.Trigger>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuAction class="size-6 top-1!" showOnHover {...props}>
            <icons.Ellipsis />
          </Sidebar.MenuAction>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side={Sidebar.useSidebar().isMobile ? "bottom" : "right"}
        class="w-56"
      >
        <DropdownMenu.Label class="text-xs text-muted-foreground px-2 py-1"
          >Note</DropdownMenu.Label
        >
        <DropdownMenu.Item onclick={() => openNewNote(note.id)}>
          <icons.Plus />
          <span>Add Sub Note</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={togglePin}>
          {#if note.pinned}
            <icons.Pin class=" text-yellow-500 fill-yellow-500" />
            <span>Remove from Pinned</span>
          {:else}
            <icons.Pin />
            <span>Add to Pinned</span>
          {/if}
        </DropdownMenu.Item>
        {#if isCloud}
          <DropdownMenu.Item onclick={openPreviewLink}>
            <icons.ArrowUpRight />
            <span>Open in Browser</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={copyLink}>
            <icons.Link />
            <span>Copy link</span>
          </DropdownMenu.Item>
        {/if}

        <DropdownMenu.Item onclick={duplicateNote}>
          <icons.Copy />
          <span>Duplicate</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={() => openRenameNote(note)}>
          <icons.Pencil />
          <span>Rename</span>
          <DropdownMenu.Shortcut>⌘⇧R</DropdownMenu.Shortcut>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={() => openMoveNote(note)}>
          <icons.FolderInput />
          <span>Move to</span>
          <DropdownMenu.Shortcut>⌘⇧P</DropdownMenu.Shortcut>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />

        <DropdownMenu.Item onclick={trashNote} variant="destructive">
          <icons.Trash2 />
          <span>Move to Trash</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={deleteNote} variant="destructive">
          <icons.Trash2 />
          <span>Delete Note</span>
        </DropdownMenu.Item>

        <!-- <DropdownMenu.Item disabled>
          <icons.RefreshCw />
          <span>Turn into wiki</span>
        </DropdownMenu.Item> -->
        <DropdownMenu.Separator />
        <div
          class="px-2 py-1.5 text-[10px] text-muted-foreground select-none leading-normal"
        >
          <div>
            Last edited {isCloud
              ? "by " + (user?.name || user?.email || "User")
              : "locally"}
          </div>
          <div>{formatDate(note.updated_at || note.created_at)}</div>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <Collapsible.Content>
      <Sidebar.MenuItem>
        {#if childNotes.length > 0}
          {#each childNotes as note (note.id)}
            <NoteTile {note} depth={depth + 1} />
          {/each}
        {:else}
          <div class="ml-6 flex my-px items-center gap-1 text-muted-foreground">
            <icons.FileXCorner class="size-4" />
            <small>No Sub Notes...</small>
          </div>
        {/if}
      </Sidebar.MenuItem>
    </Collapsible.Content>
  </Sidebar.MenuItem>
</Collapsible.Root>
