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
import { isSignedIn } from "#lib/auth-session.svelte.ts";
import { CreateWorkspace } from "#lib/components/dialogs/index.ts";
import { AppSideBar } from "#lib/components/index.ts";
import { orpc, queryClient } from "#lib/orpc.js";
import { secureStorage } from "#lib/platform/securestorage.ts";
import { DataProviders } from "#lib/providers/index.ts";
import { ISDESKTOP } from "#lib/utils.ts";
import { PUBLIC_NOTA_URL } from "$app/env/public";

const { children } = $props();
let open = $state(true);

const shouldRenderContent = $derived(ISDESKTOP || isSignedIn());

let wasSignedIn = $state(false);
$effect(() => {
	if (wasSignedIn && !isSignedIn()) {
		queryClient.removeQueries({ queryKey: orpc.workspace.key() });
		queryClient.removeQueries({ queryKey: orpc.notes.key() });
		if (!ISDESKTOP) {
			window.location.href = `${PUBLIC_NOTA_URL}/signin`;
		}
	}
	wasSignedIn = isSignedIn();
});

onMount(async () => {
	open = localStorage.getItem("sidebar-state") === "open";
	if (ISDESKTOP) {
		document.documentElement.style.setProperty("--sidebar", "transparent");
		await secureStorage.init();
	}
});
</script>

<ModeWatcher />
<Toaster richColors closeButton />
<CreateWorkspace />
<QueryClientProvider client={queryClient}>
  {#if shouldRenderContent}
    <DataProviders>
      <Sidebar.Provider
        bind:open
        onOpenChange={(value: boolean) => {
          localStorage.setItem("sidebar-state", value ? "open" : "closed");
        }}
        class={cn(!ISDESKTOP && "bg-background")}
      >
        <AppSideBar />
        <Sidebar.Inset class={cn(ISDESKTOP && "bg-background/75!")}>
          {@render children()}
        </Sidebar.Inset>
      </Sidebar.Provider>
    </DataProviders>
  {:else}
    <div class="flex h-screen w-full items-center justify-center bg-background">
      <div class="flex flex-col items-center gap-4">
        <BarSpinner size={24} />
        <p class="text-sm text-muted-foreground animate-pulse">
          Loading workspace...
        </p>
      </div>
    </div>
  {/if}
  <SvelteQueryDevtools />
</QueryClientProvider>
