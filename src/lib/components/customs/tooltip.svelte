<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';

	interface Props {
		text: string;
		key?: string;
		delayDuration?: number;
		children: any;
		side?: 'top' | 'bottom' | 'left' | 'right';
	}
	let { text, key = '', delayDuration = 300, side = 'top', children }: Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root {delayDuration}>
		<Tooltip.Trigger>
			{@render children()}
		</Tooltip.Trigger>
		<Tooltip.Content class="bg-background text-foreground text-sm rounded p-1 border" {side}>
			<span class="font-medium">{text}</span>
			<span class="text-muted-foreground">{key}</span>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
