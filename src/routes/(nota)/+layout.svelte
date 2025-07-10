<script lang="ts">
	import AppSidebar from '$lib/components/custom/side-bar/app-sidebar.svelte';
	import NavActions from '$lib/components/custom/side-bar/nav-actions.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	const { children } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset class="flex h-screen w-full flex-col overflow-hidden">
		<header class="flex h-14 shrink-0 items-center gap-2">
			<div class="flex flex-1 items-center gap-2 px-3">
				<Sidebar.Trigger />
				<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
				<h3>My Notes</h3>
			</div>
			<div class="ml-auto px-3">
				<NavActions />
			</div>
		</header>
		<div class="flex h-[calc(100vh-4rem)] flex-1 flex-grow flex-col overflow-auto">
			<div class="mx-auto h-full w-full max-w-3xl">
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
