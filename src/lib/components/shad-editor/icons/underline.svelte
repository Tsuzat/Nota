<script lang="ts">
	import { Underline } from 'lucide-svelte';
	import { type Editor } from '@tiptap/core';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { OS } from '$lib/contants';

	let { editor }: { editor: Editor } = $props();
</script>

<Tooltip.Provider delayDuration={100}>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Button
				variant="ghost"
				class={cn('size-8', editor.isActive('underline') && 'bg-muted')}
				onclick={() => editor.chain().focus().toggleUnderline().run()}
			>
				<Underline />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content avoidCollisions class="bg-background text-foreground border font-medium p-2">
			<p>
				Underline
				{#if OS === 'macos'}
					(⌘U)
				{:else}
					(Ctrl+U)
				{/if}
			</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
