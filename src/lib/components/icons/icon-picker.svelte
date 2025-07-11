<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Tabs from '$lib/components/ui/tabs';
	import type { Snippet } from 'svelte';
	import EmojiPicker from './emoji-picker.svelte';
	interface Props {
		open?: boolean;
		icon?: string;
		onSelect?: (icon: string) => void;
		side?: 'left' | 'right' | 'top' | 'bottom' | undefined;
		children?: Snippet<[]>;
	}

	let { open = $bindable(false), icon = $bindable(), onSelect, side, children }: Props = $props();
</script>

<Popover.Root bind:open>
	{#if children}
		<Popover.Trigger>
			{@render children()}
		</Popover.Trigger>
	{/if}
	<Popover.Content class="flex h-fit w-96 flex-col gap-1 p-0" {side}>
		<Tabs.Root value="emojis">
			<Tabs.List>
				<Tabs.Trigger value="emojis">Emoji</Tabs.Trigger>
				<Tabs.Trigger value="icons">Icon</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="icons">
				<h1>Icons</h1>
			</Tabs.Content>
			<Tabs.Content value="emojis">
				<EmojiPicker {onSelect} />
			</Tabs.Content>
		</Tabs.Root>
	</Popover.Content>
</Popover.Root>
