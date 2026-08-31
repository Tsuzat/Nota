<script lang="ts">
import BookOpen from "@lucide/svelte/icons/book-open";
import Camera from "@lucide/svelte/icons/camera";
import Clock from "@lucide/svelte/icons/clock";
import Download from "@lucide/svelte/icons/download";
import Ellipsis from "@lucide/svelte/icons/ellipsis";
import File from "@lucide/svelte/icons/file";
import FileCode from "@lucide/svelte/icons/file-code";
import FileJson from "@lucide/svelte/icons/file-json";
import FileText from "@lucide/svelte/icons/file-text";
import History from "@lucide/svelte/icons/history";
import Lock from "@lucide/svelte/icons/lock";
import LockOpen from "@lucide/svelte/icons/lock-open";
import Maximize2 from "@lucide/svelte/icons/maximize-2";
import Minimize2 from "@lucide/svelte/icons/minimize-2";
import Star from "@lucide/svelte/icons/star";
import Trash2 from "@lucide/svelte/icons/trash-2";
import Upload from "@lucide/svelte/icons/upload";
import { SimpleToolTip, toast } from "@nota/ui";
import { openDeleteConfirmation } from "@nota/ui/custom/dialogs/confirm-delete.svelte";
import {
	type Editor,
	useEditorTransaction,
} from "@nota/ui/edra/tiptap/index.js";
import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.js";
import * as DropdownMenu from "@nota/ui/shadcn/dropdown-menu/index.js";
import { Switch } from "@nota/ui/shadcn/switch/index.js";
import { cn } from "@nota/ui/utils";
import { fade } from "svelte/transition";
import { exportFile, exportPDF } from "#lib/data/exports.ts";
import { importFile } from "#lib/data/imports.ts";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import { snapshotsManager } from "#lib/data/snapshots.svelte.ts";
import type { NoteMeta } from "#lib/data/types.js";
import { formatDate } from "#lib/utils.ts";
import { goto } from "$app/navigation";

interface Props {
	note: NoteMeta;
	editor: Editor;
	isCloud: boolean;
	isLocked?: boolean;
	isFullWidth?: boolean;
}

let {
	note,
	editor,
	isCloud,
	isLocked = $bindable(false),
	isFullWidth = $bindable(false),
}: Props = $props();

const noteCtx = getNotesContext();

let fileInput: HTMLInputElement;

// Star status derived from note
let isStarred = $derived(Boolean(note.starred));

const sanitizeFilename = (name: string) => {
	return (name || "note")
		.toLowerCase()
		.replace(/[^a-z0-9_\-\\.]/gi, "_")
		.replace(/_+/g, "_");
};

const transaction = useEditorTransaction(editor);
const words = () => {
	void transaction.version;
	return editor?.storage?.characterCount?.words?.() ?? 0;
};

const toggleLock = (e?: Event) => {
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}
	isLocked = !isLocked;
	if (editor) {
		void transaction.version;
		editor.setEditable(!isLocked);
	}
	toast.success(isLocked ? "Page locked (read-only)" : "Page unlocked");
};

const toggleFullWidth = (e?: Event) => {
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}
	isFullWidth = !isFullWidth;
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("nota-full-width", String(isFullWidth));
	}
	toast.success(isFullWidth ? "Full width enabled" : "Default width restored");
};

// Toggle note star
const handleToggleStar = async () => {
	const newStarred = !isStarred;
	note.starred = newStarred;
	try {
		if (isCloud) {
			await noteCtx.cloud.update(note.id, { starred: newStarred });
		} else {
			await noteCtx.local.update(note.id, { starred: newStarred });
		}
		toast.success(newStarred ? "Note starred" : "Note unstarred");
	} catch {
		note.starred = !newStarred;
		toast.error("Failed to update star");
	}
};

// Export handlers
const handleExportHTML = async () => {
	if (!editor) return;
	const htmlContent = editor.getHTML();

	const blob = new Blob([htmlContent], { type: "text/html" });
	await exportFile(`${sanitizeFilename(note.name)}.html`, blob);
	toast.success("Exported as HTML");
};

const handleExportMarkdown = async () => {
	if (!editor) return;
	let md;
	try {
		md = editor.getMarkdown() || editor.getText();
	} catch {
		md = editor.getText();
	}
	const finalMd = `# ${note.name || "Untitled Note"}\n\n${md}`;
	const blob = new Blob([finalMd], { type: "text/markdown" });
	await exportFile(`${sanitizeFilename(note.name)}.md`, blob);
	toast.success("Exported as Markdown");
};

const handleExportJSON = async () => {
	if (!editor) return;
	const json = JSON.stringify(
		{
			title: note.name,
			icon: note.icon,
			id: note.id,
			updatedAt: note.updatedAt,
			content: editor.getJSON(),
		},
		null,
		2,
	);
	const blob = new Blob([json], { type: "application/json" });
	await exportFile(`${sanitizeFilename(note.name)}.json`, blob);
	toast.success("Exported as JSON");
};

