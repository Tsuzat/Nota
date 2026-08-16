<script lang="ts">
import { QueryClientProvider } from "@tanstack/svelte-query";
import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
import "../app.css";
import { ModeWatcher } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.js";
import * as Sidebar from "@nota/ui/shadcn/sidebar/index.ts";
import { Toaster } from "@nota/ui/shadcn/sonner/index.ts";
import { cn } from "@nota/ui/utils";
import { onMount } from "svelte";
import { authClient } from "#lib/auth-client.ts";
import { CreateWorkspace } from "#lib/components/dialogs/index.ts";
import { AppSideBar } from "#lib/components/index.ts";
import { setWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { queryClient } from "#lib/orpc.js";
import { secureStorage } from "#lib/platform/securestorage.ts";
import { ISDESKTOP } from "#lib/utils.ts";
import { PUBLIC_NOTA_URL } from "$app/env/public";

const { children } = $props();
let open = $state(localStorage.getItem("sidebar-state") === "open");
const workspaces = setWorkspaceContext();
const sessionQuery = authClient.useSession();

const shouldRenderContent = $derived(
	ISDESKTOP || (!!$sessionQuery.data?.user && !$sessionQuery.isPending),
);

$effect(() => {
	if (!ISDESKTOP && !$sessionQuery.isPending && !$sessionQuery.data?.user) {
		window.location.href = `${PUBLIC_NOTA_URL}/signin`;
	}
});

onMount(async () => {
	if (ISDESKTOP) {
		document.documentElement.style.setProperty("--sidebar", "transparent");
		await secureStorage.init();
	}
	await workspaces.init();
});
</script>

<ModeWatcher />
<Toaster richColors closeButton />
<CreateWorkspace />
<QueryClientProvider client={queryClient}>
  {#if shouldRenderContent}
    <Sidebar.Provider
      bind:open
      onOpenChange={(value: boolean) => {
        localStorage.setItem("sidebar-state", value ? "open" : "closed");
      }}
      class={cn(!ISDESKTOP && "bg-background")}
    >
      <AppSideBar />
      <Sidebar.Inset
        class="flex size-full min-h-0 w-full! flex-col! overflow-hidden!"
      >
        {@render children()}
      </Sidebar.Inset>
    </Sidebar.Provider>
  {:else}
    <div class="flex h-screen w-full items-center justify-center bg-background">
      <div class="flex flex-col items-center gap-4">
        <BarSpinner size={24} />
        <p class="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
      </div>
    </div>
  {/if}
  <SvelteQueryDevtools />
</QueryClientProvider>
