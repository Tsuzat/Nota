<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';

	const { editor }: NodeViewProps = $props();
	import Audio from '@lucide/svelte/icons/audio-lines';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { NodeViewWrapper } from 'svelte-tiptap';
	import * as Tabs from '$lib/components/ui/tabs';
	import { open as openDialog } from '@tauri-apps/plugin-dialog';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { toast } from 'svelte-sonner';
	import { FileType, ISTAURI } from '$lib/utils';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';
	import { isURL } from '../../utils';
	import { Loading } from '$lib/components/ui/command';

	let open = $state(false);
	let audioUrl = $state('');
	let isUploading = $state(false);

	const assetsFiles = $derived(editor.commands.getAssets(FileType.AUDIO));

	function handleSubmit(e: Event) {
		e.preventDefault();
		open = false;
		editor.chain().focus().setAudio(audioUrl).run();
	}

	async function openFileDialog() {
		const file = await openDialog({
			title: 'Select Audio',
			multiple: false,
			directory: false,
			filters: [
				{
					name: 'Select Audio',
					extensions: ['mp3', 'wav', 'ogg', 'aac', 'flac']
				}
			]
		});
		if (!file) return;
		if (ISTAURI) {
			isUploading = true;
			try {
				const uploadedFile = await editor?.commands.handleFileDrop(file);
				const src = isURL(uploadedFile) ? uploadedFile : convertFileSrc(uploadedFile);
				editor.chain().focus().setAudio(src).run();
				open = false;
			} catch (e) {
				console.error(e);
				toast.error('Could not process audio.');
			} finally {
				isUploading = false;
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
	onclick={() => {
		open = true;
	}}
>
	{#if isUploading}
		<Loading class="text-primary animate-spin" />
		<span>Uploading Audio File</span>
	{:else}
		<Audio />
		<span>Insert an audio</span>
	{/if}
	<Popover.Root bind:open>
		<Popover.Trigger class="sr-only absolute left-1/2">Open</Popover.Trigger>
		<Popover.Content
			contenteditable={false}
			class="bg-popover w-96 rounded-lg p-0 transition-all duration-500"
			portalProps={{ disabled: true, to: undefined }}
		>
			<Tabs.Root value="local">
				<Tabs.List>
					<Tabs.Trigger value="local">Upload</Tabs.Trigger>
					<Tabs.Trigger value="url">Embed Link</Tabs.Trigger>
					<Tabs.Trigger value="assets">Assets</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="local" class="py-2">
					<Button class="w-full" onclick={openFileDialog}>Upload an Audio</Button>
				</Tabs.Content>
				<Tabs.Content value="url" class="py-2">
					<form onsubmit={handleSubmit} class="flex flex-col gap-2">
						<Input placeholder="Embed Audio" bind:value={audioUrl} required type="url" />
						<Button type="submit">Insert</Button>
					</form>
				</Tabs.Content>
				<Tabs.Content value="assets" class="max-h-96 overflow-y-auto py-2">
					<span class="mb-4">Your Workspace Assets</span>
					{#await assetsFiles}
						<div class="flex h-16 items-center justify-center">Loading...</div>
					{:then assets}
						{#if assets.length === 0}
							<div class="flex h-16 items-center justify-center">No assets found</div>
						{:else}
							{#each assets as asset, idx (idx)}
								<div class="flex flex-col items-center justify-center gap-2">
									<SimpleTooltip content="Click to insert">
										<Button
											variant="ghost"
											class="size-fit p-1"
											onclick={() => {
												editor.commands.setAudio(asset);
											}}
										>
											<!-- svelte-ignore element_invalid_self_closing_tag -->
											<audio src={asset} controls class="h-auto w-full rounded-md object-cover" />
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
