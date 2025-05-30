<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { Editor } from '@tiptap/core';
	import { ChevronDown } from 'lucide-svelte';

	interface Props {
		editor: Editor;
	}

	let { editor }: Props = $props();

	const FONT_SIZE = [
		{ label: 'Smaller', value: '12px' },
		{ label: 'Small', value: '14px' },
		{ label: 'Medium', value: '' },
		{ label: 'Large', value: '18px' },
		{ label: 'Extra Large', value: '24px' }
	];

	let currentSize = $derived.by(() => editor.getAttributes('textStyle').fontSize || '');

	const currentLabel = $derived.by(() => {
		const l = FONT_SIZE.find((f) => f.value === currentSize);
		if (l) return l.label.split(' ')[0];
		return 'Medium';
	});
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Tooltip.Provider delayDuration={100}>
			<Tooltip.Root>
				<Tooltip.Trigger class={buttonVariants({ variant: 'ghost', class: 'h-8 w-fit p-1 gap-1' })}>
					<span>{currentLabel}</span>
					<ChevronDown class="!size-2 text-muted-foreground" />
				</Tooltip.Trigger>
				<Tooltip.Content
					avoidCollisions
					class="bg-background text-foreground border font-medium p-2"
				>
					<p>Font Size</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-fit h-fit" portalProps={{ disabled: true, to: undefined }}>
		{#each FONT_SIZE as fontSize}
			<DropdownMenu.Item
				onclick={() => {
					editor.chain().focus().setFontSize(fontSize.value).run();
				}}
				style={`font-size: ${fontSize.value}`}>{fontSize.label}</DropdownMenu.Item
			>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
