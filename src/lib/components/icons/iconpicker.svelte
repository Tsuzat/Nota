<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Tabs from '$lib/components/ui/tabs';
	import { buttonVariants } from '../ui/button';
	import Emojipicker from './emojipicker.svelte';
	interface Props {
		onSelect: (icon: string) => void;
		side?: 'bottom' | 'top' | 'left' | 'right';
		children: any;
	}
	let { onSelect, side = 'bottom', children }: Props = $props();
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ variant: 'ghost', class: 'size-8 p-2' })}>
		{@render children()}
	</Popover.Trigger>
	<Popover.Content class="size-fit p-0 shadow-2xl" {side}>
		<Tabs.Root value="emojis" class="w-fit">
			<Tabs.List class="bg-transparent">
				<!-- <Tabs.Trigger value="icons" class="data-[state=active]:underline font-bold"
					>Icons</Tabs.Trigger
				> -->
				<Tabs.Trigger value="emojis" class="data-[state=active]:underline font-bold"
					>Emojis</Tabs.Trigger
				>
			</Tabs.List>
			<!-- <Tabs.Content value="icons">
				<LucideIcons name={'FolderIcon'} {onSelect} />
			</Tabs.Content> -->
			<Tabs.Content value="emojis">
				<Emojipicker {onSelect} />
			</Tabs.Content>
		</Tabs.Root>
	</Popover.Content>
</Popover.Root>
