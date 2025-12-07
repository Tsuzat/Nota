<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
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

<DropdownMenu.Root>
	<EdraToolTip tooltip="Headings">
		<DropdownMenu.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'icon',
				class: cn('gap-0 p-0', 'border-0 ring-0 [&_svg]:size-2', isActive && 'bg-muted')
			})}
		>
			<HeadingIcon class="stroke-primary size-4!" />
		</DropdownMenu.Trigger>
	</EdraToolTip>
	<DropdownMenu.Content portalProps={{ to: document.getElementById('nota-editor') ?? 'undefined' }}>
		<DropdownMenu.Item onclick={() => editor.chain().focus().setParagraph().run()}>
			<Paragraph />
			<span>Paragraph</span>
		</DropdownMenu.Item>
		{#each headings as heading (heading)}
			{@const Icon = heading.icon}
			<DropdownMenu.Item onclick={() => heading.onClick?.(editor)}>
				<Icon />
				{heading.tooltip}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
