<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Editor } from '@tiptap/core';
	import { cn } from '$lib/utils.js';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { buttonVariants } from '$lib/components/ui/button';

	interface Props {
		class?: string;
		editor: Editor;
	}

	const { class: className = '', editor }: Props = $props();

	const FONT_SIZE = [
		{ label: 'Tiny', value: '0.7rem' },
		{ label: 'Smaller', value: '0.75rem' },
		{ label: 'Small', value: '0.9rem' },
		{ label: 'Default', value: '' },
		{ label: 'Large', value: '1.25rem' },
		{ label: 'Extra Large', value: '1.5rem' }
	];

	let currentSize = $derived.by(() => editor.getAttributes('textStyle').fontSize || '');

	const currentLabel = $derived.by(() => {
		const l = FONT_SIZE.find((f) => f.value === currentSize);
		if (l) return l.label.split(' ')[0];
		return 'Medium';
	});
</script>

<Select.Root type="single">
	<EdraToolTip tooltip="Font Size">
		<Select.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'sm',
				class: cn(
					'gap-0 p-0',
					'text-primary! border-0 bg-transparent! ring-0 [&_svg]:size-2',
					className
				)
			})}
		>
			<span>{currentLabel}</span>
		</Select.Trigger>
	</EdraToolTip>
	<Select.Content class="h-fit w-fit">
		{#each FONT_SIZE as fontSize (fontSize)}
			<Select.Item
				class="w-fit"
				value={fontSize.label}
				onclick={() => {
					editor.chain().focus().setFontSize(fontSize.value).run();
				}}
				style={`font-size: ${fontSize.value}`}>{fontSize.label}</Select.Item
			>
		{/each}
	</Select.Content>
</Select.Root>
