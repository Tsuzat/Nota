<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { slide } from 'svelte/transition';
	import commands from '../commands/toolbar-commands.js';
	import type { EdraToolbarProps } from '../types.js';
	import Alignment from './components/toolbar/Alignment.svelte';
	import FontSize from './components/toolbar/FontSize.svelte';
	import Headings from './components/toolbar/Headings.svelte';
	import QuickColors from './components/toolbar/QuickColors.svelte';
	import SearchAndReplace from './components/toolbar/SearchAndReplace.svelte';
	import ToolBarIcon from './components/ToolBarIcon.svelte';
	import Link from './components/toolbar/Link.svelte';

	const { editor, class: className, excludedCommands, children }: EdraToolbarProps = $props();

	const toolbarCommands = Object.keys(commands).filter((key) => !excludedCommands?.includes(key));
</script>

<div
	class={cn('edra-toolbar bg-muted/25 mx-auto flex items-center rounded-lg', className)}
	transition:slide
>
	{#if children}
		{@render children()}
	{:else}
		{#each toolbarCommands as cmd (cmd)}
			{#if cmd === 'headings'}
				<Headings {editor} />
			{:else if cmd === 'alignment'}
				<Alignment {editor} />
			{:else if ['lists', 'media', 'table'].includes(cmd)}
				<span></span>
			{:else}
				{@const commandGroup = commands[cmd]}
				{#each commandGroup as command (command)}
					{#if command.name === 'link'}
						<Link {editor} />
					{:else}
						<ToolBarIcon {editor} {command} />
					{/if}
				{/each}
			{/if}
		{/each}
		<FontSize {editor} />
		<QuickColors {editor} />
	{/if}
</div>
