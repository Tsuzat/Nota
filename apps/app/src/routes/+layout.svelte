<script lang="ts">
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
  import "../app.css";
  import { queryClient } from "#lib/orpc.js";
  import { ModeWatcher } from "@nota/ui";
  import { Toaster } from "@nota/ui/shadcn/sonner/index.ts";
  import { ISDESKTOP } from "#lib/utils.ts";
  import * as Sidebar from "@nota/ui/shadcn/sidebar/index.ts";
  import { onMount } from "svelte";
  import { AppSideBar } from "#lib/components/index.ts";

  const { children } = $props();
  let open = $state(localStorage.getItem("sidebar-state") === "open");

  onMount(() => {
    // if (ISDESKTOP) {
    //   document.documentElement.style.setProperty("--sidebar", "transparent");
    // }
  });
</script>

<ModeWatcher />
<Toaster />
<QueryClientProvider client={queryClient}>
  <Sidebar.Provider
    bind:open
    onOpenChange={(value: boolean) => {
      localStorage.setItem("sidebar-state", value ? "open" : "closed");
    }}
  >
    <AppSideBar />
    <Sidebar.Inset
      class="flex size-full min-h-0 w-full! flex-col! overflow-hidden!"
    >
      {@render children()}
    </Sidebar.Inset>
  </Sidebar.Provider>
  <SvelteQueryDevtools />
</QueryClientProvider>
