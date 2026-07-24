<script lang="ts">
import { icons } from '@nota/ui/icons/index.js';
import * as Label from '@nota/ui/shadcn/label';
import * as Switch from '@nota/ui/shadcn/switch';
import { getGlobalSettings } from '../constants.svelte';

const useSettings = getGlobalSettings();
</script>

<div class="w-full max-w-xl mx-auto space-y-5 pb-8">
	<!-- Page Header -->
	<div class="space-y-0.5">
		<h2 class="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
			<icons.Pen class="size-5 text-primary" />
			<span>Editor Settings</span>
		</h2>
		<span class="text-xs text-muted-foreground leading-snug">Customize your document editing experience and interactive toolbars.</span>
	</div>

	<div class="rounded-xl border border-border/40 divide-y divide-border/30 overflow-hidden bg-muted/10">
		<div class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20">
			<div class="flex items-start gap-3.5">
				<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/50 text-primary shadow-2xs">
					<icons.PanelTop class="size-4" />
				</div>
				<div class="space-y-0.5">
					<Label.Root for="use-toolbar" class="font-medium text-sm text-foreground cursor-pointer">Use Toolbar</Label.Root>
					<p class="text-xs text-muted-foreground mt-0.5 leading-snug">Show a persistent formatting toolbar at the top of the editor canvas.</p>
				</div>
			</div>
			<Switch.Root id="use-toolbar" bind:checked={useSettings.useToolBar} />
		</div>

		<div class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20">
			<div class="flex items-start gap-3.5">
				<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/50 text-primary shadow-2xs">
					<icons.MessageSquareCode class="size-4" />
				</div>
				<div class="space-y-0.5">
					<Label.Root for="use-bubble-menu" class="font-medium text-sm text-foreground cursor-pointer">Use Bubble Menu</Label.Root>
					<p class="text-xs text-muted-foreground mt-0.5 leading-snug">Show a floating contextual formatting menu when selecting text.</p>
				</div>
			</div>
			<Switch.Root id="use-bubble-menu" bind:checked={useSettings.useBubbleMenu} />
		</div>

		<div class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20">
			<div class="flex items-start gap-3.5">
				<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/50 text-primary shadow-2xs">
					<icons.GripVertical class="size-4" />
				</div>
				<div class="space-y-0.5">
					<Label.Root for="use-drag-handle" class="font-medium text-sm text-foreground cursor-pointer">Use Drag Handle</Label.Root>
					<p class="text-xs text-muted-foreground mt-0.5 leading-snug">Show a block drag handle for easy paragraph reordering.</p>
				</div>
			</div>
			<Switch.Root id="use-drag-handle" bind:checked={useSettings.useDragHandle} />
		</div>
	</div>
</div>




