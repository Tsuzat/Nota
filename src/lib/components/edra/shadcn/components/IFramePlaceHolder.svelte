<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';

	const { editor }: NodeViewProps = $props();
	import CodeXml from '@lucide/svelte/icons/code-xml';

	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { NodeViewWrapper } from 'svelte-tiptap';

	let open = $state(false);
	let iframUrl = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		open = false;
		editor.chain().focus().setIframe({ src: iframUrl }).run();
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
	<CodeXml />
	<span>Insert an iframe</span>
	<Popover.Root bind:open>
		<Popover.Trigger class="sr-only absolute left-1/2">Open</Popover.Trigger>
		<Popover.Content
			contenteditable={false}
			class="bg-popover w-96 p-4 transition-all duration-300"
			portalProps={{ disabled: true, to: undefined }}
		>
			<form onsubmit={handleSubmit} class="flex flex-col gap-2">
				<Input placeholder="Embed IFrame" bind:value={iframUrl} required type="url" />
				<Button type="submit" variant="secondary">Insert</Button>
			</form>
		</Popover.Content>
	</Popover.Root>
</NodeViewWrapper>
