<script lang="ts">
	import type { Editor } from '@tiptap/core';
	// import * as Select from '$lib/components/ui/select';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import commands from '$lib/components/edra/commands/toolbar-commands';
	import { cn } from '$lib/utils';
	import EdraToolTip from '../EdraToolTip.svelte';
	import AlignLeft from '@lucide/svelte/icons/align-left';
	import { buttonVariants } from '$lib/components/ui/button';
	import { ChevronDown } from '@lucide/svelte';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	const alignments = commands['alignment'];

	const isActive = $derived.by(() => {
		return alignments.find((h) => h.isActive?.(editor)) !== undefined;
	});

	const AlignmentIcon = $derived.by(() => {
		const h = alignments.find((h) => h.isActive?.(editor));
		return h ? h.icon : AlignLeft;
	});
</script>

<DropdownMenu.Root>
	<EdraToolTip tooltip="Alignment">
		<DropdownMenu.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'icon',
				class: cn('gap-0 p-0', 'border-0 ring-0 [&_svg]:size-2', isActive && 'bg-muted')
			})}
		>
			<AlignmentIcon class="stroke-primary size-4!" />
			<ChevronDown />
		</DropdownMenu.Trigger>
	</EdraToolTip>
	<DropdownMenu.Content portalProps={{ to: document.getElementById('nota-editor') ?? 'undefined' }}>
		<DropdownMenu.Label>Alignments</DropdownMenu.Label>
		{#each alignments as alignment (alignment)}
			{@const Icon = alignment.icon}
			<DropdownMenu.Item onclick={() => alignment.onClick?.(editor)}>
				<Icon />
				{alignment.tooltip}
				<DropdownMenu.Shortcut>
					{alignment.shortCut}
				</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
