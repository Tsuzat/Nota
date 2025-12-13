<script lang="ts">
import type { NodeViewProps } from '@tiptap/core';

const { editor }: NodeViewProps = $props();

import SimpleTooltip from '@lib/components/custom/SimpleToolTip.svelte';
import { Button, buttonVariants } from '@lib/components/ui/button';
import { Input } from '@lib/components/ui/input';
import * as Popover from '@lib/components/ui/popover';
import * as Tabs from '@lib/components/ui/tabs';
import Image from '@lucide/svelte/icons/image';
import Loader from '@lucide/svelte/icons/loader';
import { toast } from 'svelte-sonner';
import { NodeViewWrapper } from 'svelte-tiptap';
import { FileType, isURL } from '../../utils';

let open = $state(false);
let imageUrl = $state('');
let isUploading = $state(false);

function handleSubmit(e: Event) {
  e.preventDefault();
  open = false;
  editor.chain().focus().setImage({ src: imageUrl }).run();
}

const assetsFiles = $derived(editor.storage.fileDrop.assetsGetter(FileType.IMAGE));

async function openFileDialog() {
  isUploading = true;
  try {
    const file = await editor.storage.fileDrop.localFileGetter(FileType.IMAGE);
    if (file) {
      editor.chain().focus().setImage({ src: file }).run();
    }
  } catch (e) {
    console.error(e);
    toast.error('Could not process images.');
  } finally {
    isUploading = false;
  }
}
</script>

<NodeViewWrapper
	as="div"
	contenteditable="false"
	class={buttonVariants({
		variant: 'secondary',
		class: 'media-placeholder relative my-2 flex w-full items-center justify-start gap-4 p-6'
	})}
	style="user-select: none;"
	draggable={true}
	onclick={() => (open = true)}
>
	{#if !isUploading}
		<Image />
		<span>Insert an Image</span>
	{:else}
		<Loader class="text-primary animate-spin" />
		<span>Uploading Image</span>
	{/if}
	<Popover.Root bind:open>
		<Popover.Trigger class="sr-only absolute left-1/2">Open</Popover.Trigger>
		<Popover.Content
			contenteditable={false}
			class="bg-popover z-50 w-96 rounded-lg p-0"
			portalProps={{ disabled: true, to: undefined }}
		>
			<Tabs.Root value="local">
				<Tabs.List>
					<Tabs.Trigger value="local">Upload</Tabs.Trigger>
					<Tabs.Trigger value="url">Embed Link</Tabs.Trigger>
					<Tabs.Trigger value="assets">Assets</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="local" class="py-2">
					<Button class="w-full" onclick={openFileDialog}>Upload an Image</Button>
				</Tabs.Content>
				<Tabs.Content value="url" class="py-2">
					<form onsubmit={handleSubmit} class="flex flex-col gap-2">
						<Input placeholder="Embed Image" bind:value={imageUrl} required type="url" />
						<Button type="submit">Insert</Button>
					</form>
				</Tabs.Content>
				<Tabs.Content value="assets" class="max-h-96 overflow-y-auto py-2">
					<span class="mb-4 w-full text-center">Your Workspace Assets</span>
					{#await assetsFiles}
						<div class="flex h-16 items-center justify-center">Loading...</div>
					{:then assets}
						{#if assets.length === 0}
							<div class="flex h-16 items-center justify-center">No assets found</div>
						{:else}
							{#each assets as asset, idx (idx)}
								<div class="flex flex-col items-center justify-center gap-2">
									<SimpleTooltip content="Drag and Drop or click to insert">
										<Button
											variant="ghost"
											class="size-fit p-1"
											onclick={() => {
												open = editor.commands.setImage({ src: asset });
											}}
										>
											<img src={asset} alt={asset} class="h-auto w-full rounded-md object-cover" />
										</Button>
									</SimpleTooltip>
								</div>
							{/each}
						{/if}
					{/await}
				</Tabs.Content>
			</Tabs.Root>
		</Popover.Content>
	</Popover.Root>
</NodeViewWrapper>
