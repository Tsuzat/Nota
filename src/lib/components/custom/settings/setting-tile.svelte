<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		children: Snippet<[]>;
	}
	const { title, description, children }: Props = $props();
</script>

<div class="my-8 flex w-full items-center justify-between">
	<div class="flex flex-col">
		<div>{title}</div>
		<div class="text-muted-foreground text-sm">{description}</div>
	</div>
	<div>
		{@render children()}
	</div>
</div>
