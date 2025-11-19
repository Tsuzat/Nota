<script lang="ts">
	import { getGlobalSettings } from '../constants.svelte';
	import * as Switch from '$lib/components/ui/switch';
	import * as Label from '$lib/components/ui/label';

	const useSettings = getGlobalSettings();
</script>

<div class="mx-auto w-fit space-y-6 p-6">
	<div>
		<h3 class="text-lg font-medium">Editor</h3>
		<p class="text-muted-foreground text-sm">Customize the editor experience.</p>
	</div>
	<div class="space-y-4">
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<Label.Root for="use-toolbar">Use Toolbar</Label.Root>
				<p class="text-muted-foreground text-xs">Show a toolbar with formatting options.</p>
			</div>
			<Switch.Root id="use-toolbar" bind:checked={useSettings.useToolBar} />
		</div>
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<Label.Root for="use-bubble-menu">Use Bubble Menu</Label.Root>
				<p class="text-muted-foreground text-xs">Show a floating menu when selecting text.</p>
			</div>
			<Switch.Root id="use-bubble-menu" bind:checked={useSettings.useBubbleMenu} />
		</div>
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<Label.Root for="use-drag-handle">Use Drag Handle</Label.Root>
				<p class="text-muted-foreground text-xs">Show a handle to drag and drop editor blocks.</p>
			</div>
			<Switch.Root id="use-drag-handle" bind:checked={useSettings.useDragHandle} />
		</div>
	</div>
</div>