const handleExportPDF = async () => {
	if (!editor) return;
	const toastId = toast.loading("Generating PDF...");
	try {
		const htmlContent = editor.getHTML();
		await exportPDF(note.name, htmlContent);
		toast.dismiss(toastId);
		toast.success("PDF exported successfully");
	} catch (e) {
		toast.dismiss(toastId);
		toast.error(e instanceof Error ? e.message : "PDF export failed");
	}
};

// Import handler
const handleImportClick = async () => {
	if (!editor) return;

	const imported = await importFile([".md", ".json", ".txt"]);
	if (!imported) return;

	try {
		// 1. Take snapshot before importing
		try {
			await snapshotsManager.createManualSnapshot(
				note.id,
				isCloud,
				`Before importing ${imported.name}`,
			);
		} catch (err) {
			console.warn("Failed to create snapshot before import:", err);
		}

		// 2. Read and parse file
		const { name, content } = imported;
		if (name.endsWith(".json")) {
			const parsed = JSON.parse(content);
			const editorContent = parsed.content || parsed;
			editor.commands.setContent(editorContent, { contentType: "json" });
			if (!isCloud) {
				await noteCtx.local.saveContent(
					note.id,
					editor.getJSON(),
					editor.getText(),
				);
			}
		} else {
			// Markdown or plain text
			try {
				editor.commands.setContent(content, { contentType: "markdown" });
			} catch {
				editor.commands.setContent(content);
			}
			if (!isCloud) {
				await noteCtx.local.saveContent(
					note.id,
					editor.getJSON(),
					editor.getText(),
				);
			}
		}

		toast.success(`Imported ${name} successfully`);
	} catch (err) {
		console.error("Import error:", err);
		toast.error("Failed to import file: Invalid format");
	}
};

// Manual snapshot
const handleTakeSnapshot = async () => {
	try {
		await snapshotsManager.createManualSnapshot(
			note.id,
			isCloud,
			"Manual Snapshot",
		);
		toast.success("Manual snapshot created");
	} catch (e: any) {
		toast.error(e?.message || "Failed to create snapshot");
	}
};

// Version history
const handleOpenVersions = () => {
	goto(`/versions?noteId=${note.id}`);
};

// Turn into wiki
const handleTurnIntoWiki = () => {
	toast.success("Turned into Wiki document");
};

// Move note to Bin (Trash)
const handleMoveToTrash = () => {
	openDeleteConfirmation({
		title: "Move to Bin",
		description: `Are you sure you want to move "${note.name}" to the bin? You can restore it later from Trash.`,
		buttonText: "Move to Bin",
		onClick: async () => {
			if (isCloud) {
				await noteCtx.cloud.update(note.id, {
					trashedAt: new Date(),
				});
			} else {
				await noteCtx.local.update(note.id, { trashedAt: new Date() });
			}
			toast.success("Note moved to bin");
			goto("/");
		},
	});
};

// Delete note permanently
const handleDeletePermanently = () => {
	openDeleteConfirmation({
		title: "Delete Note Permanently",
		description: `Are you sure you want to permanently delete "${note.name}"? All associated assets and snapshots will be deleted and storage freed. This action cannot be undone.`,
		buttonText: "Delete Permanently",
		warning: {
			allowDelete: true,
			text: "This note and its storage will be permanently deleted.",
		},
		onClick: async () => {
			if (isCloud) {
				await noteCtx.cloud.delete(note.id);
			} else {
				await noteCtx.local.delete(note.id);
			}
			toast.success("Note permanently deleted");
			goto("/");
		},
	});
};
</script>


