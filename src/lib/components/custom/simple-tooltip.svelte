<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { Snippet } from 'svelte';

	interface Props {
		content?: string;
		children: Snippet<[]>;
		child?: Snippet<[]>;
	}

	const { content, children, child }: Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{@render children()}
		</Tooltip.Trigger>
		<Tooltip.Content>
			{#if content}
				<p>{content}</p>
			{/if}
			{@render child?.()}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
