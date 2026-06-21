<script lang="ts">
import ProBadge from '@lib/components/custom/ProBadge.svelte';
import LogOut from '@lucide/svelte/icons/log-out';
import Trash2 from '@lucide/svelte/icons/trash-2';
import MonitorSmartphone from '@lucide/svelte/icons/monitor-smartphone';
import MapPin from '@lucide/svelte/icons/map-pin';
import * as Avatar from '@nota/ui/shadcn/avatar';
import { Button } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import { toast } from '@nota/ui/shadcn/sonner';
import { resolve } from '$app/paths';
import Topbar from '$lib/components/topbar.svelte';
import { BarSpinner, BraveBrowser, ChromeBrowser, EdgeBrowser, FirefoxBrowser, icons, SafariBrowser, ZenBrowser } from '@nota/ui/icons/index.js';
import * as Tabs from '@nota/ui/shadcn/tabs';
import ToggleMode from '@lib/components/custom/ToggleMode.svelte';

const { data } = $props();

const user = $derived(data.user);

const isPro = $derived((user?.subscription_plan || 'free') === 'pro');
const ai_credits = $derived(user?.ai_credits || 0);
const external_customer_id = $derived(user?.external_customer_id);
const sub_type = $derived(user?.subscription_plan || undefined);

function handleDeleteAccount() {
  toast.warning('Account Deletion is coming soon.');
}

import { onMount } from 'svelte';
import { getAuthContext } from '@nota/client';
import { parseSession, type ParsedSession, type Session } from '@nota/client';

const auth = getAuthContext();
let sessions: (Session & ParsedSession)[] = $state([]);
let isLoadingSessions = $state(true);

onMount(async () => {
  try {
    const rawSessions = await auth.getSessions();
    // Assuming the one with the latest refreshed_at or created_at might be current if we don't know the ID
    // For now we'll just parse them
    sessions = rawSessions.map(s => ({
      ...s,
      ...parseSession(s.user_agent ?? "", s)
    })).sort((a, b) => new Date(b.refreshed_at || b.created_at).getTime() - new Date(a.refreshed_at || a.created_at).getTime());
    
    // Naively mark the most recently active one as current if we don't have currentSessionId
    if (sessions.length > 0 && !sessions.some(s => s.isCurrent)) {
      sessions[0].isCurrent = true;
    }
  } catch (err) {
    toast.error('Failed to load sessions');
  } finally {
    isLoadingSessions = false;
  }
});

async function revokeSession(id: string) {
  try {
    await auth.revokeSession(id);
    sessions = sessions.filter(s => s.id !== id);
    toast.success('Session revoked successfully.');
  } catch (err) {
    toast.error('Failed to revoke session.');
  }
}

async function revokeAllOtherSessions() {
  try {
    // Current is either the one marked isCurrent or the first one
    const currentSession = sessions.find(s => s.isCurrent) || sessions[0];
    if (!currentSession) return;
    await auth.deleteAllOtherSessions(currentSession.id);
    sessions = sessions.filter(s => s.id === currentSession.id);
    toast.success('All other sessions revoked successfully.');
  } catch (err) {
    toast.error('Failed to revoke other sessions.');
  }
}
</script>

