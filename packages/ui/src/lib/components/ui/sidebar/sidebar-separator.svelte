<script lang="ts">
import type { ComponentProps } from "svelte";
import { Separator } from "#lib/components/ui/separator/index.js";
import { cn } from "#lib/utils.js";

let {
	ref = $bindable(null),
	class: className,
	...restProps
}: ComponentProps<typeof Separator> = $props();
</script>

<Separator
	bind:ref
	data-slot="sidebar-separator"
	data-sidebar="separator"
	class={cn("mx-2 bg-sidebar-border w-auto", className)}
	{...restProps}
/>
