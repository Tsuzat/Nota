<script lang="ts">
	import { Code } from 'lucide-svelte';
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
				size="icon"
				class={cn('size-8', editor.isActive('code') && 'bg-muted')}
				onclick={() => editor.chain().focus().toggleCode().run()}
			>
				<Code />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Code (⌘E)</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
