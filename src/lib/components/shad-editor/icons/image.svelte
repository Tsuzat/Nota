<script lang="ts">
	import { ChevronDown, FileImage, Image, Link, Loader, Upload, X } from 'lucide-svelte';
	import { type Editor } from '@tiptap/core';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { Input } from '$lib/components/ui/input';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { pictureDir, resolve } from '@tauri-apps/api/path';
	import { open } from '@tauri-apps/plugin-dialog';
	import { Label } from '$lib/components/ui/label';
	import { slide } from 'svelte/transition';
	import { quartIn } from 'svelte/easing';
	import { OS } from '$lib/contants';
	import { copyFile, readDir } from '@tauri-apps/plugin-fs';
	import { toast } from 'svelte-sonner';
	import { checkIfImage } from '../utils';

	let { editor, path }: { editor: Editor; path: string } = $props();

	let imageUrl: string | undefined = $state(undefined);
	let open_ = $state(false);

	async function handleLocalFile() {
		const image = await open({
			multiple: false,
			defaultPath: await pictureDir(),
			title: 'Choose an image',
			filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'svg'] }]
		});
		if (image === null) return;
		// Copy the file to the assets folder
		const id = toast.loading('Copying image to assets...');
		const imageName = image.split(`${OS === 'windows' ? '\\' : '/'}`).pop();
		const assetsPath = await resolve(
			path +
				`${OS === 'windows' ? '\\' : '/'}assets` +
				`${OS === 'windows' ? '\\' : '/'}${imageName}`
		);
		await copyFile(image, assetsPath);
		const src = convertFileSrc(assetsPath);
		editor.chain().focus().setImage({ src }).run();
		toast.success('Image copied successfully!', { id });
		handleClose(false);
	}

	function handleClose(open: boolean) {
		if (!open) {
			open_ = false;
			imageUrl = undefined;
		}
	}

	async function assetsFiles(): Promise<string[]> {
		const assetsPath = await resolve(path + `${OS === 'windows' ? '\\' : '/'}assets`);
		const files = await readDir(assetsPath);
		const imagesPath: string[] = [];
		for (const file of files) {
			if (file.isFile && checkIfImage(file.name)) {
				const imgPath = await resolve(assetsPath + `${OS === 'windows' ? '\\' : '/'}${file.name}`);
				imagesPath.push(convertFileSrc(imgPath));
			}
		}
		return imagesPath;
	}
</script>

<Tooltip.Provider delayDuration={100}>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Popover.Root bind:open={open_} onOpenChange={handleClose}>
				<Popover.Trigger>
					<Button
						variant="ghost"
						class={cn('h-8 w-fit px-2', editor.isActive('image') && 'bg-muted')}
					>
						<Image />
						<ChevronDown class="size-3 text-muted-foreground" />
					</Button>
				</Popover.Trigger>
				<Popover.Content class="bg-popover shadow-lg *:my-2 w-96 p-2">
					<Popover.Close
						class={buttonVariants({
							variant: 'ghost',
							class: 'size-4 p-0 rounded-sm fixed top-0 right-0 m-2 z-50'
						})}
					>
						<X class="size-4" />
					</Popover.Close>
					<Tabs.Root value="link" class="">
						<Tabs.List>
							<Tabs.Trigger value="link">
								<Link class="size-4 mr-2" />
								<span>Url</span>
							</Tabs.Trigger>
							<Tabs.Trigger value="local">
								<Upload class="size-4 mr-2" />
								<span>System</span>
							</Tabs.Trigger>
							<Tabs.Trigger value="assets">
								<FileImage class="size-4 mr-2" />
								<span>Assets</span>
							</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="link">
							<div>
								<div class="*:my-2">
									<Label for="image">Image Link</Label>
									<div class="relative flex items-center">
										<Input
											bind:value={imageUrl}
											placeholder="Image URL https://example.com/image.jpg"
										/>
										<Button
											variant="ghost"
											onclick={() => (imageUrl = undefined)}
											class="size-4 p-0 absolute right-2"
										>
											<X class="size-3" />
										</Button>
									</div>
								</div>
								{#if imageUrl && imageUrl.trim() !== ''}
									<div class="*:my-2" transition:slide={{ duration: 300, easing: quartIn }}>
										<h3 class="text-xl font-medium">Image Preview</h3>
										<img src={imageUrl} alt="Preview" class="size-full rounded" />
										<Button
											class="ml-auto"
											onclick={() => {
												if (imageUrl !== undefined) {
													editor.chain().focus().setImage({ src: imageUrl }).run();
													imageUrl = undefined;
													open_ = false;
												}
											}}>Insert</Button
										>
									</div>
								{/if}
							</div>
						</Tabs.Content>
						<Tabs.Content value="local">
							<span class="font-medium">Select images from your system</span>
							<Button variant="outline" class="w-full h-12 mt-4" onclick={handleLocalFile}>
								<Upload class="size-4 mr-2" />
								<span>Pick System Files</span>
							</Button>
						</Tabs.Content>
						<Tabs.Content value="assets" class="max-h-80 overflow-auto">
							<span class="text-sm">Drag and Drop Assets Images</span>
							{#await assetsFiles()}
								<span class="inline-flex items-center">
									<Loader class="animate-spin mr-2" />
									Loading...
								</span>
							{:then paths}
								<div class="flex flex-col gap-2 p-2">
									{#each paths as path}
										{@const fileName = path.split('%5C')}
										<img src={path} alt="Assets" class="w-full h-fit" title={fileName.pop()} />
									{/each}
								</div>
							{/await}
						</Tabs.Content>
					</Tabs.Root>
				</Popover.Content>
			</Popover.Root>
		</Tooltip.Trigger>
		<Tooltip.Content avoidCollisions class="bg-background text-foreground border font-medium p-2">
			<p>Add Image</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
