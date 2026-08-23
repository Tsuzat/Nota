<script lang="ts">
import {
	ArrowUpRight,
	ChevronRight,
	Copy,
	Ellipsis,
	FolderInput,
	Link,
	Pencil,
	Plus,
	Star,
	Trash2,
} from "@lucide/svelte";
import { user } from "@nota/db/schema/auth";
import { toast } from "@nota/ui";
import { openDeleteConfirmation } from "@nota/ui/custom/dialogs/confirm-delete.svelte";
import { IconsRenderer } from "@nota/ui/icons/index.ts";
import * as Collapsible from "@nota/ui/shadcn/collapsible/index.ts";
import * as DropdownMenu from "@nota/ui/shadcn/dropdown-menu/index.ts";
import * as Sidebar from "@nota/ui/shadcn/sidebar/index.ts";
import { cn } from "@nota/ui/utils";
import { invoke } from "@tauri-apps/api/core";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import type { NoteMeta } from "#lib/data/types.ts";
import { formatDate, ISDESKTOP } from "#lib/utils.ts";
import { PUBLIC_NOTA_URL } from "$app/env/public";
import { resolve } from "$app/paths";
import { page } from "$app/state";
import { openCreateNotes, openNoteMove, openNoteRename } from "../dialogs";
import NoteTile from "./note-tile.svelte";

interface Props {
	note: NoteMeta;
	depth?: number;
}
const { note, depth = 0 }: Props = $props();

const notesCtx = getNotesContext();
const isCloud = $derived("ownerId" in note);

const href = $derived(
	isCloud
		? resolve("/(cloud)/note-[id]", { id: note.id })
		: resolve("/(local)/local-note-[id]", { id: note.id }),
);
const isActive = $derived(page.url.pathname.endsWith(href));

const openInBrowser = async () => {
	const url = `${PUBLIC_NOTA_URL}/n/${note.id}`;
	await invoke("plugin:shell|open", { path: url });
};

const childNotes = $derived.by(() => {
	const allNotes = notesCtx.list;
	return allNotes.filter((n) => n.parentNoteId === note.id && !n.trashedAt);
});

async function toggleStar() {
	try {
		notesCtx.updateMeta(note.id, { starred: !note.starred });
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
	// try {
	// 	if (isCloud) {
	// 		await cloudNotes.duplicate(note.id);
	// 	} else {
	// 		await localNotes.duplicateNote(note.id);
	// 	}
	// 	toast.success("Note duplicated successfully");
	// } catch (err) {
	// 	console.error(err);
	// 	toast.error("Failed to duplicate note");
	// }
}

async function trashNote() {
	openDeleteConfirmation({
		title: "Move to Bin?",
		description: `Do you want to move "${note.name}" to bin?`,
		confirmation: { text: note.name },
		warning: {
			allowDelete: true,
			text: `This note will be deleted permanently after 30 days, if not restored.`,
		},
		onClick: async () => {
			await notesCtx.updateMeta(note.id, { trashedAt: new Date() });
		},
		buttonText: "Move to Bin",
	});
}

async function deleteNote() {
	openDeleteConfirmation({
		title: `Delete "${note.name}"?`,
		description:
			"This note will be deleted permanently. Do you want to continue?",
		confirmation: { text: note.name },
		warning: {
			allowDelete: true,
			text: "This can not be undo, we recommend to put it in bin",
		},
		onClick: async () => {
			await notesCtx.delete(note.id);
		},
	});
}
</script>

<Collapsible.Root>
  <Sidebar.MenuItem
    class={cn("my-px", depth > 0 && "border-s")}
    style={`margin-left: ${depth}rem`}
  >
    <Sidebar.MenuButton
      class={cn(
        isActive && "bg-sidebar-accent",
        ISDESKTOP && "hover:bg-sidebar-accent-foreground/5",
        ISDESKTOP && isActive && "bg-sidebar-accent-foreground/10",
      )}
    >
      {#snippet child({ props })}
        <a {href} {...props}>
          <IconsRenderer icon={note.icon ?? "lucide:FileText"} />
          <span class="truncate">{note.name}</span>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
    {#if childNotes.length > 0}
      <Collapsible.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuAction
            {...props}
            class="bg-sidebar-accent size-6 top-1! text-sidebar-accent-foreground inset-s-1 data-[state=open]:rotate-90"
            showOnHover
          >
            <ChevronRight />
          </Sidebar.MenuAction>
        {/snippet}
      </Collapsible.Trigger>
    {/if}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuAction class="size-6 top-1!" showOnHover {...props}>
            <Ellipsis />
          </Sidebar.MenuAction>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side={Sidebar.useSidebar().isMobile ? "bottom" : "right"}
        class="w-56 bg-popover/50 backdrop-blur-md"
      >
        <DropdownMenu.Label class="text-xs text-muted-foreground px-2 py-1"
          >Note</DropdownMenu.Label
        >
        <DropdownMenu.Item
          onclick={() => {
            openCreateNotes(note.id);
          }}
        >
          <Plus />
          <span>Add Sub Note</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={toggleStar}>
          {#if note.starred}
            <Star class=" text-yellow-500 fill-yellow-500" />
            <span>Unstar note</span>
          {:else}
            <Star />
            <span>Star note</span>
          {/if}
        </DropdownMenu.Item>
        {#if isCloud}
          <DropdownMenu.Item onclick={openInBrowser}>
            <ArrowUpRight />
            <span>Open in Browser</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={copyLink}>
            <Link />
            <span>Copy link</span>
          </DropdownMenu.Item>
        {/if}

        <DropdownMenu.Item onclick={duplicateNote}>
          <Copy />
          <span>Duplicate</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={() => openNoteRename(note)}>
          <Pencil />
          <span>Rename</span>
          <DropdownMenu.Shortcut>⌘⇧R</DropdownMenu.Shortcut>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={() => openNoteMove(note)}>
          <FolderInput />
          <span>Move to</span>
          <DropdownMenu.Shortcut>⌘⇧P</DropdownMenu.Shortcut>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />

        <DropdownMenu.Item onclick={trashNote} variant="destructive">
          <Trash2 />
          <span>Move to Trash</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={deleteNote} variant="destructive">
          <Trash2 />
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
          <div>{formatDate(note.updatedAt)}</div>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    {#if childNotes.length > 0}
      <Collapsible.Content>
        <Sidebar.MenuItem>
          {#each childNotes as n (n.id)}
            <NoteTile note={n} depth={depth + 1} />
          {/each}
        </Sidebar.MenuItem>
      </Collapsible.Content>
    {/if}
  </Sidebar.MenuItem>
</Collapsible.Root>
