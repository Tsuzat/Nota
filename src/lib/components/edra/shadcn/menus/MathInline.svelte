<script lang="ts">
	import type { ShouldShowProps } from '../../types';
	import { type Editor } from '@tiptap/core';
	import BubbleMenu from '../../components/BubbleMenu.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import CornerDownLeft from '@lucide/svelte/icons/corner-down-left';

	interface Props {
		editor: Editor;
		mathPos: number;
		mathLatex: string;
		parentElement?: HTMLElement;
	}
	const { editor, mathPos, mathLatex, parentElement }: Props = $props();

	let latex = $derived(mathLatex);

	function updateLatex() {
		editor.chain().setNodeSelection(mathPos).updateInlineMath({ latex }).focus().run();
	}
</script>

<BubbleMenu
	{editor}
	pluginKey="math-bubble-menu"
	shouldShow={(props: ShouldShowProps) => {
		if (!props.editor.isEditable) return false;
		if (!props.state) return false;
		return editor.isActive('inlineMath');
	}}
	options={{
		shift: {
			crossAxis: true
		},
		autoPlacement: {
			allowedPlacements: ['top', 'bottom']
		},
		strategy: 'fixed',
		scrollTarget: parentElement
	}}
	class="bg-popover flex h-fit w-fit items-center gap-1 rounded-lg border shadow-lg"
>
	<Input
		bind:value={latex}
		onchange={updateLatex}
		placeholder="Enter Math Expression"
		class="w-56"
	/>
	<Button variant="default" size="icon-sm" onclick={updateLatex}>
		<CornerDownLeft />
	</Button>
</BubbleMenu>
