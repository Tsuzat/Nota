<script lang="ts">
import { icons, Sparkles } from "@lucide/svelte";
import User from "@lucide/svelte/icons/user";
import { toast } from "@nota/ui";
import * as Avatar from "@nota/ui/shadcn/avatar/index.ts";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import { createQuery } from "@tanstack/svelte-query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getAuthSession, isSignedIn } from "#lib/auth-session.svelte.ts";
import { orpc } from "#lib/orpc.ts";
import { signOut } from "#lib/signout.ts";
import { PUBLIC_NOTA_URL } from "$app/env/public";

const user = $derived(getAuthSession().data?.user);

const userQuota = createQuery(() => {
	return {
		...orpc.userquota.getQuota.queryOptions(),
		enabled: isSignedIn(),
	};
});

async function handleDeleteUser() {
	toast.warning("Account deletion will be available soon in account dashboard");
}
</script>

<div class="w-full max-w-xl mx-auto space-y-5 pb-8">
  <!-- Page Header -->
  <div class="space-y-0.5">
    <h2
      class="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2"
    >
      <User class="size-5 text-primary" />
      <span>Account Settings</span>
    </h2>
    <span class="text-xs text-muted-foreground leading-snug"
      >Manage your cloud profile, subscription plan, and device synchronization.</span
    >
  </div>

  {#if user}
    <div class="rounded-xl border border-border/40 bg-muted/10 p-5 space-y-5">
      <div class="flex items-center gap-4">
        <Avatar.Root
          class="size-16 border-2 border-primary/20 ring-4 ring-primary/5 shadow-sm"
        >
          <Avatar.Image
            src={user.image}
            alt={user.name ?? "User Avatar"}
          />
          <Avatar.Fallback class="bg-primary/10 text-primary font-bold text-lg">
            {user.name?.charAt(0) ?? user.email.charAt(0)}
          </Avatar.Fallback>
        </Avatar.Root>
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold text-foreground">
              {user.name ?? "User Profile"}
            </span>

            {#if  true}
              <Badge>Pro</Badge>
            {:else}
              <Badge variant="outline">Free</Badge>
            {/if}
          </div>
          <p class="text-xs text-muted-foreground font-mono leading-snug">
            {user.email}
          </p>
          {#if userQuota.data?.aiCreditBalanceCents}
            <div
              class="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5"
            >
              <Sparkles class="size-3.5 text-amber-500" />
              <span>${(userQuota.data.aiCreditBalanceCents / 100).toFixed(2)} Available</span>
            </div>
            <Button
              variant="link"
              onclick={() => openUrl(`${PUBLIC_NOTA_URL}/profile`)}
              >See Usage</Button
            >
          {/if}
        </div>
      </div>

      <div
        class="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2">
          {#if userQuota.data?.planTier === "free"}
            <Button
              variant="outline"
              size="sm"
              class="gap-1.5 font-medium rounded-lg"
              onclick={() => openUrl(`${PUBLIC_NOTA_URL}#pricing`)}
            >
              <span>Upgrade to Pro</span>
              
            </Button>
          {/if}
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 rounded-lg"
            onclick={signOut}
          >
            <icons.LogOut class="size-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 rounded-lg"
          onclick={handleDeleteUser}
        >
          <icons.Trash2 class="size-3.5" />
          <span>Delete Account</span>
        </Button>
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center text-center space-y-5 py-4 px-4">
      <!-- Header Icon & Title -->
      <div class="flex flex-col items-center space-y-2.5">
        <div
          class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs"
        >
          <icons.CloudSync class="size-7" />
        </div>
        <div class="space-y-0.5 max-w-sm">
          <h3 class="font-semibold text-lg tracking-tight text-foreground">
            Sign in to Nota
          </h3>
          <p class="text-xs text-muted-foreground leading-snug">
            Sync your notes seamlessly across desktop and mobile with end-to-end
            cloud backup.
          </p>
        </div>
      </div> 

      <!-- Privacy Footer -->
      <div
        class="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70 pt-1"
      >
        <icons.Lock class="size-3 text-muted-foreground/90" />
        <span>Your notes & local data remain encrypted & private.</span>
      </div>
    </div>
  {/if}
</div>
