<script lang="ts">
	import { Check, Link } from 'lucide-svelte';
	import { ChevronDown } from 'lucide-svelte';
	import { X } from 'lucide-svelte';
	import { type Editor } from '@tiptap/core';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, validateURL } from '$lib/utils.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let { editor }: { editor: Editor } = $props();

	let link = $state(editor.getAttributes('link').href);

	let isLinkValid = $state(true);

	function setLink() {
		if (link.trim() === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange('link').setLink({ href: link }).run();
	}

	$effect(() => {
		isLinkValid = validateURL(link);
	});
</script>

<Popover.Root>
	<Popover.Trigger>
		<Tooltip.Provider delayDuration={100}>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant="ghost"
						size="sm"
						class={cn('h-8 w-fit gap-1 p-1', editor.isActive('link') && 'bg-muted')}
					>
						<Link />
						<ChevronDown class="!size-2 text-muted-foreground" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content
					avoidCollisions
					class="bg-background text-foreground border font-medium p-2"
				>
					<p>Add or Remove Link</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</Popover.Trigger>
	<Popover.Content
		class="bg-popover shadow-lg w-80 h-fit flex items-center gap-2 p-2 relative"
		portalProps={{ disabled: true, to: undefined }}
		side="right"
	>
		<Input
			placeholder="Enter link to attach.."
			value={editor.getAttributes('link').href}
			type="url"
			class={cn(isLinkValid && 'border-green-500', !isLinkValid && 'border-red-500')}
			oninput={(e) => {
				//@ts-ignore
				link = e.target.value;
			}}
		/>
		<Button variant="ghost" class="size-8" onclick={setLink} title="Insert Link">
			<Check />
		</Button>
		<Button
			variant="ghost"
			class="size-8"
			onclick={() => {
				editor.chain().focus().extendMarkRange('link').unsetLink().run();
			}}
			title="Remove Link"
		>
			<X />
		</Button>
	</Popover.Content>
</Popover.Root>
