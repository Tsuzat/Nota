<script lang="ts">
	import AppSidebar from '$lib/components/customs/sidebar/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	let { children } = $props();
</script>

<Sidebar.Provider class="max-h-screen max-w-screen overflow-hidden overflow-x-scroll">
	<AppSidebar />
	<Sidebar.Inset>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
