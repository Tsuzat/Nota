<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';

	const { editor }: NodeViewProps = $props();
	import Audio from '@lucide/svelte/icons/audio-lines';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { X } from '@lucide/svelte';
	import { NodeViewWrapper } from 'svelte-tiptap';

	let open = $state(false);
	let audioUrl = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		open = false;
		editor.chain().focus().setAudio(audioUrl).run();
	}
</script>

<NodeViewWrapper
	as="div"
	contenteditable="false"
	class="media-placeholder"
	style="user-select: none;"
	draggable={true}
>
	<Popover.Root>
		<Popover.Trigger
			class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
		>
			<Audio />
			<span>Insert an audio</span>
		</Popover.Trigger>
		<Popover.Content class="bg-popover w-96 p-4" portalProps={{ disabled: true, to: undefined }}>
			<div class="mb-4 flex items-center justify-between">
				<span>Insert an audio</span>
				<Popover.Close class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
					<X />
				</Popover.Close>
			</div>
			<form onsubmit={handleSubmit} class="flex flex-col gap-2">
				<Input placeholder="Enter the audio URL..." bind:value={audioUrl} required type="url" />
				<Button type="submit" variant="secondary">Insert</Button>
			</form>
		</Popover.Content>
	</Popover.Root>
</NodeViewWrapper>
