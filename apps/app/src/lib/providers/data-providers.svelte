<script lang="ts">
import { onMount, type Snippet } from "svelte";
import { isSignedIn } from "#lib/auth-session.svelte.ts";
import { setNotesContext } from "#lib/data/notes.svelte.ts";
import { setWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { orpc, queryClient } from "#lib/orpc.ts";

const { children }: { children?: Snippet<[]> } = $props();

const workspaces = setWorkspaceContext();
const notes = setNotesContext();

$effect(() => {
	if (!isSignedIn()) {
		if (workspaces.current && "ownerId" in workspaces.current) {
			workspaces.current = workspaces.local.workspaces[0] ?? null;
		}
	}
});

onMount(async () => {
	await workspaces.init();
	await notes.init();
});
</script>

{@render children?.()}