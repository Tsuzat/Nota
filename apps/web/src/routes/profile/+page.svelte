<script lang="ts">
import { toast } from '@lib/components/ui/sonner';
import type { Session } from '@nota/client';
import { getAuthContext } from '@nota/client';
import { ProBadge } from '@nota/ui/custom/index.js';
import { icons } from '@nota/ui/icons';
import { Badge } from '@nota/ui/shadcn/badge';
import { Button } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import * as Tabs from '@nota/ui/shadcn/tabs';
import { onMount } from 'svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import Particles from '$lib/components/custom/landing/particles.svelte';
import UserAvatar from '$lib/components/custom/user-avatar.svelte';

const { data } = $props();
const authClient = getAuthContext();
const user = $derived(data.user);
const session = $derived(data.session);

let sessions = $state<Session[]>([]);

onMount(async () => {
  try {
    sessions = await authClient.getSessions();
  } catch (e) {
    console.error(e);
  }
});

function timeAgo(date: Date | string | null | undefined) {
  if (!date) return '';
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + 'y ago';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + 'mo ago';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + 'd ago';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + 'h ago';
  interval = Math.floor(seconds / 60);
  return interval + 'm ago';
}

function getDeviceIcon(device: string | null | undefined, browser: string | null | undefined) {
  if (device === 'desktop') return '/favicon.svg';
  if (!browser) return 'https://svgl.app/library/chrome.svg';

  const b = browser.toLowerCase();
  if (b.includes('safari')) return 'https://svgl.app/library/safari.svg';
  if (b.includes('chrome')) return 'https://svgl.app/library/chrome.svg';
  if (b.includes('edge')) return 'https://svgl.app/library/edge.svg';
  if (b.includes('zen')) return 'https://svgl.app/library/zen-browser-dark.svg';
  if (b.includes('firefox')) return 'https://svgl.app/library/firefox.svg';
  if (b.includes('brave')) return 'https://svgl.app/library/brave.svg';

  return 'https://svgl.app/library/chrome.svg';
}

async function handleSignOut() {
  await authClient.logout();
  window.location.href = '/signin';
}

async function handleRevokeSession(id: string) {
  try {
    await authClient.revokeSession(id);
    sessions = sessions.filter((s) => s.id !== id);
  } catch (e) {
    console.error(e);
  }
}

async function handleRevokeOtherSessions() {
  if (session) {
    try {
      await authClient.deleteAllOtherSessions(session.id);
      sessions = await authClient.getSessions();
    } catch (e) {
      console.error(e);
    }
  }
}
</script>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />

