<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { getAuthSession } from "#lib/auth-session.svelte.ts";
import { orpc } from "#lib/orpc.ts";

const healthCheck = createQuery(() => orpc.healthCheck.queryOptions());
const sessionAuth = getAuthSession();
</script>

<div >
  <h1 class="text-center mt-16 text-6xl">Nota</h1>
  {#if sessionAuth.data?.user}
    <p>Logged in as {sessionAuth.data.user.email}</p>
  {:else if sessionAuth.isRefetching || sessionAuth.isPending}
    <p>Loading...</p>
  {:else}
    <p>Not logged in</p>
  {/if}

  <span class="text-muted-foreground text-sm">
    {healthCheck.isLoading
      ? "Checking..."
      : healthCheck.data
        ? "Connected"
        : "Disconnected"}
  </span>
</div>
