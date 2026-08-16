<script lang="ts">
import { toast } from "@nota/ui";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import { authClient } from "#lib/auth-client.ts";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

const sessionQuery = authClient.useSession();

async function handleSignOut() {
	await authClient.signOut({
		fetchOptions: {
			onSuccess: () => {
				goto("/");
			},
			onError: (error) => {
				toast.error("Something went wrong. Please try again.");
				console.error("Sign out failed:", error);
			},
		},
	});
}
</script>

<div class="relative">
  {#if $sessionQuery.isPending}
    <div class="h-8 w-24 animate-pulse rounded bg-neutral-700"></div>
  {:else if $sessionQuery.data?.user}
    {@const user = $sessionQuery.data.user}
    <div class="flex items-center gap-3">
      <span
        class="text-sm text-neutral-300 hidden sm:inline"
        title={user.email}
      >
        {user.name || user.email?.split("@")[0] || "User"}
      </span>
      <Button variant="destructive" onclick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  {:else}
    <div class="flex items-center gap-2">
      <Button href={resolve("/signin")}>
        Sign In
      </Button>
    </div>
  {/if}
</div>
