<script lang="ts">
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
  import "../app.css";
  import { queryClient } from "#lib/orpc.js";
  import { ModeWatcher } from "@nota/ui";
  import Header from "../components/Header.svelte";
  import { Toaster } from "@nota/ui/shadcn/sonner/index.ts";
  import { ISDESKTOP } from "#lib/utils.ts";
  import { Button } from "@nota/ui/shadcn/button/index.js";
  import { resolve } from "$app/paths";

  const { children } = $props();
</script>

<ModeWatcher />
<Toaster />

<QueryClientProvider client={queryClient}>
  <Header />
  {#if ISDESKTOP}
    <Button href={resolve("/todo")}>Open Todo</Button>
  {/if}
  {@render children()}
  <SvelteQueryDevtools />
</QueryClientProvider>
