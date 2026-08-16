<script lang="ts">
import { onMount, type Snippet } from "svelte";
import { setWorkspaceContext } from "#lib/data/workspace.svelte.ts";

const { children }: { children?: Snippet<[]> } = $props();

const workspaces = setWorkspaceContext();
onMount(async () => {
	await workspaces.init();
});
</script>

{@render children?.()}