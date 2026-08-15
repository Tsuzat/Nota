<script lang="ts">
import { QueryClientProvider } from "@tanstack/svelte-query";
import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
import "../app.css";
import { ModeWatcher } from "@nota/ui";
import { Toaster } from "@nota/ui/shadcn/sonner/index.js";
import * as Tooltip from "@nota/ui/shadcn/tooltip/index.js";
import { queryClient } from "#lib/orpc.ts";

const { children } = $props();
</script>

<ModeWatcher />
<Toaster closeButton richColors />

<QueryClientProvider client={queryClient}>
  <Tooltip.Provider>
    {@render children()}
  </Tooltip.Provider>
  <SvelteQueryDevtools />
</QueryClientProvider>
