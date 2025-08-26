<script lang="ts">
	import BackAndForthButtons from '$lib/components/custom/back-and-forth-buttons.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { cn, ISMACOS, ISTAURI } from '$lib/utils';

	const { data } = $props();
	const sidebar = useSidebar();
</script>

<header class="flex h-12 shrink-0 items-center gap-2">
	<div
		class={cn(
			'z-20 ml-18 flex items-center gap-2 px-3',
			ISMACOS && !sidebar.open && 'ml-18',
			ISMACOS && ISTAURI && sidebar.open && 'md:ml-0'
		)}
	>
		<SidebarTrigger />
		<BackAndForthButtons />
		<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
	</div>
</header>

<div class="flex h-[calc(100vh-3rem)] flex-1 flex-grow flex-col overflow-auto">
	<h3>{data.id}</h3>
</div>
