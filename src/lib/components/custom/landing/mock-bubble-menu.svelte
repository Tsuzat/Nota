<script lang="ts">
	import Bold from '@lucide/svelte/icons/bold';
	import Italic from '@lucide/svelte/icons/italic';
	import Underline from '@lucide/svelte/icons/underline';
	import Strikethrough from '@lucide/svelte/icons/strikethrough';
	import Code from '@lucide/svelte/icons/code';
	import Link from '@lucide/svelte/icons/link';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
</script>

<div
	class="bg-popover text-popover-foreground animate-in fade-in zoom-in-95 flex items-center gap-1 rounded-lg border p-1 shadow-md duration-300"
>
	<button
		class="hover:bg-accent hover:text-accent-foreground flex items-center gap-1 rounded-md p-2 text-sm font-medium text-purple-500"
	>
		<span
			class="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-bold text-transparent"
		>
			Ask AI</span
		>
	</button>
	<div class="bg-border mx-1 h-4 w-px"></div>
	<button
		class="hover:bg-accent hover:text-accent-foreground flex items-center gap-1 rounded-md p-2 text-sm"
	>
		<span>H</span>
		<ChevronDown class="size-3" />
	</button>
	<div class="bg-border mx-1 h-4 w-px"></div>
	<button class="hover:bg-accent hover:text-accent-foreground rounded-md p-2">
		<Link class="size-4" />
	</button>
	<button class="hover:bg-accent hover:text-accent-foreground rounded-md p-2">
		<Bold class="size-4" />
	</button>
	<button class="hover:bg-accent hover:text-accent-foreground rounded-md p-2">
		<Italic class="size-4" />
	</button>
	<button class="hover:bg-accent hover:text-accent-foreground rounded-md p-2">
		<Underline class="size-4" />
	</button>
	<button class="hover:bg-accent hover:text-accent-foreground rounded-md p-2">
		<Strikethrough class="size-4" />
	</button>
	<button class="hover:bg-accent hover:text-accent-foreground rounded-md p-2">
		<Code class="size-4" />
	</button>
</div>
