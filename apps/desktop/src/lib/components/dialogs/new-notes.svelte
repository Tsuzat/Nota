<script lang="ts">
import { toast } from '@lib/components/ui/sonner';
import { getAuthContext, getNotesContext, type Workspace } from '@nota/client';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import { Checkbox } from '@nota/ui/shadcn/checkbox';
import * as Dialog from '@nota/ui/shadcn/dialog';
import { Input } from '@nota/ui/shadcn/input';
import { Label } from '@nota/ui/shadcn/label';
import type { Snippet } from 'svelte';
import { getLocalNotes } from '$lib/local/notes.svelte';
import type { LocalWorkSpace } from '$lib/local/workspaces.svelte';
import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';

interface Props {
  open?: boolean;
  workspace: LocalWorkSpace | Workspace;
  children?: Snippet<[]>;
}

let { open = $bindable(false), workspace, children }: Props = $props();

let name: string | undefined = $state<string>();
let icon: string = $state('lucide:FileText');
let isFavorite = $state(false);

let loading = $state(false);

const localNotes = getLocalNotes();
const currentUserWorkspace = $derived(useCurrentUserWorkspaceContext().getCurrentUserWorkspace());
const cloudNotes = getNotesContext();
const user = $derived(getAuthContext().user);

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (currentUserWorkspace === null) {
    toast.error('Can find current user workspace');
    return;
  }
  if (name === undefined || name.trim() === '' || icon.trim() === '') {
    toast.error('Please fill in all the fields');
    return;
  }
  try {
    loading = true;
    if (!('owner' in workspace) && !('owner' in currentUserWorkspace))
      await localNotes.createNote(name, icon, isFavorite, workspace, currentUserWorkspace.id);
    else {
      if (!user) {
        toast.error('User is not logged in. Please login to create cloud notes');
        return;
      }
      await cloudNotes.create(name, icon, workspace.id, currentUserWorkspace.id, isFavorite);
    }
    open = false;
  } catch (e) {
    loading = false;
    console.error(e);
    toast.error('Could not create notes');
    return;
  } finally {
    loading = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    open = false;
  }
}
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
	{#if children}
		<Dialog.Trigger>
			{@render children()}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content
		class="w-96"
		showCloseButton={false}
	>
		<Dialog.Header>
			<Dialog.Title>New Notes</Dialog.Title>
			<Dialog.Description
				>Create a new notes for
				<strong>
					{workspace.name}
				</strong>
			</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<div class="flex w-full items-center gap-2">
				<IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
					<div class={buttonVariants({ variant: 'outline', size: 'icon' })}>
						<IconRenderer {icon} />
					</div>
				</IconPicker>
				<Input bind:value={name} placeholder="Note Name" type="text" required />
			</div>
			<div class="flex items-center gap-2">
				<Checkbox id="toggle" bind:checked={isFavorite} />
				<Label for="toggle">Add to Favorites</Label>
			</div>
			<Button type="submit">
				{#if loading}
					<icons.Loader class="animate-spin" />
				{/if}
				Create Note
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
