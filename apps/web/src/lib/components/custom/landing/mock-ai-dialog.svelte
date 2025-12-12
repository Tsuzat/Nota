<script lang="ts">
import ArrowUp from '@lucide/svelte/icons/arrow-up';
import AlignLeft from '@lucide/svelte/icons/align-left';
import AlignRight from '@lucide/svelte/icons/align-right';
import RefreshCw from '@lucide/svelte/icons/refresh-cw';
import PenLine from '@lucide/svelte/icons/pen-line';
import Check from '@lucide/svelte/icons/check';
</script>

<div
	class="bg-popover text-popover-foreground animate-in fade-in zoom-in-95 w-full max-w-xs overflow-hidden rounded-xl border shadow-2xl duration-300"
>
	<div class="flex items-center gap-2 border-b p-3">
		<input
			class="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
			placeholder="Ask AI anything..."
		/>
		<button class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1">
			<ArrowUp class="size-4" />
		</button>
	</div>
	<div class="p-2">
		<div class="text-muted-foreground px-2 py-1.5 text-xs font-semibold">Quick Actions</div>
		<div
			class="hover:bg-accent hover:text-accent-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
		>
			<AlignLeft class="size-4" />
			<span>Make Shorter</span>
		</div>
		<div
			class="hover:bg-accent hover:text-accent-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
		>
			<AlignRight class="size-4" />
			<span>Make Longer</span>
		</div>
		<div
			class="hover:bg-accent hover:text-accent-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
		>
			<RefreshCw class="size-4" />
			<span>Summarize</span>
		</div>
		<div
			class="hover:bg-accent hover:text-accent-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
		>
			<PenLine class="size-4" />
			<span>Continue Writing</span>
		</div>
		<div
			class="hover:bg-accent hover:text-accent-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
		>
			<Check class="size-4" />
			<span>Fix Grammar</span>
		</div>
	</div>
</div>
