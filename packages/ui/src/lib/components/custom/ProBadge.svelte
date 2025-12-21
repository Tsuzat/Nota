<script lang="ts">
import { cn } from '@lib/utils';

const { class: className = '', text }: { class?: string; text?: string } = $props();
</script>

<button
	class={cn(
		'group relative mx-auto flex h-fit max-w-fit flex-row items-center justify-center rounded-xl bg-white/40 px-3 py-0.5 text-sm font-medium shadow-[inset_0_-8px_10px_#8fdfff1f] backdrop-blur-sm transition-shadow duration-500 ease-out [--bg-size:300%] hover:shadow-[inset_0_-5px_10px_#8fdfff3f] dark:bg-black/40',
		className
	)}
>
	<div
		class="animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-linear-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-size-[var(--bg-size)_100%] mask-subtract! p-px [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]"
	></div>

	<span
		class="animate-gradient inline bg-linear-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent"
	>
		{text ?? "Pro"}
	</span>
</button>

<style>
	@keyframes gradient {
		to {
			background-position: 200% center;
		}
	}
	.animate-gradient {
		animation: gradient 5s linear infinite;
	}
</style>
