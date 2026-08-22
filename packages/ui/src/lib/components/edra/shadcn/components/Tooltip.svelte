<script lang="ts">
import type { Snippet } from "svelte";
import * as Tooltip from "#lib/components/ui/tooltip/index.js";

interface Props {
	tooltip: string;
	children: Snippet<[]>;
	shortCut?: string;
}

const { tooltip, children, shortCut }: Props = $props();
</script>

<Tooltip.Provider delayDuration={100}>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{@render children()}
		</Tooltip.Trigger>
		<Tooltip.Content>
			<span>{tooltip}</span>
			{#if shortCut}
				<span class="rounded bg-background p-0.5 text-primary">{shortCut}</span>
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
