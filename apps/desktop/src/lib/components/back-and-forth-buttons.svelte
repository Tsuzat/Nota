<script lang="ts">
import { Button } from '@nota/ui/shadcn/button';
import { icons } from '@nota/ui/icons/index.js';
import SimpleTooltip from '@nota/ui/custom/SimpleToolTip.svelte';
import { getKeyboardShortcut } from '$lib/utils';
</script>

<div class="flex items-center">
	<SimpleTooltip>
		<Button variant="ghost" size="icon-sm" onclick={() => history.back()}>
			<icons.ArrowLeft />
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
		<Button variant="ghost" size="icon-sm" onclick={() => history.forward()}>
			<icons.ArrowRight />
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
