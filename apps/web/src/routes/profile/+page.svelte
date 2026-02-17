<script lang="ts">
import ProBadge from '@lib/components/custom/ProBadge.svelte';
import LogOut from '@lucide/svelte/icons/log-out';
import Trash2 from '@lucide/svelte/icons/trash-2';
import { getAuthContext } from '@nota/client';
import * as Avatar from '@nota/ui/shadcn/avatar';
import { Button } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import { toast } from '@nota/ui/shadcn/sonner';
import { logout } from '$lib/utils.js';

const auth = getAuthContext();
const user = $derived(auth.user);

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
  <div class="container mx-auto max-w-4xl p-4 md:p-8">
    
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Profile</h1>
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
        <Card.Footer class="flex justify-end gap-2">
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
          <Button onclick={logout} variant="outline">
            <LogOut class="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </Card.Footer>
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
{/if}