<div class="mx-auto max-w-4xl p-6 md:p-10 pt-16 space-y-8">
  <div class="space-y-1">
    <h1 class="text-3xl font-bold tracking-tight">Your Profile</h1>
    <span class="text-muted-foreground"
      >Manage your account, settings, and cloud storage.</span
    >
  </div>

  {#if user}
    <Tabs.Root value="general" class="w-full">
      <Tabs.List class="w-full">
        <Tabs.Trigger value="general">
          <icons.User />
          General
        </Tabs.Trigger>
        <Tabs.Trigger value="billing">
          <icons.CreditCard />
          Billing
        </Tabs.Trigger>
        <Tabs.Trigger value="sessions">
          <icons.Monitor />
          Sessions
        </Tabs.Trigger>
      </Tabs.List>

      <!-- General Tab -->
      <Tabs.Content value="general" class="space-y-6 outline-none">
        <Card.Root class="overflow-hidden">
          <Card.Header>
            <Card.Title>User Information</Card.Title>
            <Card.Description
              >Your personal details and credit status.</Card.Description
            >
          </Card.Header>
          <Card.Content class="space-y-6">
            <div class="flex items-center gap-4 mt-2">
              <UserAvatar
                image={user.avatar_url ?? ""}
                name={user.name ?? "User"}
                class="size-16 text-xl"
              />
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-xl font-semibold"
                    >{user.name ?? "User"}</span
                  >
                  {#if user.subscription_plan === "pro"}
                    <ProBadge />
                  {:else}
                    <Badge variant="outline">Free</Badge>
                  {/if}
                </div>
                <span class="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </div>

            <!-- AI Credits Card inside General section -->
            <div class="rounded-xl border bg-muted/40 p-4 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold flex items-center gap-2">
                  <icons.Sparkles class="size-4 text-orange-500" />
                  Available AI Credits
                </span>
                <Badge variant="secondary" class="font-mono text-xs">
                  {user.ai_credits.toLocaleString()} Credits
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground">
                AI credits are used for smart completions, document analysis,
                and generative note actions.
              </p>
            </div>

            <div class="mt-4">
              <span class="text-sm font-semibold mb-1 block"
                >Account Created</span
              >
              <span class="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </Card.Content>
          <Card.Footer class="justify-end">
            <Button variant="outline" onclick={handleSignOut} class="gap-2">
              <icons.LogOut class="size-4" />
              Sign Out
            </Button>
          </Card.Footer>
        </Card.Root>

        <Card.Root class="border-red-900/50 bg-red-950/10">
          <Card.Header>
            <Card.Title class="text-red-500">Danger Zone</Card.Title>
            <Card.Description class="text-muted-foreground">
              These actions are permanent and cannot be undone.
            </Card.Description>
          </Card.Header>
          <Card.Content class="flex items-center justify-between mt-2">
            <div class="space-y-1">
              <span class="font-medium text-foreground block"
                >Delete Account</span
              >
              <span class="text-sm text-muted-foreground block">
                Permanently delete your account and all associated data.
              </span>
            </div>
            <Button
              variant="destructive"
              class="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 gap-2"
              onclick={() => {
                toast.warning("User deletion is not available yet");
              }}
            >
              <icons.Trash2 class="size-4" />
              Delete Account
            </Button>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Billing Tab -->
      <Tabs.Content value="billing" class="space-y-6 outline-none">
        <Card.Root>
          <Card.Header>
            <Card.Title>Subscription Status</Card.Title>
            <Card.Description>
              Manage your current subscription and billing cycle.
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6 mt-2">
            {#await authClient.getSubscriptionDetails()}
              <div class="flex items-center justify-center p-8">
                <icons.Loader
                  class="size-6 animate-spin text-muted-foreground"
                />
              </div>
            {:then details}
              <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-1">
                  <span class="text-sm font-medium block">Current Plan</span>
                  {#if details.subscription_plan === "pro"}
                    <div class="flex items-center gap-2">
                      <ProBadge class="w-fit mx-0" />
                      {#if details.status === "canceled"}
                        <Badge
                          variant="destructive"
                          class="text-[10px] uppercase">Canceled</Badge
                        >
                      {:else if details.status === "active"}
                        <Badge
                          variant="outline"
                          class="border-green-500/30 text-green-500 bg-green-500/10 font-medium uppercase text-[10px]"
                          >Active</Badge
                        >
                      {/if}
                    </div>
                  {:else}
                    <Badge variant="outline">Free</Badge>
                  {/if}
                </div>

                {#if details.subscription_plan === "pro"}
                  <div class="space-y-1">
                    <span class="text-sm font-medium block">Billing Cycle</span>
                    <span
                      class="text-sm text-muted-foreground block capitalize"
                    >
                      {details.subscription_type || "N/A"}
                    </span>
                  </div>

                  {#if details.amount && details.currency}
                    <div class="space-y-1">
                      <span class="text-sm font-medium block">Amount</span>
                      <span
                        class="text-sm text-muted-foreground block uppercase"
                      >
                        {(details.amount / 100).toFixed(2)}
                        {details.currency}
                      </span>
                    </div>
                  {/if}

                  <div class="space-y-1">
                    <span class="text-sm font-medium block">
                      {details.cancel_at_period_end
                        ? "Ends On"
                        : "Next Billing Date"}
                    </span>
                    <span class="text-sm text-muted-foreground block">
                      {#if details.current_period_end}
                        {new Date(
                          details.current_period_end,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      {:else}
                        N/A
                      {/if}
                    </span>
                  </div>
                {/if}
              </div>
            {:catch error}
              <div class="text-sm text-red-500">
                Failed to load subscription details. {error.message}
              </div>
            {/await}
          </Card.Content>
          {#if user.subscription_plan === "pro"}
            <Card.Footer class="px-6 py-4">
              <Button
                variant="outline"
                href="{PUBLIC_BACKEND_URL}/api/v1/payments/portal"
                target="_blank"
                rel="noopener noreferrer"
                class="gap-2 w-full sm:w-auto"
              >
                <icons.ExternalLink class="size-4" />
                Manage Subscription on Polar
              </Button>
            </Card.Footer>
          {/if}
        </Card.Root>
      </Tabs.Content>

      <!-- Sessions Tab -->
      <Tabs.Content value="sessions" class="outline-none">
        <Card.Root>
          <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-6"
          >
            <div class="space-y-1.5">
              <Card.Title>Active Sessions</Card.Title>
              <Card.Description>
                Manage the devices where you are currently logged in.
              </Card.Description>
            </div>
            <Button
              variant="outline"
              size="sm"
              onclick={handleRevokeOtherSessions}
            >
              Revoke All Other Sessions
            </Button>
          </Card.Header>
          <Card.Content class="grid gap-3">
            {#each sessions as s}
              <div
                class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 p-2"
                  >
                    <img
                      src={getDeviceIcon(s.device, s.browser)}
                      alt={s.browser || "Browser"}
                      class="size-full object-contain"
                    />
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium leading-none">
                        {s.os || "Unknown OS"} • {s.browser ||
                          "Unknown Browser"}
                      </span>
                      <Badge
                        variant="outline"
                        class="border-green-500/30 text-green-500 bg-green-500/10 font-medium uppercase text-[10px]"
                      >
                        {s.device === "desktop" ? "APP" : "WEB"}
                      </Badge>
                      {#if data.session?.id === s.id}
                        <Badge
                          variant="secondary"
                          class="bg-muted font-medium uppercase text-[10px]"
                        >
                          CURRENT DEVICE
                        </Badge>
                      {/if}
                    </div>
                    <div
                      class="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <div class="flex items-center gap-1 text-red-400">
                        <icons.MapPin class="size-3" />
                        <span>{s.country || "Unknown"}</span>
                      </div>
                      <span>•</span>
                      <span
                        >Active {timeAgo(s.refreshed_at || s.created_at)}</span
                      >
                    </div>
                  </div>
                </div>
                {#if data.session?.id !== s.id}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onclick={() => handleRevokeSession(s.id)}
                  >
                    Revoke
                  </Button>
                {/if}
              </div>
            {/each}
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  {/if}
</div>
