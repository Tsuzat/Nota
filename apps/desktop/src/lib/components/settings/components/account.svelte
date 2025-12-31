<script lang="ts">
import { ProBadge } from '@lib/components/custom';
import { toast } from '@lib/components/ui/sonner';
import * as Avatar from '@nota/ui/shadcn/avatar';
import { Button } from '@nota/ui/shadcn/button';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import OAuth from '$lib/components/global-signin/oauth.svelte';
import { getAuthContext } from '@nota/client';

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
  //   if (!confirm('Are you sure you want to delete your account? This action is irreversible.')) {
  //     return;
  //   }
  // You would typically call a Supabase function to delete the user data.
  // For now, we will just sign out.
  toast.warning('Account deletion will be available soon');
  //   await handleSignout();
}
</script>

<div class="mx-auto w-120 p-6">
	{#if user}
		<div class="flex items-center space-x-4">
			<Avatar.Root class="h-16 w-16">
				<Avatar.Image src={user.avatarUrl} alt={user.name ?? 'Unknown'} />
				<Avatar.Fallback>
					{user.name?.charAt(0) ?? user.email.charAt(0)}
				</Avatar.Fallback>
			</Avatar.Root>
			<div class="space-y-1">
				<div class="text-lg font-semibold">
					{user.name ?? 'No name'}
				</div>
				<div class="text-muted-foreground text-sm">{user.email}</div>	
				<div class="text-muted-foreground text-xs">
					Subscription Tier: {user.subscriptionType}
				</div>
			</div>
		</div>
		<div class="mt-6 flex space-x-2">
			{#if user.subscriptionPlan === 'free'}
			<Button variant="outline" onclick={() => {
				openUrl(`${PUBLIC_NOTA_FRONTEND_URL}#pricing`)
			}}>
				<span>Upgrade to </span>
				<ProBadge />
			</Button>
			{/if}
			<Button onclick={handleSignout}>Sign Out</Button>
			<Button variant="destructive" onclick={handleDeleteUser}>Delete Account</Button>
		</div>
	{:else}
		<h2 class="text-lg font-medium">Login to your Account</h2>
		<p class="text-muted-foreground mb-4">
			Sign in to sync your notes and access them from anywhere.
		</p>
		<div class="flex flex-col gap-4">
			<OAuth />
		</div>
	{/if}
</div>
