<script lang="ts">
  import { orpc } from "#lib/orpc.js";
  import { createQuery } from "@tanstack/svelte-query";
  const healthCheck = createQuery(() => orpc.healthCheck.queryOptions());
</script>

<main class="w-full h-screen">
  <h1>Hello WOrld</h1>
</main>
