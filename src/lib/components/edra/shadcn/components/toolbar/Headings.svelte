<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import * as Select from '$lib/components/ui/select';
	import commands from '../../../commands/toolbar-commands';
	import { cn } from '$lib/utils';
	import EdraToolTip from '../EdraToolTip.svelte';
	import Paragraph from '@lucide/svelte/icons/pilcrow';
	import { buttonVariants } from '$lib/components/ui/button';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	const headings = commands['headings'];

	const isActive = $derived.by(() => {
		return headings.find((h) => h.isActive?.(editor)) !== undefined;
	});

	const HeadingIcon = $derived.by(() => {
		const h = headings.find((h) => h.isActive?.(editor));
		return h ? h.icon : Paragraph;
	});
</script>

<Select.Root type="single">
	<EdraToolTip tooltip="Headings">
		<Select.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'icon',
				class: cn('gap-0 p-0', 'border-0 ring-0 [&_svg]:size-2', isActive && 'bg-muted')
			})}
		>
			<HeadingIcon class="stroke-primary size-4!" />
		</Select.Trigger>
	</EdraToolTip>
	<Select.Content>
		<Select.Item value="paragraph" onclick={() => editor.chain().focus().setParagraph().run()}>
			<Paragraph />
			<span>Paragraph</span>
		</Select.Item>
		{#each headings as heading (heading)}
			{@const Icon = heading.icon}
			<Select.Item value={heading.name} onclick={() => heading.onClick?.(editor)}>
				<Icon />
				{heading.tooltip}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
