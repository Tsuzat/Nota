<script lang="ts">
	import { resetMode, setMode, mode, theme } from 'mode-watcher';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Check, MoonStar, Sun } from 'lucide-svelte';
	interface Props {
		variant?: 'link' | 'ghost';
		size?: 'icon' | undefined;
	}

	let { variant = 'ghost', size = undefined }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button {variant} {size} class="m-0 size-8 p-0">
			<Sun class="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<MoonStar class="absolute  rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span class="sr-only">Toggle Theme</span>
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item onclick={() => setMode('light')}>
			<span>Light</span>
			{#if localStorage.getItem('mode-watcher-mode') === 'light'}
				<Check class="absolute right-2 !size-3 text-muted-foreground" />
			{/if}
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => setMode('dark')}>
			<span>Dark</span>
			{#if localStorage.getItem('mode-watcher-mode') === 'dark'}
				<Check class="absolute right-2 !size-3 text-muted-foreground" />
			{/if}
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => resetMode()}>
			<span>System</span>
			{#if localStorage.getItem('mode-watcher-mode') === 'system'}
				<Check class="absolute right-2 !size-3 text-muted-foreground" />
			{/if}
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
