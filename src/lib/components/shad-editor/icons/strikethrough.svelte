<script lang="ts">
	import { Strikethrough } from 'lucide-svelte';
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
				class={cn('size-8', editor.isActive('strike') && 'bg-muted')}
				onclick={() => editor.chain().focus().toggleStrike().run()}
			>
				<Strikethrough />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Strike (⌘⇧S)</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
