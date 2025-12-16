<script lang="ts">
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import { getKeyboardShortcut } from '$lib/utils';
</script>

<div class="flex items-center">
	<SimpleToolTip>
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
	</SimpleToolTip>
	<SimpleToolTip>
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
	</SimpleToolTip>
</div>
