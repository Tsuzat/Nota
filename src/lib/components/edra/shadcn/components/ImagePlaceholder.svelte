<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';

	const { editor }: NodeViewProps = $props();
	import Image from '@lucide/svelte/icons/image';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { NodeViewWrapper } from 'svelte-tiptap';
	import * as Tabs from '$lib/components/ui/tabs';
	import { open as openDialog } from '@tauri-apps/plugin-dialog';
	import { FileType, ISTAURI } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';

	let open = $state(false);
	let imageUrl = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		open = false;
		editor.chain().focus().setImage({ src: imageUrl }).run();
	}

	const assetsFiles = editor.commands.getAssets(FileType.IMAGE);

	async function openFileDialog() {
		const file = await openDialog({
			title: 'Select Images',
			multiple: false,
			directory: false,
			filters: [
				{
					name: 'Images',
					extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'raw', 'tga']
				}
			]
		});
		if (!file) return;
		if (ISTAURI) {
			try {
				const uploadedFiles = await editor?.commands.handleFileDrop([file]);
				uploadedFiles.forEach(async (file) => {
					const src = convertFileSrc(file);
					editor.chain().focus().setImage({ src }).run();
				});
				open = true;
			} catch (e) {
				console.error(e);
				toast.error('Could not process images.');
			}
		}
	}
</script>

<NodeViewWrapper
	as="div"
	contenteditable="false"
	class={buttonVariants({
		variant: 'secondary',
		class: 'media-placeholder relative my-2 w-full justify-start p-6'
	})}
	style="user-select: none;"
	draggable={true}
	onclick={() => (open = true)}
>
	<Image />
	<span>Insert an Image</span>
	<Popover.Root bind:open>
		<Popover.Trigger class="sr-only absolute left-1/2">Open</Popover.Trigger>
		<Popover.Content
			contenteditable={false}
			class="bg-popover w-96 rounded-lg p-0"
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
							{#each assets as asset}
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
