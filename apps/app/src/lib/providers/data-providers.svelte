<script lang="ts">
import { onMount, type Snippet } from "svelte";
import { setNotesContext } from "#lib/data/notes.svelte.ts";
import { setWorkspaceContext } from "#lib/data/workspace.svelte.ts";

const { children }: { children?: Snippet<[]> } = $props();

const workspaces = setWorkspaceContext();
const notes = setNotesContext();

onMount(async () => {
	await workspaces.init();
	await notes.init();
});
</script>

{@render children?.()}