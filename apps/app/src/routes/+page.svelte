<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { orpc } from "#lib/orpc.js";

const healthCheck = createQuery(() => orpc.healthCheck.queryOptions());
</script>

<main class="w-full h-screen">
  <h1>Hello WOrld</h1>
</main>
