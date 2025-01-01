<script lang="ts">
	import { ChevronDown, Image, X } from 'lucide-svelte';
	import { type Editor } from '@tiptap/core';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { Input } from '$lib/components/ui/input';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { pictureDir } from '@tauri-apps/api/path';
	import { open } from '@tauri-apps/plugin-dialog';

	let { editor }: { editor: Editor } = $props();

	async function handleLocalFile() {
		const image = await open({
			multiple: false,
			defaultPath: await pictureDir(),
			title: 'Choose an image',
			filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'svg'] }]
		});
		if (image === null) return;
		const src = convertFileSrc(image);
		editor.chain().focus().setImage({ src }).run();
	}
</script>

<Tooltip.Provider delayDuration={100}>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Popover.Root>
				<Popover.Trigger>
					<Button
						variant="ghost"
						class={cn('h-8 w-fit px-2', editor.isActive('image') && 'bg-muted')}
					>
						<Image />
						<ChevronDown class="size-3 text-muted-foreground" />
					</Button>
				</Popover.Trigger>
				<Popover.Content class="bg-popover shadow-lg *:my-2">
					<div class="flex items-center justify-between">
						<h1 class="text-xl font-bold">Image</h1>
						<Popover.Close>
							<X class="size-4 text-muted-foreground" />
						</Popover.Close>
					</div>
					<p>Insert image url</p>
					<Input
						placeholder="Enter image url..."
						type="url"
						onchange={(e) => {
							if (e !== null && e.target !== null) {
								//@ts-ignore
								editor.chain().focus().setImage({ src: e.target.value }).run();
							}
						}}
						class="w-full"
					/>
					<p class="font-bold">OR</p>
					<p>Pick an Image</p>
					<Button variant="ghost" class="h-fit w-full bg-muted/50 p-0" onclick={handleLocalFile}>
						<div class="flex w-full items-center justify-start p-4">
							<span>Choose from your device</span>
						</div>
					</Button>
				</Popover.Content>
			</Popover.Root>
		</Tooltip.Trigger>
		<Tooltip.Content avoidCollisions class="bg-background text-foreground border font-medium p-2">
			<p>Add Image</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