<div class="flex items-center gap-1">
  <!-- Star Toggle Button -->
  <SimpleToolTip content={isStarred ? "Unstar note" : "Star note"}>
    <Button
      variant="ghost"
      size="icon"
      class={cn(
        "size-8 rounded-md transition-colors",
        isStarred
          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
          : "text-muted-foreground hover:text-foreground",
      )}
      onclick={handleToggleStar}
    >
      <Star
        class={cn(
          "size-4 transition-transform active:scale-125",
          isStarred && "fill-amber-500 text-amber-500",
        )}
      />
      <span class="sr-only">{isStarred ? "Starred" : "Not starred"}</span>
    </Button>
  </SimpleToolTip>

  {#if isLocked}
    <small class="text-muted-foreground" transition:fade>Locked</small>
  {/if}

  <!-- More Options Dropdown -->
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <Ellipsis class="size-4" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-fit p-1.5 shadow-xl rounded-xl">
      <!-- 1. Lock Page Switch -->
      <DropdownMenu.Item
        closeOnSelect={false}
        onclick={toggleLock}
        onSelect={(e) => {
          e.preventDefault();
        }}
        class="flex items-center justify-between py-1.5 px-2.5 cursor-pointer select-none"
      >
        <div class="flex items-center gap-2 text-sm">
          {#if isLocked}
            <Lock class="size-4 text-amber-500" />
            <span class="text-amber-500 font-medium">Locked Page</span>
          {:else}
            <LockOpen class="size-4 text-muted-foreground" />
            <span>Lock Page</span>
          {/if}
        </div>
        <div class="pointer-events-none">
          <Switch checked={isLocked} />
        </div>
      </DropdownMenu.Item>

      <!-- 2. Export As Submenu -->
      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger
          class="flex items-center gap-2 py-1.5 px-2.5 text-sm cursor-pointer"
        >
          <Download class="size-4 text-muted-foreground" />
          <span>Export As</span>
        </DropdownMenu.SubTrigger>
        <DropdownMenu.SubContent class="w-48 p-1 shadow-lg rounded-lg">
          <DropdownMenu.Item
            onclick={handleExportHTML}
            class="gap-2 cursor-pointer"
          >
            <FileCode class="size-4 text-primary" />
            <span>HTML (.html)</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onclick={handleExportMarkdown}
            class="gap-2 cursor-pointer"
          >
            <FileText class="size-4 text-primary" />
            <span>Markdown (.md)</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onclick={handleExportJSON}
            class="gap-2 cursor-pointer"
          >
            <FileJson class="size-4 text-primary" />
            <span>JSON (.json)</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onclick={handleExportPDF}
            class="gap-2 cursor-pointer"
          >
            <File class="size-4" />
            <span>PDF (.pdf)</span>
          </DropdownMenu.Item>
        </DropdownMenu.SubContent>
      </DropdownMenu.Sub>

      <!-- 3. Import File -->
      <DropdownMenu.Item
        onclick={handleImportClick}
        class="flex items-center gap-2 py-1.5 px-2.5 text-sm cursor-pointer"
      >
        <Upload class="size-4 text-muted-foreground" />
        <span>Import (.md, .json)</span>
      </DropdownMenu.Item>

      <!-- 4. Toggle Full Width Switch -->
      <DropdownMenu.Item
        closeOnSelect={false}
        onclick={toggleFullWidth}
        onSelect={(e) => {
          e.preventDefault();
        }}
        class="flex items-center justify-between py-1.5 px-2.5 cursor-pointer select-none"
      >
        <div class="flex items-center gap-2 text-sm">
          {#if isFullWidth}
            <Minimize2 class="size-4 text-muted-foreground" />
          {:else}
            <Maximize2 class="size-4 text-muted-foreground" />
          {/if}
          <span>Full Width</span>
        </div>
        <div class="pointer-events-none">
          <Switch checked={isFullWidth} />
        </div>
      </DropdownMenu.Item>

      <!-- 5. Turn into Wiki -->
      <DropdownMenu.Item
        onclick={handleTurnIntoWiki}
        class="flex items-center gap-2 py-1.5 px-2.5 text-sm cursor-pointer"
      >
        <BookOpen class="size-4 text-muted-foreground" />
        <span>Turn into Wiki</span>
      </DropdownMenu.Item>

      <!-- 6. Take Manual Snapshot -->
      <DropdownMenu.Item
        onclick={handleTakeSnapshot}
        class="flex items-center gap-2 py-1.5 px-2.5 text-sm cursor-pointer"
      >
        <Camera class="size-4 text-muted-foreground" />
        <span>Take Manual Snapshot</span>
      </DropdownMenu.Item>

      <!-- 7. Version History -->
      <DropdownMenu.Item
        onclick={handleOpenVersions}
        class="flex items-center gap-2 py-1.5 px-2.5 text-sm cursor-pointer"
      >
        <History class="size-4 text-muted-foreground" />
        <span>Version History</span>
      </DropdownMenu.Item>

      <DropdownMenu.Separator />

      <!-- 8. Trash (Move to Bin) -->
      <DropdownMenu.Item
        onclick={handleMoveToTrash}
        class="flex items-center gap-2 py-1.5 px-2.5 text-sm text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-500/10 cursor-pointer"
      >
        <Trash2 class="size-4" />
        <span>Move to Bin</span>
      </DropdownMenu.Item>

      <!-- 9. Delete Permanently -->
      <DropdownMenu.Item
        onclick={handleDeletePermanently}
        class="flex items-center gap-2 py-1.5 px-2.5 text-sm text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
      >
        <Trash2 class="size-4" />
        <span>Delete Permanently</span>
      </DropdownMenu.Item>

      <DropdownMenu.Separator />

      <!-- 10. Footer Metadata -->
      <div
        class="px-2.5 py-1.5 text-[0.7rem] text-muted-foreground space-y-0.5 select-none"
      >
        <div class="flex items-center gap-1.5">
          <Clock class="size-3 shrink-0" />
          <span class="truncate">Edited {formatDate(note.updatedAt)}</span>
        </div>
        <span>Word Count: {words()}</span>
      </div>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
