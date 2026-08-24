<script lang="ts">
import type { SelectableModel } from "@nota/ai";
import type { LocalNoteMeta } from "@nota/db-local/types";
import { toast } from "@nota/ui";
import { createEditor, Edra } from "@nota/ui/edra/shadcn/index.js";
import { IconPicker, IconsRenderer } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Skeleton } from "@nota/ui/shadcn/skeleton/index.js";
import { cn } from "@nota/ui/utils";
import { onMount, untrack } from "svelte";
import { NoteTopbarActions, Topbar } from "#lib/components/custom/index.ts";
import { callAI, getUserModels } from "#lib/data/local/ai/ai.js";
import { onFileUpload } from "#lib/data/local/storage.js";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import { afterNavigate, beforeNavigate } from "$app/navigation";

const noteCtx = getNotesContext();

let note = $state<LocalNoteMeta | null>(null);
let availableModels = $state<SelectableModel[]>([]);

let isContentReady = $state(false);
let isNotFound = $state(false);
let isDirty = false;
let isSaving = false;
let pendingContent: any = null;
let pendingText: string = "";
let isLocked = $state(false);
let isFullWidth = $state(
	typeof localStorage !== "undefined" &&
		localStorage.getItem("nota-full-width") === "true",
);

onMount(() => {
	getUserModels().then((models) => (availableModels = models));
	const interval = setInterval(saveNote, 1000);
	return () => {
		clearInterval(interval);
		if (isDirty) {
			void saveNote();
		}
	};
});

beforeNavigate(async () => {
	if (isDirty) {
		await saveNote();
	}
});

afterNavigate(() => {
	if (data.id) loadNote(data.id);
});

const saveNote = async () => {
	if (!isDirty || isSaving || !pendingContent) return;
	isSaving = true;
	try {
		await noteCtx.local.saveContent(data.id, pendingContent, pendingText);
		isDirty = false;
	} catch (e) {
		console.error("Failed to save note:", e);
		toast.error("Failed to save note automatically.");
	} finally {
		isSaving = false;
	}
};

const onUpdate = () => {
	pendingContent = editor?.getJSON();
	pendingText = editor?.getText() || "";
	isDirty = true;
};

const editor = createEditor({
	onUpdate,
	onFileUpload: (fileType) => onFileUpload(fileType, data.id),
	callAI,
});

const loadNote = async (id: string) => {
	isContentReady = false;
	isNotFound = false;
	try {
		note = noteCtx.list.find((n) => n.id === data.id) as LocalNoteMeta;
		if (note === null) note = await noteCtx.local.fetchById(id);
		if (!note) {
			isNotFound = true;
			return;
		}
		const content = await noteCtx.local.getContent(id);
		editor?.commands.setContent(content, { contentType: "json" });
		isContentReady = true;
	} catch (e) {
		console.error("Failed to load note:", e);
		toast.error("Failed to load note.");
		isNotFound = true;
	}
};
const { data } = $props();
</script>

<svelte:head>
  <title>{note?.name ?? "Loading..."} - Nota</title>
</svelte:head>

<Topbar class="top-0 sticky">
  {#snippet left()}
    {#if note !== null}
      <IconPicker onClose={() => noteCtx.local.update(note!.id, { icon: note!.icon })} onSelect={(icon) => note!.icon = icon}>
        <Button variant="ghost" size="icon">
          <IconsRenderer icon={note!.icon} />
        </Button>
      </IconPicker>
	  <input class="outline-none hover:bg-muted/50 text-lg p-1 rounded font-semibold" value={note.name} onchange={(e) => noteCtx.local.update(note!.id, { name: e.currentTarget.value })} />
	  {:else }
	  	<Skeleton class="size-8" />
		<Skeleton class="h-8 w-24" />
    {/if}
  {/snippet}
  {#snippet right()}
    {#if note !== null && editor !== undefined}
      <div class="flex items-center gap-1.5 mr-2">
        <NoteTopbarActions
          {note}
          {editor}
          isCloud={false}
          bind:isLocked
          bind:isFullWidth
        />
      </div>
    {/if}
  {/snippet}
</Topbar>

<div id="editor-scroll-container" class="flex-1 w-full max-h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden">
  {#if isNotFound}
    <div class="flex flex-col items-center justify-center pt-24 space-y-4">
      <h2 class="text-2xl font-semibold">Note not found</h2>
      <p class="text-muted-foreground">The note you are looking for does not exist or could not be loaded.</p>
      <Button href="/">Go back to Home</Button>
    </div>
  {:else if !isContentReady}
    <div
      class={cn(
        "mx-auto w-full px-4 pt-12 space-y-4 transition-all duration-150",
        isFullWidth ? "max-w-7xl px-16!" : "max-w-3xl",
      )}
    >
      <Skeleton class="h-10 w-3/4" />
      <Skeleton class="h-6 w-full" />
      <Skeleton class="h-6 w-5/6" />
      <Skeleton class="h-6 w-full" />
      <Skeleton class="h-6 w-4/5" />
      <Skeleton class="h-6 w-full" />
    </div>
  {:else}
    <Edra {editor}>
      <Edra.DragHandle class="transition-all duration-300" />
      <Edra.BubbleMenu />
      <Edra.ToC />
      <Edra.UseAI {availableModels} />
      <Edra.Content
        class={cn(
          "mx-auto w-full px-4 pb-32 min-h-[calc(100dvh-10rem)] *:outline-none transition-all duration-150",
          isFullWidth ? "max-w-none px-8" : "max-w-3xl",
        )}
      />
    </Edra>
  {/if}
</div>
