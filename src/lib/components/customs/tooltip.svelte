<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Content } from '../ui/dropdown-menu';

	interface Props {
		text: string;
		children: any;
	}
	let { text, children }: Props = $props();
</script>

<Tooltip.Root delayDuration={0}>
	<Tooltip.Trigger>
		{@render children()}
	</Tooltip.Trigger>
	<Tooltip.Content class="bg-background text-foreground text-sm rounded p-1 border">
		<p>{text}</p>
	</Tooltip.Content>
</Tooltip.Root>
