<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { authClient } from "#lib/auth-client.js";
import { orpc } from "#lib/orpc.js";
import { PUBLIC_NOTA_URL } from "$app/env/public";

let customerState = $state<{ activeSubscriptions?: unknown[] } | null>(null);

const sessionQuery = authClient.useSession();

const privateDataQuery = createQuery(() => orpc.privateData.queryOptions());

$effect(() => {
	if (!$sessionQuery.isPending && !$sessionQuery.data) {
		window.location.href = `${PUBLIC_NOTA_URL}/signin`;
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
	<div>Redirecting to sign in...</div>
{:else}
	<div>
		<h1>Dashboard</h1>
		<p>Welcome {$sessionQuery.data.user.name}</p>
		<p>API: {privateDataQuery.data?.message}</p>
		<p>Plan: {(customerState?.activeSubscriptions?.length ?? 0) > 0 ? "Pro" : "Free"}</p>
		{#if (customerState?.activeSubscriptions?.length ?? 0) > 0}
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
