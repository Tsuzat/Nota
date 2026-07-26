<script lang="ts">
  import { getAuthContext } from "@nota/client";
  import { onMount } from "svelte";
  import UserAvatar from "$lib/components/custom/user-avatar.svelte";
  import { Button } from "@nota/ui/shadcn/button";
  import { Badge } from "@nota/ui/shadcn/badge";
  import * as Tabs from "@nota/ui/shadcn/tabs";
  import * as Card from "@nota/ui/shadcn/card";
  import { icons } from "@nota/ui/icons";
  import type { Session } from "@nota/client";
  import Particles from "$lib/components/custom/landing/particles.svelte";

  const { data } = $props();
  const authClient = getAuthContext();
  const user = $derived(data.user);

  let sessions = $state<Session[]>([]);

  onMount(async () => {
    try {
      sessions = await authClient.getSessions();
    } catch (e) {
      console.error(e);
    }
  });

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function timeAgo(date: Date | string | null | undefined) {
    if (!date) return "";
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return "just now";
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + "y ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + "mo ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + "d ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + "h ago";
    interval = Math.floor(seconds / 60);
    return interval + "m ago";
  }

  const storagePercentage = $derived(
    user.assigned_storage > 0
      ? (user.used_storage / user.assigned_storage) * 100
      : 0,
  );

  async function handleSignOut() {
    await authClient.logout();
    window.location.href = "/signin";
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
    if (data.session) {
      try {
        await authClient.deleteAllOtherSessions(data.session.id);
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
    <p class="text-muted-foreground">Manage your account and settings.</p>
  </div>

  <Tabs.Root value="general" class="w-full">
    <Tabs.List class="mb-6 bg-muted/50 border">
      <Tabs.Trigger value="general" class="rounded-sm">General</Tabs.Trigger>
      <Tabs.Trigger value="billing" class="rounded-sm">Billing</Tabs.Trigger>
      <Tabs.Trigger value="settings" class="rounded-sm">Settings</Tabs.Trigger>
      <Tabs.Trigger value="sessions" class="rounded-sm">Sessions</Tabs.Trigger>
    </Tabs.List>

    <!-- General Tab -->
    <Tabs.Content value="general" class="space-y-6 outline-none">
      <Card.Root class="overflow-hidden">
        <Card.Header>
          <Card.Title>User Information</Card.Title>
          <Card.Description>Your personal details.</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="flex items-center gap-4 mt-2">
            <UserAvatar
              image={user.avatar_url ?? ""}
              name={user.name ?? "User"}
              class="size-16 text-xl"
            />
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="text-xl font-semibold">{user.name ?? "User"}</span>
                {#if user.subscription_plan === "pro"}
                  <Badge
                    variant="outline"
                    class="text-purple-500 border-purple-500/30 bg-purple-500/10 font-normal uppercase text-[10px]"
                    >pro</Badge
                  >
                {/if}
              </div>
              <span class="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>

          <div class="mt-8">
            <p class="text-sm font-semibold mb-1">Account created</p>
            <p class="text-sm text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </Card.Content>
        <Card.Footer class="border-t bg-muted/20 px-6 py-4 flex justify-end">
          <Button variant="outline" onclick={handleSignOut} class="gap-2">
            <icons.LogOut class="size-4" />
            Sign Out
          </Button>
        </Card.Footer>
      </Card.Root>

      <Card.Root class="border-red-900/50 bg-red-950/10">
        <Card.Header>
          <Card.Title class="text-red-500">Danger Zone</Card.Title>
          <Card.Description class="text-muted-foreground"
            >These actions are permanent and cannot be undone.</Card.Description
          >
        </Card.Header>
        <Card.Content class="flex items-center justify-between mt-2">
          <div class="space-y-1">
            <p class="font-medium text-foreground">Delete Account</p>
            <p class="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <Button
            variant="destructive"
            class="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 gap-2"
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
          <Card.Title>Storage & Usage</Card.Title>
          <Card.Description
            >Manage your storage limits and AI credits.</Card.Description
          >
        </Card.Header>
        <Card.Content class="space-y-8 mt-2">
          <div class="space-y-2">
            <div class="flex justify-between items-end mb-2">
              <p class="text-sm font-medium">Storage Usage</p>
              <p class="text-xs text-muted-foreground">
                {formatBytes(user.used_storage)} / {formatBytes(
                  user.assigned_storage,
                )}
              </p>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                class="h-full rounded-full bg-primary/80 transition-all duration-500"
                style="width: {storagePercentage}%"
              ></div>
            </div>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium">Available AI Credits</p>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <icons.Sparkles class="size-4 text-orange-500" />
              <span>{user.ai_credits} Tokens remaining</span>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Subscription Status</Card.Title>
          <Card.Description
            >Manage your current subscription and billing cycle.</Card.Description
          >
        </Card.Header>
        <Card.Content class="space-y-6 mt-2">
          <div class="space-y-1">
            <p class="text-sm font-medium">Current Plan</p>
            <div class="flex items-center gap-2">
              <span class="capitalize text-muted-foreground"
                >{user.subscription_plan}</span
              >
              {#if user.subscription_plan === "pro"}
                <Badge
                  variant="outline"
                  class="text-purple-500 border-purple-500/30 bg-purple-500/10 font-normal uppercase text-[10px]"
                  >pro</Badge
                >
              {/if}
            </div>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium">Subscription Cycle</p>
            <p class="text-sm text-muted-foreground">
              {#if user.next_billing_at}
                Next billing date: {new Date(
                  user.next_billing_at,
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              {:else}
                N/A
              {/if}
            </p>
          </div>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Settings Tab -->
    <Tabs.Content value="settings" class="outline-none">
      <Card.Root>
        <Card.Header>
          <Card.Title>Settings</Card.Title>
          <Card.Description>Manage your preferences.</Card.Description>
        </Card.Header>
        <Card.Content>
          <p class="text-sm text-muted-foreground mt-2">
            No settings available at the moment.
          </p>
        </Card.Content>
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
            <Card.Description
              >Manage the devices where you are currently logged in.</Card.Description
            >
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
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground"
                >
                  {#if s.browser?.toLowerCase().includes("safari")}
                    <icons.Compass class="size-5" />
                  {:else if s.browser?.toLowerCase().includes("firefox")}
                    <icons.Flame class="size-5 text-orange-500" />
                  {:else}
                    <icons.Globe class="size-5" />
                  {/if}
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium leading-none">
                      {s.os || "Unknown OS"} • {s.browser || "Unknown Browser"}
                    </p>
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
                        >CURRENT DEVICE</Badge
                      >
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
                    <span>Active {timeAgo(s.refreshed_at || s.created_at)}</span
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
</div>
