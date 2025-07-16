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
	import { ISTAURI } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';

	let open = $state(false);
	let imageUrl = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		open = false;
		editor.chain().focus().setImage({ src: imageUrl }).run();
	}

	async function openFileDialog() {
		const files = await openDialog({
			title: 'Select Images',
			multiple: true,
			directory: false,
			filters: [
				{
					name: 'Images',
					extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'raw', 'tga']
				}
			]
		});
		if (!files) return;
		if (ISTAURI) {
			try {
				const uploadedFiles = await editor?.commands.handleFileDrop(files);
				uploadedFiles.forEach(async (file) => {
					const src = convertFileSrc(file);
					editor
						.chain()
						.focus()
						.insertContent([
							{
								type: 'image',
								attrs: { src }
							},
							{
								type: 'paragraph'
							}
						])
						.run();

					// Move the cursor to the empty paragraph after image
					editor.commands.focus('end');
				});
			} catch (e) {
				console.error(e);
				toast.error('Could not process images');
			}
		}
	}
</script>

<NodeViewWrapper
	as="button"
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
			class="bg-popover w-96 p-1"
			portalProps={{ disabled: true, to: undefined }}
		>
			<Tabs.Root value="local">
				<Tabs.List>
					<Tabs.Trigger value="local">Upload</Tabs.Trigger>
					<Tabs.Trigger value="url">Embed Link</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="local" class="py-2">
					<Button class="w-full" onclick={openFileDialog}>Upload an Image</Button>
				</Tabs.Content>
				<Tabs.Content value="url" class="py-2">
					<form onsubmit={handleSubmit} class="flex flex-col gap-2">
						<Input placeholder="Embed Image" bind:value={imageUrl} required type="url" />
						<Button type="submit" variant="secondary">Insert</Button>
					</form>
				</Tabs.Content>
			</Tabs.Root>
		</Popover.Content>
	</Popover.Root>
</NodeViewWrapper>
