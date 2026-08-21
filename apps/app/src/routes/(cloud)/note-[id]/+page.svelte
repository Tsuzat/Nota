<script lang="ts">
import { HocuspocusProvider } from "@hocuspocus/provider";
import type { SelectableModel } from "@nota/ai";
import { toast } from "@nota/ui";
import { createEditor, Edra } from "@nota/ui/edra/shadcn/index.js";
import type {
	Editor,
	Extension,
	Extensions,
} from "@nota/ui/edra/tiptap/index.js";
import { IconPicker, IconsRenderer } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Skeleton } from "@nota/ui/shadcn/skeleton/index.js";
import { onMount } from "svelte";
import type { Doc } from "yjs";
import { getAuthSession } from "#lib/auth-session.svelte.js";
import { Topbar } from "#lib/components/custom/index.ts";
import { realtimeProvider } from "#lib/data/cloud/realtime.js";
import { onFileUpload } from "#lib/data/cloud/storage.js";
import { callAI, getUserModels } from "#lib/data/local/ai/ai.js";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import type { NoteMeta } from "#lib/data/types.js";
import { secureStorage } from "#lib/platform/securestorage.js";
import { ISDESKTOP } from "#lib/utils.js";
import { afterNavigate, beforeNavigate } from "$app/navigation";

const noteCtx = getNotesContext();
const user = $derived(getAuthSession().data?.user);

let note = $state<NoteMeta | null>(null);
let availableModels = $state<SelectableModel[]>([]);
let provider = $state.raw<HocuspocusProvider>();
let editor = $state.raw<Editor>();
let ydoc = $state.raw<Doc>();

let isContentReady = $state(false);
let isNotFound = $state(false);
let isDirty = false;
let isSaving = false;
let pendingContent: any = null;
let pendingText: string = "";

onMount(() => {
	getUserModels().then((models) => (availableModels = models));
});

beforeNavigate(async () => {
	provider?.disconnect();
	editor?.destroy();
	ydoc?.destroy();
});

afterNavigate(() => {
	if (data.id) loadNote(data.id);
});

const loadNote = async (id: string) => {
	isContentReady = false;
	isNotFound = false;
	try {
		note = noteCtx.list.find((n) => n.id === data.id) as NoteMeta;
		if (!note) note = await noteCtx.cloud.fetchById(id);
		if (!note) {
			isNotFound = true;
			return;
		}
		const {
			ydoc: y,
			provider: p,
			extensions,
		} = await realtimeProvider(id, user?.name ?? "Unknow");
		ydoc = y;
		provider = p;
		editor = createEditor({
			collaborative: true,
			onFileUpload: (fileType) => onFileUpload(fileType, data.id),
			callAI,
			extensions: [...extensions],
		});
		isContentReady = true;
	} catch (e) {
		console.error("Failed to load note:", e);
		toast.error("Failed to load note.");
		isNotFound = true;
	}
};
const { data } = $props();
</script>

<Topbar class="top-0 sticky">
  {#snippet left()}
    {#if note !== null}
      <IconPicker
        onClose={() => noteCtx.cloud.update(note!.id, { icon: note!.icon! })}
        onSelect={(icon) => (note!.icon = icon)}
      >
        <Button variant="ghost" size="icon">
          <IconsRenderer icon={note!.icon!} />
        </Button>
      </IconPicker>
      <input
        class="outline-none hover:bg-muted/50 text-lg p-1 rounded font-semibold"
        value={note.name}
        onchange={(e) =>
          noteCtx.cloud.update(note!.id, { name: e.currentTarget.value })}
      />
    {:else}
      <Skeleton class="size-8" />
      <Skeleton class="h-8 w-24" />
    {/if}
  {/snippet}
</Topbar>

<div
  id="editor-scroll-container"
  class="flex-1 scrollbar-thin w-full max-h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden"
>
  {#if isNotFound}
    <div class="flex flex-col items-center justify-center pt-24 space-y-4">
      <h2 class="text-2xl font-semibold">Note not found</h2>
      <p class="text-muted-foreground">
        The note you are looking for does not exist or could not be loaded.
      </p>
      <Button href="/">Go back to Home</Button>
    </div>
  {:else if !isContentReady}
    <div class="max-w-3xl mx-auto w-full px-4 pt-12 space-y-4">
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
        class="max-w-3xl mx-auto w-full px-4 pb-32 min-h-[calc(100dvh-10rem)] *:outline-none"
      />
    </Edra>
  {/if}
</div>
