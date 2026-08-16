<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { authClient } from "#lib/auth-client.ts";
import { orpc } from "#lib/orpc.ts";

const sessionQuery = authClient.useSession();

const healthCheck = createQuery(() => orpc.healthCheck.queryOptions());
</script>

<main class="w-full h-screen">
  <h1>Hello WOrld</h1>
  {#if $sessionQuery.data?.user}
    <p>Logged in as {$sessionQuery.data.user.email}</p>
  {:else if $sessionQuery.isRefetching || $sessionQuery.isPending}
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
</main>
