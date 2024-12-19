<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '../ui/button';
	import Emojipicker from './emojipicker.svelte';

	interface Props {
		onSelect: (icon: string) => void;
		children: any;
	}

	let { onSelect, children }: Props = $props();

	async function search(name: string) {}
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ variant: 'ghost', class: 'size-8 p-2' })}>
		{@render children()}
	</Popover.Trigger>
	<Popover.Content class="size-fit max-w-96 p-0">
		<Emojipicker {onSelect} />
	</Popover.Content>
</Popover.Root>
