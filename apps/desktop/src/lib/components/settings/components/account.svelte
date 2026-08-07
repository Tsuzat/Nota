<script lang="ts">
import { ProBadge } from '@lib/components/custom';
import { toast } from '@lib/components/ui/sonner';
import { getAuthContext } from '@nota/client';
import { icons } from '@nota/ui/icons/index.js';
import * as Avatar from '@nota/ui/shadcn/avatar';
import { Badge } from '@nota/ui/shadcn/badge';
import { Button } from '@nota/ui/shadcn/button';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import OAuth from '$lib/components/global-signin/oauth.svelte';

const auth = getAuthContext();
const user = $derived(auth.user);

async function handleSignout() {
  toast.promise(auth.logout(), {
    loading: 'Signing out...',
    success: 'Signed out successfully',
    error: (error) => (error as Error).message,
  });
}

async function handleDeleteUser() {
  toast.warning('Account deletion will be available soon in account dashboard');
}
</script>

<div class="w-full max-w-xl mx-auto space-y-5 pb-8">
  <!-- Page Header -->
  <div class="space-y-0.5">
    <h2
      class="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2"
    >
      <icons.User class="size-5 text-primary" />
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
            src={user.avatar_url}
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

            {#if user.subscription_plan === "pro"}
              <ProBadge />
            {:else}
              <Badge variant="outline">Free</Badge>
            {/if}
          </div>
          <p class="text-xs text-muted-foreground font-mono leading-snug">
            {user.email}
          </p>
          {#if user.ai_credits !== undefined}
            <div
              class="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5"
            >
              <icons.Sparkles class="size-3.5 text-amber-500" />
              <span>${user.ai_credits} Available</span>
            </div>
            <Button
              variant="link"
              onclick={() => openUrl(`${PUBLIC_NOTA_FRONTEND_URL}/profile`)}
              >See Usage</Button
            >
          {/if}
        </div>
      </div>

      <div
        class="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2">
          {#if user.subscription_plan === "free"}
            <Button
              variant="outline"
              size="sm"
              class="gap-1.5 font-medium rounded-lg"
              onclick={() => openUrl(`${PUBLIC_NOTA_FRONTEND_URL}#pricing`)}
            >
              <span>Upgrade to</span>
              <ProBadge />
            </Button>
          {/if}
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 rounded-lg"
            onclick={handleSignout}
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

      <!-- OAuth Buttons Container -->
      <div class="w-full max-w-sm space-y-3 pt-1">
        <OAuth />
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
