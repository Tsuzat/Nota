<script lang="ts">
	import type { ShouldShowProps } from '../../types.js';
	import { type Editor } from '@tiptap/core';
	import BubbleMenu from '../../components/BubbleMenu.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	interface Props {
		editor: Editor;
		mathPos: number;
		mathLatex: string;
	}

	const { editor, mathPos, mathLatex }: Props = $props();

	let latex = $derived(mathLatex);

	function updateLatex() {
		editor.commands.updateBlockMath({
			latex: latex,
			pos: mathPos
		});
	}
</script>

<BubbleMenu
	{editor}
	pluginKey="math-bubble-menu"
	shouldShow={(props: ShouldShowProps) => {
		if (!props.editor.isEditable) return false;
		if (!props.state) return false;
		return editor.isActive('blockMath');
	}}
	options={{
		strategy: 'fixed'
	}}
	class="bg-popover h-fit w-fit flex-col items-center gap-1 rounded-lg border shadow-lg"
>
	<Textarea
		bind:value={latex}
		oninput={updateLatex}
		placeholder="Enter Math Expression"
		class="h-24 w-56"
	/>
</BubbleMenu>
