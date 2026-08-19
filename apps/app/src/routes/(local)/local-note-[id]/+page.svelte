<script lang="ts">
import type { LocalNoteMeta } from "@nota/db-local/types";
import { createEditor, Edra } from "@nota/ui/edra/shadcn/index.js";
import { IconPicker, IconsRenderer } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Skeleton } from "@nota/ui/shadcn/skeleton/index.js";
import { Topbar } from "#lib/components/custom/index.ts";
import { onFileUpload } from "#lib/data/local/storage.js";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import { afterNavigate } from "$app/navigation";

const noteCtx = getNotesContext();

let note = $state<LocalNoteMeta | null>(null);

afterNavigate(() => {
	if (data.id) loadNote(data.id);
});

const onUpdate = () => {
	const content = editor?.getJSON();
	const contentText = editor?.getText();
	if (!content) return;
	noteCtx.local.saveContent(data.id, content, contentText);
};

const editor = createEditor({
	onUpdate,
	onFileUpload: (fileType) => onFileUpload(fileType, data.id),
});

const loadNote = async (id: string) => {
	note = await noteCtx.local.fetchById(id);
	if (!note) return;
	const content = await noteCtx.local.getContent(id);
	editor?.commands.setContent(content, { contentType: "json" });
};
const { data } = $props();
</script>

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
</Topbar>

<div id="editor-scroll-container" class="flex-1 scrollbar-thin w-full max-h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden">
  <Edra {editor}>
    <Edra.DragHandle class="transition-all duration-300" />
    <Edra.BubbleMenu />
    <Edra.ToC />
    <Edra.Content class="max-w-3xl mx-auto w-full px-4 pb-32 min-h-[calc(100dvh-10rem)] *:outline-none" />
  </Edra>
</div>
