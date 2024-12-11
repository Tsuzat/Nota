<script lang="ts">
	import { CheckSquare } from 'lucide-svelte';
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
				class={cn('size-8', editor.isActive('taskList') && 'bg-muted')}
				onclick={() => editor.chain().focus().toggleTaskList().run()}
			>
				<CheckSquare />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Tasks List (⌘⇧9)</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
