<script lang="ts">
import Sparkles from '@lucide/svelte/icons/sparkles';
import RefreshCw from '@lucide/svelte/icons/refresh-cw';
import Palette from '@lucide/svelte/icons/palette';
import Plus from '@lucide/svelte/icons/plus';
import RemoveFormatting from '@lucide/svelte/icons/remove-formatting';
import Copy from '@lucide/svelte/icons/copy';
import Clipboard from '@lucide/svelte/icons/clipboard';
import Trash2 from '@lucide/svelte/icons/trash-2';
import GripVertical from '@lucide/svelte/icons/grip-vertical';
import TextAlignCenter from '@lucide/svelte/icons/text-align-center';
import ChevronRight from '@lucide/svelte/icons/chevron-right';
</script>

<div class="relative flex items-start gap-2">
	<div class="hover:bg-accent hover:text-accent-foreground mt-1 size-8 rounded-md p-2">
		<GripVertical class="size-4" />
	</div>
	<div
		class="bg-popover text-popover-foreground animate-in fade-in zoom-in-95 w-full max-w-[16rem] overflow-hidden rounded-lg border shadow-md duration-300"
	>
		<div class="text-muted-foreground px-2 py-1.5 text-sm font-semibold">OrderedList</div>
		<div class="p-1">
			<div
				class="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
			>
				<Sparkles class="size-4" />
				<span
					class="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-bold text-transparent"
				>
					Edit With AI</span
				>
			</div>
			<div
				class="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none select-none"
			>
				<div class="flex w-full items-center gap-2">
					<RefreshCw class="size-4" />
					<span>Turn Into</span>
					<ChevronRight class="text-muted-foreground ml-auto size-3" />
				</div>
			</div>
			<div
				class="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none select-none"
			>
				<div class="flex w-full items-center gap-2">
					<Palette class="size-4" />
					<span>Colors</span>
					<ChevronRight class="text-muted-foreground ml-auto size-3" />
				</div>
			</div>
			<div
				class="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none select-none"
			>
				<div class="flex w-full items-center gap-2">
					<TextAlignCenter class="size-4" />
					<span>Alignments</span>
					<ChevronRight class="text-muted-foreground ml-auto size-3" />
				</div>
			</div>
		</div>
		<div class="bg-border my-1 h-px"></div>
		<div class="p-1">
			<div
				class="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
			>
				<Plus class="size-4" />
				<span>Insert Next</span>
			</div>
			<div
				class="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
			>
				<RemoveFormatting class="size-4" />
				<span>Remove Formatting</span>
			</div>
		</div>
		<div class="bg-border my-1 h-px"></div>
		<div class="p-1">
			<div
				class="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
			>
				<Copy class="size-4" />
				<span>Duplicate</span>
			</div>
			<div
				class="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
			>
				<Clipboard class="size-4" />
				<span>Copy Content</span>
			</div>
		</div>
		<div class="bg-border my-1 h-px"></div>
		<div class="p-1">
			<div
				class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-500 outline-none select-none hover:bg-red-500/10"
			>
				<Trash2 class="size-4" />
				<span>Delete Node</span>
			</div>
		</div>
	</div>
</div>
