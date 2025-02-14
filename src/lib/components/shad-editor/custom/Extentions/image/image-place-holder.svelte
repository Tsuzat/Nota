<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import type { NodeViewProps } from '@tiptap/core';
	import { FileImage, Image, Link, Loader, Upload, X } from 'lucide-svelte';
	import { NodeViewWrapper } from 'svelte-tiptap';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Label } from '$lib/components/ui/label';
	import { slide } from 'svelte/transition';
	import { quartIn } from 'svelte/easing';
	import { open as openFile } from '@tauri-apps/plugin-dialog';
	import { pictureDir, resolve } from '@tauri-apps/api/path';
	import { toast } from 'svelte-sonner';
	import { CURRENT_ACTIVE_NOTE, OS, WORKSPACES } from '$lib/contants';
	import { copyFile, readDir } from '@tauri-apps/plugin-fs';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { checkIfImage } from '$lib/components/shad-editor/utils';
	const { node, editor, selected, deleteNode, updateAttributes }: NodeViewProps = $props();

	let open = $state(false);
	let imageUrl: string | undefined = $state(undefined);

	const path = $derived.by(() => {
		const currentNote = $CURRENT_ACTIVE_NOTE;
		if (currentNote === null) return null;
		const workspaceId = currentNote.workspace;
		const workspace = $WORKSPACES.find((workspace) => workspace.id === workspaceId);
		if (workspace === undefined) return null;
		return workspace.path;
	});

	async function handleLocalFile() {
		if (path === null) {
			toast.error('Invalid Note Path');
			return;
		}

		const image = await openFile({
			multiple: false,
			defaultPath: await pictureDir(),
			title: 'Choose an image',
			filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'svg'] }]
		});
		if (image === null) return;
		// Copy the file to the assets folder
		const id = toast.loading('Copying image to assets...');
		const imageName = image.split(`${OS === 'windows' ? '\\' : '/'}`).pop();
		if (imageName === undefined) {
			toast.error('Invalid image path');
			return;
		}

		const assetsPath = await resolve(path, 'assets', imageName);
		await copyFile(image, assetsPath);
		const src = convertFileSrc(assetsPath);
		editor.chain().focus().setImage({ src }).run();
		toast.success('Image copied successfully!', { id });

		handleClose(false);
	}

	function handleClose(opn: boolean) {
		if (!opn) {
			open = false;
			imageUrl = undefined;
		}
	}

	async function assetsFiles(): Promise<string[]> {
		if (path === null) return [];
		const assetsPath = await resolve(path, 'assets');
		const files = await readDir(assetsPath);
		const imagesPath: string[] = [];

		for (const file of files) {
			if (file.isFile && checkIfImage(file.name)) {
				const imgPath = await resolve(assetsPath, file.name);
				imagesPath.push(convertFileSrc(imgPath));
			}
		}
		return imagesPath;
	}
</script>

<NodeViewWrapper class="w-full relative" contenteditable="false">
	<Button variant="ghost" class="w-full h-fit p-0 m-0" onclick={() => (open = true)}>
		<div class="h-fit w-full p-4 bg-muted/50 border rounded flex items-center justify-start gap-2">
			<Image class="size-4" />
			<span>Add An Image</span>
		</div>
	</Button>
	<Popover.Root bind:open onOpenChange={handleClose}>
		<Popover.Trigger class="absolute bottom-0 left-1/2">
			<span class="sr-only">Add An Image</span>
		</Popover.Trigger>
		<Popover.Content class="shadow-lg *:my-2 w-96 p-2">
			<Popover.Close
				class={buttonVariants({
					variant: 'ghost',
					class: 'size-4 p-0 rounded-sm top-0 right-0 m-2 z-50 absolute'
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
									class="pr-8"
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
											open = false;
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
					<span class="text-sm">Drag and Drop Assets Images or click to insert</span>
					{#await assetsFiles()}
						<span class="inline-flex items-center">
							<Loader class="animate-spin mr-2" />
							Loading...
						</span>
					{:then paths}
						<div class="flex flex-col gap-2 p-2">
							{#each paths as path}
								<Button
									variant="outline"
									class="size-fit p-0 m-0"
									onclick={() => {
										editor.chain().focus().setImage({ src: path }).run();
										open = false;
									}}
								>
									{@const fileName = path.split('%5C')}
									<img src={path} alt="Assets" class="w-full h-fit" title={fileName.pop()} />
								</Button>
							{/each}
						</div>
					{/await}
				</Tabs.Content>
			</Tabs.Root>
		</Popover.Content>
	</Popover.Root>
</NodeViewWrapper>
