<script lang="ts">
import ProBadge from '@lib/components/custom/ProBadge.svelte';
import LogOut from '@lucide/svelte/icons/log-out';
import Trash2 from '@lucide/svelte/icons/trash-2';
import * as Avatar from '@nota/ui/shadcn/avatar';
import { Button } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import { toast } from '@nota/ui/shadcn/sonner';
import { resolve } from '$app/paths';
import Topbar from '$lib/components/topbar.svelte';
import { icons } from '@nota/ui/icons/index.js';

const { data } = $props();

const user = $derived(data.user);

const isPro = $derived((user?.subscription_plan || 'free') === 'pro');
const ai_credits = $derived(user?.ai_credits || 0);
const external_customer_id = $derived(user?.external_customer_id);
const sub_type = $derived(user?.subscription_plan || undefined);

function handleDeleteAccount() {
  toast.warning('Account Deletion is coming soon.');
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
        <icons.User class="size-4" />
        <span class="font-medium text-sm">Profile</span>
      </div>
    {/snippet}
  </Topbar>

  <div class="flex-1 overflow-auto p-6 md:p-10">
    <div class="mx-auto max-w-3xl space-y-8">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p class="text-muted-foreground">Manage your account and settings.</p>
      </div>

    <div class="grid gap-8">
      <Card.Root>
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
          <div class="grid gap-2">
            <div class="text-sm font-medium">Available AI Credits</div>
            <div class="text-muted-foreground text-sm">
              {ai_credits}
            </div>
          </div>
        </Card.Content>
        <Card.Footer class="flex justify-end gap-2 border-t pt-6 bg-muted/20">
          {#if !isPro}
            <Button variant="outline" href="/#pricing"
              >Upgrade to
              <ProBadge />
            </Button>
          {:else if external_customer_id}
            <Button
              variant="outline"
              href="https://api.nota.ink/api/v1/payments/portal"
            >
              Manage Your Subscription
            </Button>
          {/if}
          <Button href={resolve('/signout')} variant="outline">
            <LogOut class="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </Card.Footer>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Storage & Billing</Card.Title>
          <Card.Description>Manage your storage limit and billing cycle.</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-6">
          <div class="grid gap-2">
            <div class="text-sm font-medium">Storage Usage</div>
            <div class="flex items-center gap-4">
              <div class="w-full bg-secondary rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-primary h-2.5 rounded-full" style="width: {Math.min(100, ((user.used_storage || 0) / (user.assigned_storage || 1)) * 100)}%"></div>
              </div>
              <div class="text-sm font-medium min-w-max text-muted-foreground">
                {(user.used_storage / 1024 / 1024).toFixed(2)} MB / {(user.assigned_storage / 1024 / 1024).toFixed(2)} MB
              </div>
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
      </Card.Root>

      <Card.Root class="border-destructive">
        <Card.Header>
          <Card.Title class="text-destructive">Danger Zone</Card.Title>
          <Card.Description
            >These actions are permanent and cannot be undone.</Card.Description
          >
        </Card.Header>
        <Card.Content>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold">Delete Account</div>
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
      </div>
    </div>
  </div>
</div>
{/if}
