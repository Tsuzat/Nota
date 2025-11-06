<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import type { Editor } from '@tiptap/core';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { cn } from '$lib/utils.js';
	import EdraToolTip from '../EdraToolTip.svelte';
	import * as Select from '$lib/components/ui/select';

	interface Props {
		class?: string;
		editor: Editor;
	}
	const { class: className = '', editor }: Props = $props();

	const colors = [
		{ label: 'Default', value: '' },
		{ label: 'Blue', value: '#06328A' },
		{ label: 'Brown', value: '#AD4F07' },
		{ label: 'Green', value: '#027306' },
		{ label: 'Grey', value: '#035699' },
		{ label: 'Orange', value: '#944801' },
		{ label: 'Pink', value: '#910032' },
		{ label: 'Purple', value: '#3E188F' },
		{ label: 'Red', value: '#940909' },
		{ label: 'Yellow', value: '#827305' }
	];

	const currentColor = $derived.by(() => editor.getAttributes('textStyle').color);
	const currentHighlight = $derived.by(() => editor.getAttributes('highlight').color);
</script>

<Select.Root type="multiple">
	<Select.Trigger
		class={buttonVariants({
			variant: 'ghost',
			size: 'icon',
			class: cn('gap-0 border-0 p-0 ring-0 [&_svg]:size-2', className)
		})}
	>
		<EdraToolTip tooltip="Quick Colors">
			<div style={`color: ${currentColor}; background-color: ${currentHighlight}50;`}>
				<span>A</span>
			</div>
		</EdraToolTip>
	</Select.Trigger>
	<Select.Content class="max-h-96">
		<Select.Group>
			<Select.GroupHeading>Text Colors</Select.GroupHeading>
			{#each colors as color (color)}
				<Select.Item
					class={cn(editor.isActive('highlight', { color: color.value }) && 'font-semibold')}
					value={color.value + 'F'}
					onclick={() => {
						if (color.value === '' || color.label === 'Default')
							editor.chain().focus().unsetColor().run();
						else
							editor
								.chain()
								.focus()
								.setColor(currentColor === color.value ? '' : color.value)
								.run();
					}}
				>
					{color.label}
				</Select.Item>
			{/each}
		</Select.Group>
		<Select.Group>
			<Select.GroupHeading>Highlight Colors</Select.GroupHeading>
			{#each colors as color (color)}
				<Select.Item
					class={cn(editor.isActive('highlight', { color: color.value }) && 'font-semibold')}
					value={color.value + 'B'}
					onclick={() => {
						if (color.value === '' || color.label === 'Default')
							editor.chain().focus().unsetHighlight().run();
						else editor.chain().focus().toggleHighlight({ color: color.value }).run();
					}}
				>
					{color.label}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