{#if !user}
  <main class="container mx-auto max-w-4xl p-4 md:p-8">
    <h2>Please sign in to view your profile.</h2>
  </main>
{:else}
<div class="flex h-screen w-full flex-col bg-background text-foreground">
  <Topbar>
    {#snippet left()}
      <div class="flex items-center gap-2">
      <Button href={resolve("/")} variant="outline" size="icon">
        <icons.ChevronLeft />
      </Button>
        <icons.User class="size-4" />
        <span class="font-medium text-sm">Profile</span>
      </div>
    {/snippet}
  </Topbar>

  <div class="flex-1 overflow-auto p-6 md:p-10">
    <div class="mx-auto max-w-4xl space-y-8 animate-in fade-in">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p class="text-muted-foreground">Manage your account and settings.</p>
      </div>

      <Tabs.Root value="general" class="w-full">
        <Tabs.List class="grid w-full grid-cols-4 lg:w-[400px]">
          <Tabs.Trigger value="general">General</Tabs.Trigger>
          <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
          <Tabs.Trigger value="sessions">Sessions</Tabs.Trigger>
        </Tabs.List>

        <!-- General Tab -->
        <Tabs.Content value="general" class="space-y-8 mt-6">
          <Card.Root class="border-border/50 bg-card/50 backdrop-blur-xs">
            <Card.Header>
              <Card.Title>User Information</Card.Title>
              <Card.Description>Your personal details.</Card.Description>
            </Card.Header>
            <Card.Content class="grid gap-6">
              <div class="flex items-center gap-4">
                <Avatar.Root class="h-16 w-16">
                  {#if user.avatar_url}
                    <Avatar.Image src={user.avatar_url} alt={user.name} />
                  {/if}
                  <Avatar.Fallback>
                    {user.name?.charAt(0) ?? user.email.charAt(0)?.toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="grid gap-1">
                  <div class="text-xl font-semibold flex items-center gap-2">
                    <span>
                      {user.name ?? "No Name"}
                    </span>
                    {#if isPro}
                      <ProBadge text={sub_type} />
                    {/if}
                  </div>
                  <div class="text-muted-foreground text-sm">{user?.email}</div>
                </div>
              </div>
              <div class="grid gap-2">
                <div class="text-sm font-medium">Account created</div>
                <div class="text-muted-foreground text-sm">
                  {new Date(user.created_at ?? "").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </Card.Content>
            <Card.Footer class="flex justify-end gap-2 border-t pt-6 bg-muted/10">
              <Button href={resolve('/signout')} variant="outline">
                <LogOut class="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </Card.Footer>
          </Card.Root>

          <Card.Root class="border-destructive/30 bg-destructive/5">
            <Card.Header>
              <Card.Title class="text-destructive">Danger Zone</Card.Title>
              <Card.Description>These actions are permanent and cannot be undone.</Card.Description>
            </Card.Header>
            <Card.Content>
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold text-foreground">Delete Account</div>
                  <div class="text-muted-foreground text-sm">
                    Permanently delete your account and all associated data.
                  </div>
                </div>
                <Button onclick={handleDeleteAccount} variant="destructive">
                  <Trash2 class="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </Card.Content>
          </Card.Root>
        </Tabs.Content>

        <!-- Billing Tab -->
        <Tabs.Content value="billing" class="space-y-8 mt-6">
          <Card.Root class="border-border/50 bg-card/50 backdrop-blur-xs">
            <Card.Header>
              <Card.Title>Storage & Usage</Card.Title>
              <Card.Description>Manage your storage limits and AI credits.</Card.Description>
            </Card.Header>
            <Card.Content class="grid gap-6">
              <div class="grid gap-2">
                <div class="text-sm font-medium flex justify-between">
                  <span>Storage Usage</span>
                  <span class="text-muted-foreground">
                    {(user.used_storage / 1024 / 1024).toFixed(2)} MB / {(user.assigned_storage / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div class="w-full bg-secondary rounded-full h-2.5 dark:bg-gray-700">
                  <div class="bg-primary h-2.5 rounded-full" style="width: {Math.min(100, ((user.used_storage || 0) / (user.assigned_storage || 1)) * 100)}%"></div>
                </div>
              </div>
              
              <div class="grid gap-2">
                <div class="text-sm font-medium">Available AI Credits</div>
                <div class="text-muted-foreground text-sm flex items-center gap-2">
                  <icons.Sparkles class="size-4 text-orange-500" />
                  {ai_credits} Tokens remaining
                </div>
              </div>
            </Card.Content>
          </Card.Root>

          <Card.Root class="border-border/50 bg-card/50 backdrop-blur-xs">
            <Card.Header>
              <Card.Title>Subscription Status</Card.Title>
              <Card.Description>Manage your current subscription and billing cycle.</Card.Description>
            </Card.Header>
            <Card.Content class="grid gap-6">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-medium leading-none">Current Plan</p>
                  <p class="text-sm text-muted-foreground capitalize flex items-center gap-2 mt-1">
                    {sub_type || 'Free Tier'}
                    {#if isPro}
                      <ProBadge />
                    {/if}
                  </p>
                </div>
              </div>
              <div class="grid gap-2">
                <div class="text-sm font-medium">Subscription Cycle</div>
                <div class="text-muted-foreground text-sm">
                  {#if user.next_billing_at}
                    Next billing date: {new Date(user.next_billing_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  {:else}
                    No active billing cycle
                  {/if}
                </div>
              </div>
            </Card.Content>
            <Card.Footer class="flex justify-end gap-2 border-t pt-6 bg-muted/10">
              {#if !isPro}
                <Button variant="default" href="/#pricing">
                  Upgrade to <ProBadge />
                </Button>
              {:else if external_customer_id}
                <Button variant="outline" href="https://api.nota.ink/api/v1/payments/portal">
                  Manage Subscription
                </Button>
              {/if}
            </Card.Footer>
          </Card.Root>
        </Tabs.Content>

        <!-- Settings Tab -->
        <Tabs.Content value="settings" class="space-y-8 mt-6">
          <Card.Root class="border-border/50 bg-card/50 backdrop-blur-xs">
            <Card.Header>
              <Card.Title>Appearance</Card.Title>
              <Card.Description>Customize the look and feel of the application.</Card.Description>
            </Card.Header>
            <Card.Content>
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <div class="font-medium">Theme Mode</div>
                  <div class="text-sm text-muted-foreground">Switch between light and dark themes.</div>
                </div>
                <ToggleMode />
              </div>
            </Card.Content>
          </Card.Root>
        </Tabs.Content>

        <!-- Sessions Tab -->
        <Tabs.Content value="sessions" class="space-y-8 mt-6">
          <Card.Root class="border-border/50 bg-card/50 backdrop-blur-xs">
            <Card.Header class="flex flex-row items-center justify-between">
              <div>
                <Card.Title>Active Sessions</Card.Title>
                <Card.Description>Manage the devices where you are currently logged in.</Card.Description>
              </div>
              {#if sessions.length > 1}
                <Button variant="outline" size="sm" onclick={revokeAllOtherSessions}>
                  Revoke All Other Sessions
                </Button>
              {/if}
            </Card.Header>
            <Card.Content class="grid gap-4">
              {#if isLoadingSessions}
                <div class="flex items-center justify-center py-8">
                  <BarSpinner class="size-6 text-muted-foreground" />
                </div>
              {:else if sessions.length === 0}
                <div class="text-center text-sm text-muted-foreground py-8">No active sessions found.</div>
              {:else}
                {#each sessions as session (session.id)}
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 bg-background/50 gap-4">
                    <div class="flex items-center gap-4">
                      <div class="bg-muted p-2 rounded-full flex items-center justify-center size-10">
                        {#if session.browserName === 'Chrome'}
                          <ChromeBrowser class="size-6" />
                        {:else if session.browserName === 'Safari'}
                          <SafariBrowser class="size-6" />
                        {:else if session.browserName === 'Edge'}
                          <EdgeBrowser class="size-6" />
                        {:else if session.browserName === 'Firefox'}
                          <FirefoxBrowser class="size-6" />
                        {:else if session.browserName === 'Brave'}
                          <BraveBrowser class="size-6" />
                        {:else if session.browserName === 'Zen'}
                          <ZenBrowser class="size-6" />
                        {:else}
                          <MonitorSmartphone class="size-5 text-muted-foreground" />
                        {/if}
                      </div>
                      <div>
                        <div class="font-medium flex items-center gap-2">
                          {session.osName} &bull; {session.browserName}
                          {#if session.isCurrent}
                            <span class="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Current Device</span>
                          {/if}
                        </div>
                        <div class="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                          {#if session.ip}
                            <span class="flex items-center gap-1"><MapPin class="size-3" /> {session.ip}</span>
                            <span class="text-muted-foreground/60">&bull;</span>
                          {/if}
                          <span>Active {session.createdAgo}</span>
                        </div>
                      </div>
                    </div>
                    {#if !session.isCurrent}
                      <Button variant="ghost" size="sm" class="text-destructive hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto" onclick={() => revokeSession(session.id)}>
                        Revoke
                      </Button>
                    {/if}
                  </div>
                {/each}
              {/if}
            </Card.Content>
          </Card.Root>
        </Tabs.Content>

      </Tabs.Root>
    </div>
  </div>
</div>
{/if}
