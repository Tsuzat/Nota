<script lang="ts">
import { QueryClientProvider } from "@tanstack/svelte-query";
import "../app.css";
import { ModeWatcher } from "@nota/ui";
import ConfirmDelete from "@nota/ui/custom/dialogs/confirm-delete.svelte";
import { BarSpinner } from "@nota/ui/icons/index.js";
import * as Sidebar from "@nota/ui/shadcn/sidebar/index.js";
import { Toaster } from "@nota/ui/shadcn/sonner/index.js";
import { TooltipProvider } from "@nota/ui/shadcn/tooltip/index.js";
import { cn } from "@nota/ui/utils";
import { onMount } from "svelte";
import { getAuthSession, isSignedIn } from "#lib/auth-session.svelte.js";
import {
	CreateNotes,
	CreateWorkspace,
	GlobalSettings,
	NoteMove,
	NoteRename,
	SigninDevice,
	setGlobalSettings,
	Trashed,
} from "#lib/components/dialogs/index.js";
import { AppSideBar } from "#lib/components/index.js";
import { setupAppMenu } from "#lib/menu.ts";
import { orpc, queryClient } from "#lib/orpc.js";
import { secureStorage } from "#lib/platform/securestorage.js";
import { DataProviders } from "#lib/providers/index.js";
import { setTheme } from "#lib/theme.ts";
import { ISDESKTOP } from "#lib/utils.js";
import { setCorrectWindowMode } from "#lib/window.ts";
import { PUBLIC_NOTA_URL } from "$app/env/public";

const { children } = $props();
let open = $state(true);
const settings = setGlobalSettings();

let Devtools = $state<any>(null);
if (import.meta.env.DEV) {
	import("@tanstack/svelte-query-devtools").then((mod) => {
		Devtools = mod.SvelteQueryDevtools;
	});
}

const shouldRenderContent = $derived(ISDESKTOP || isSignedIn());
const session = getAuthSession();

let wasSignedIn = $state(false);
$effect(() => {
	if (!ISDESKTOP && !session.isPending && !isSignedIn()) {
		const returnUrl = typeof window !== "undefined" ? window.location.href : "";
		const signinUrl = returnUrl
			? `${PUBLIC_NOTA_URL}/signin?redirectTo=${encodeURIComponent(returnUrl)}`
			: `${PUBLIC_NOTA_URL}/signin`;
		window.location.href = signinUrl;
	}
});

$effect(() => {
	if (wasSignedIn && !isSignedIn() && !session.isPending) {
		queryClient.removeQueries({ queryKey: orpc.workspace.key() });
		queryClient.removeQueries({ queryKey: orpc.notes.key() });
		queryClient.removeQueries({ queryKey: orpc.storage.key() });
		queryClient.removeQueries({ queryKey: orpc.snapshots.key() });
	}
});

$effect(() => {
	if (!session.isPending) {
		wasSignedIn = isSignedIn();
	}
});

onMount(async () => {
	open = localStorage.getItem("sidebar-state") === "open";
	if (ISDESKTOP) {
		document.documentElement.style.setProperty("--sidebar", "transparent");
		secureStorage.init().then(() => {
			if (!isSignedIn()) session.refetch();
		});
		await setCorrectWindowMode();
		await setupAppMenu();
		setTheme(settings.themeColor);
	}
});
</script>

<ModeWatcher />
<QueryClientProvider client={queryClient}>
  {#if shouldRenderContent}
    <Toaster richColors closeButton />
    <DataProviders>
      <TooltipProvider delayDuration={300}>
        <CreateWorkspace />
        <CreateNotes />
        <NoteRename />
        <NoteMove />
        <ConfirmDelete />
        <Trashed />
        <GlobalSettings />
        {#if ISDESKTOP}
          <SigninDevice />
        {/if}
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
      </TooltipProvider>
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
  {#if Devtools}
    <Devtools />
  {/if}
</QueryClientProvider>
