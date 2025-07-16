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
	import { ISTAURI } from '$lib/utils';

	let open = $state(false);
	let audioUrl = $state('');

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
			try {
				const uploadedFiles = await editor?.commands.handleFileDrop([file]);
				uploadedFiles.forEach(async (file) => {
					const src = convertFileSrc(file);
					editor.chain().focus().setAudio(src).run();
				});
				open = false;
			} catch (e) {
				console.error(e);
				toast.error('Could not process audio.');
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
	<Audio />
	<span>Insert an audio</span>
	<Popover.Root bind:open>
		<Popover.Trigger class="sr-only absolute left-1/2">Open</Popover.Trigger>
		<Popover.Content
			contenteditable={false}
			class="bg-popover w-96 p-1 transition-all duration-500"
			portalProps={{ disabled: true, to: undefined }}
		>
			<Tabs.Root value="local">
				<Tabs.List>
					<Tabs.Trigger value="local">Upload</Tabs.Trigger>
					<Tabs.Trigger value="url">Embed Link</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="local" class="py-2">
					<Button class="w-full" onclick={openFileDialog}>Upload an Audio</Button>
				</Tabs.Content>
				<Tabs.Content value="url" class="py-2">
					<form onsubmit={handleSubmit} class="flex flex-col gap-2">
						<Input placeholder="Embed Audio" bind:value={audioUrl} required type="url" />
						<Button type="submit" variant="secondary">Insert</Button>
					</form>
				</Tabs.Content>
			</Tabs.Root>
		</Popover.Content>
	</Popover.Root>
</NodeViewWrapper>
