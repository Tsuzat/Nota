<script lang="ts">
	import { type Editor } from '@tiptap/core';
	import { onMount } from 'svelte';
	import { DragHandlePlugin } from '@tiptap-pro/extension-drag-handle';
	import Button from '../ui/button/button.svelte';
	import { GripVertical, Plus } from 'lucide-svelte';

	interface Props {
		editor: Editor;
	}

	let { editor }: Props = $props();

	const pluginKey = 'SvelteTiptapDragHandle';

	let element: HTMLElement;

	onMount(() => {
		const plugin = DragHandlePlugin({
			pluginKey,
			editor,
			element,
			tippyOptions: {
				zIndex: 0
			}
		});
		editor.registerPlugin(plugin);
		return () => editor.unregisterPlugin(pluginKey);
	});
</script>

<div bind:this={element} class="flex gap-1 overflow-hidden p-1">
	<!-- <Button variant="ghost" class="size-6 p-1">
		<Plus />
	</Button> -->
	<Button variant="link" class="size-6 p-1 cursor-grab">
		<GripVertical />
	</Button>
</div>
