<script lang="ts">
	import { Italic } from 'lucide-svelte';
	import { type Editor } from '@tiptap/core';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let { editor }: { editor: Editor } = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Button
				variant="ghost"
				class={cn('size-8', editor.isActive('italic') && 'bg-muted')}
				onclick={() => editor.chain().focus().toggleItalic().run()}
			>
				<Italic />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Italic (⌘I)</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
