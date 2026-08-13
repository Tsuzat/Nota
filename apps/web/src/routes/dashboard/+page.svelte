<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "#lib/auth-client.ts";
  import { orpc } from "#lib/orpc.ts";
  import { createQuery } from "@tanstack/svelte-query";
  let customerState = $state<{ activeSubscriptions?: unknown[] } | null>(null);

  const sessionQuery = authClient.useSession();

  const privateDataQuery = createQuery(() => orpc.privateData.queryOptions());

  $effect(() => {
    if (!$sessionQuery.isPending && !$sessionQuery.data) {
      goto("/login");
    }
  });

  $effect(() => {
    if ($sessionQuery.data) {
      authClient.customer.state().then(({ data }) => {
        customerState = data;
      });
    }
  });
</script>

{#if $sessionQuery.isPending}
  <div>Loading...</div>
{:else if !$sessionQuery.data}
  <div>Redirecting to login...</div>
{:else}
  <div>
    <h1>Dashboard</h1>
    <p>Welcome {$sessionQuery.data.user.name}</p>
    <p>API: {privateDataQuery.data?.message}</p>
    <p>
      Plan: {customerState?.activeSubscriptions?.length > 0 ? "Pro" : "Free"}
    </p>
    {#if customerState?.activeSubscriptions?.length > 0}
      <button onclick={async () => await authClient.customer.portal()}>
        Manage Subscription
      </button>
    {:else}
      <button onclick={async () => await authClient.checkout({ slug: "pro" })}>
        Upgrade to Pro
      </button>
    {/if}
  </div>
{/if}
