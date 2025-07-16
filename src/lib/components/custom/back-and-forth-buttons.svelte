<script lang="ts">
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import SimpleTooltip from './simple-tooltip.svelte';
	import { getKeyboardShortcut } from '$lib/utils';
</script>

<div class="flex items-center">
	<SimpleTooltip>
		<Button variant="ghost" class="size-7" onclick={() => history.back()}>
			<ArrowLeft />
		</Button>
		{#snippet child()}
			<span
				>Go Back
				<span class="bg-background text-primary rounded p-0.5">
					{getKeyboardShortcut('←', true)}
				</span>
			</span>
		{/snippet}
	</SimpleTooltip>
	<SimpleTooltip>
		<Button variant="ghost" class="size-7" onclick={() => history.forward()}>
			<ArrowRight />
		</Button>
		{#snippet child()}
			<span
				>Go Next
				<span class="bg-background text-primary rounded p-0.5">
					{getKeyboardShortcut('→', true)}
				</span>
			</span>
		{/snippet}
	</SimpleTooltip>
</div>
