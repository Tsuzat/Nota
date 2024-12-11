<script lang="ts">
	import { Subscript } from 'lucide-svelte';
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
				class={cn('size-8', editor.isActive('subscript') && 'bg-muted')}
				onclick={() => editor.chain().focus().toggleSubscript().run()}
			>
				<Subscript />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Subscript (⌘,)</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
