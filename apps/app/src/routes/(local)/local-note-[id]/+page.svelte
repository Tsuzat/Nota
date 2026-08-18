<script lang="ts">
import type { LocalNoteMeta } from "@nota/db-local/types";
import { createEditor, Edra } from "@nota/ui/edra/shadcn/index.js";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import { afterNavigate } from "$app/navigation";

const noteCtx = getNotesContext();

const editor = createEditor({});
let note = $state<LocalNoteMeta | null>(null);

afterNavigate(() => {
	if (data.id) loadNote(data.id);
});

const loadNote = async (id: string) => {
	note = await noteCtx.local.fetchById(id);
	if (!note) return;
	const content = await noteCtx.local.getContent(id);
	editor?.commands.setContent(content, { contentType: "json" });
};

const { data } = $props();
</script>

<header>{note?.name}</header>
<Edra {editor}>
    <Edra.DragHandle />
    <Edra.BubbleMenu />
    <Edra.ToC />
    <Edra.Content class="max-w-3xl mx-auto w-full px-4 *:outline-none" />
</Edra>