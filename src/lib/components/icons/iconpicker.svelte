<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
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
	<Popover.Content class="size-fit max-w-96 p-0" {side}>
		<Emojipicker {onSelect} />
	</Popover.Content>
</Popover.Root>
