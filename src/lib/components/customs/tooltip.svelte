<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Content } from '../ui/dropdown-menu';

	interface Props {
		text: string;
		delayDuration?: number;
		children: any;
		side?: 'top' | 'bottom' | 'left' | 'right';
	}
	let { text, delayDuration = 300, side = 'top', children }: Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root {delayDuration}>
		<Tooltip.Trigger>
			{@render children()}
		</Tooltip.Trigger>
		<Tooltip.Content class="bg-background text-foreground text-sm rounded p-1 border" {side}>
			<p>{text}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
