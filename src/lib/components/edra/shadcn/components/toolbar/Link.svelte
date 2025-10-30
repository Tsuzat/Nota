<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import type { Editor } from '@tiptap/core';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import Link from '@lucide/svelte/icons/link';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Check from '@lucide/svelte/icons/check';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';

	interface Props {
		editor: Editor;
		open?: boolean;
	}

	let { editor, open = $bindable(false) }: Props = $props();

	let value = $state<string>();

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (value === undefined || value.trim() === '') return;
		editor.chain().focus().setLink({ href: value }).run();
		value = undefined;
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{@const isActive = editor.isActive('link')}
		<EdraToolTip tooltip="Link">
			<div
				class={buttonVariants({
					variant: 'ghost',
					size: 'icon',
					class: cn('gap-0')
				})}
				class:bg-muted={isActive}
			>
				<Link />
				<ChevronDown class="text-muted-foreground !size-2" />
			</div>
		</EdraToolTip>
	</Popover.Trigger>
	<Popover.Content portalProps={{ to: undefined, disabled: true }} class="h-fit w-80 p-1">
		<form class="flex items-center gap-2" onsubmit={handleSubmit}>
			<Input placeholder="Type or paste a link" bind:value required type="url" />
			<SimpleTooltip content="Insert link">
				<Button type="submit" size="icon">
					<Check />
				</Button>
			</SimpleTooltip>
		</form>
	</Popover.Content>
</Popover.Root>
