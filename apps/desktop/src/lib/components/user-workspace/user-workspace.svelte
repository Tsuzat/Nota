<script lang="ts">
import { getAuthContext, getUserWorkspacesContext } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Dialog from '@nota/ui/shadcn/dialog';
import { Input } from '@nota/ui/shadcn/input';
import { Label } from '@nota/ui/shadcn/label';
import { toast } from '@nota/ui/shadcn/sonner';
import { Switch } from '@nota/ui/shadcn/switch';
import { getLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
import { getNewUserWorkspace } from '.';

let name: string | undefined = $state<string>();
let icon: string = $state('lucide:User');
let useCloud = $state(false);

let loading = $state(false);
const localUserWorkspaces = getLocalUserWorkspaces();
const cloudUserWorkspaces = getUserWorkspacesContext();
const useNewLocalUserWorkspace = getNewUserWorkspace();
const user = $derived(getAuthContext().user);

async function handlesubmit(e: Event) {
  e.preventDefault();
  loading = true;
  if (!name || name.trim() === '') {
    loading = false;
    return;
  }
  try {
    if (useCloud) {
      if (!user) {
        toast.error('User is not logged in', {
          description: 'Please login again or create local user workspaces',
        });
        return;
      }
	  if (user.subscriptionPlan === "free"){
		toast.error('Pro feature is not available for free users', {
          description: 'Please upgrade to pro to use this feature',
        });
		return;
	  }
      await cloudUserWorkspaces.create(icon, name);
    } else await localUserWorkspaces.createUserWorkspace(name, icon);
    useNewLocalUserWorkspace.open = false;
    toast.success('User Workspace created successfully');
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when creating the user workspace');
  } finally {
    loading = false;
  }
}
</script>

<Dialog.Root bind:open={useNewLocalUserWorkspace.open}>
	<Dialog.Content class="w-full max-w-lg">
		<Dialog.Header>
			<Dialog.Title>User Workspace</Dialog.Title>
			<Dialog.Description>
				Create a new user workspace, which can be used to organize your workspaces and notes.
			</Dialog.Description>
		</Dialog.Header>
		<form class="flex flex-col gap-2" onsubmit={handlesubmit}>
			<div class="flex w-full items-center gap-2">
				<IconPicker {icon} side="right" onSelect={(ic: string) => (icon = ic)}>
					<div class={buttonVariants({ variant: 'outline', size: 'icon' })}>
						<IconRenderer {icon} />
					</div>
				</IconPicker>
				<Input bind:value={name} placeholder="User Workspace Name" type="text" required />
			</div>
			{#if user !== null}
				<div class="flex items-center gap-2">
					<Label for="cloud">Use Cloud</Label>
					<Switch bind:checked={useCloud} id="cloud" />
					<SimpleToolTip content={useCloud ? 'Create On Cloud' : 'Create Locally'}>
						<Button variant="ghost" size="icon">
							{#if useCloud}
								<icons.Cloud />
							{:else}
								<icons.Monitor />
							{/if}
						</Button>
					</SimpleToolTip>
				</div>
			{/if}
			<Button type="submit" class="w-full">
				{#if loading}
					<icons.Loader class="animate-spin" />
				{/if}
				Create User Workspace {useCloud ? 'On Cloud' : 'Locally'}
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
