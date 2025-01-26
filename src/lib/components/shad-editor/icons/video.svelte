<script lang="ts">
	import { ChevronDown, FileImage, FileVideo, Link, Loader, Upload, Video, X } from 'lucide-svelte';
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
	import { checkIfImage, checkIfVideo } from '../utils';

	let { editor, path }: { editor: Editor; path: string } = $props();

	let videoUrl: string | undefined = $state(undefined);
	let open_ = $state(false);

	async function handleLocalFile() {
		const video = await open({
			multiple: false,
			defaultPath: await pictureDir(),
			title: 'Choose a video',
			filters: [{ name: 'video', extensions: ['mp4', 'webm', 'ogg', 'mkv'] }]
		});
		if (video === null) return;
		// Copy the file to the assets folder
		const id = toast.loading('Copying image to assets...');
		const videoName = video.split(`${OS === 'windows' ? '\\' : '/'}`).pop();
		const assetsPath = await resolve(
			path +
				`${OS === 'windows' ? '\\' : '/'}assets` +
				`${OS === 'windows' ? '\\' : '/'}${videoName}`
		);
		await copyFile(video, assetsPath);
		const src = convertFileSrc(assetsPath);
		editor.chain().focus().setVideo(src).run();
		toast.success('Video copied successfully!', { id });
		handleClose(false);
	}

	function handleClose(open: boolean) {
		if (!open) {
			open_ = false;
			videoUrl = undefined;
		}
	}

	async function assetsFiles(): Promise<string[]> {
		const assetsPath = await resolve(path + `${OS === 'windows' ? '\\' : '/'}assets`);
		const files = await readDir(assetsPath);
		const videosPath: string[] = [];
		for (const file of files) {
			if (file.isFile && checkIfVideo(file.name)) {
				const vidPath = await resolve(assetsPath + `${OS === 'windows' ? '\\' : '/'}${file.name}`);
				videosPath.push(convertFileSrc(vidPath));
			}
		}
		return videosPath;
	}
</script>

<Tooltip.Provider delayDuration={100}>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Popover.Root bind:open={open_} onOpenChange={handleClose}>
				<Popover.Trigger>
					<Button
						variant="ghost"
						class={cn('h-8 w-fit px-2', editor.isActive('video') && 'bg-muted')}
					>
						<Video />
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
								<FileVideo class="size-4 mr-2" />
								<span>Assets</span>
							</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="link">
							<div>
								<div class="*:my-2">
									<Label for="image">Video Link</Label>
									<div class="relative flex items-center">
										<Input
											bind:value={videoUrl}
											placeholder="Video URL https://example.com/video.mp4"
										/>
										<Button
											variant="ghost"
											onclick={() => (videoUrl = undefined)}
											class="size-4 p-0 absolute right-2"
										>
											<X class="size-3" />
										</Button>
									</div>
								</div>
								{#if videoUrl && videoUrl.trim() !== ''}
									<div class="*:my-2" transition:slide={{ duration: 300, easing: quartIn }}>
										<h3 class="text-xl font-medium">Video Preview</h3>
										<video src={videoUrl} class="size-full rounded">
											<track kind="captions" />
										</video>
										<Button
											class="ml-auto"
											onclick={() => {
												if (videoUrl !== undefined) {
													editor.chain().focus().setVideo(videoUrl).run();
													videoUrl = undefined;
													open_ = false;
												}
											}}>Insert</Button
										>
									</div>
								{/if}
							</div>
						</Tabs.Content>
						<Tabs.Content value="local">
							<span class="font-medium">Select Video from your system</span>
							<Button variant="outline" class="w-full h-12 mt-4" onclick={handleLocalFile}>
								<Upload class="size-4 mr-2" />
								<span>Pick System Files</span>
							</Button>
						</Tabs.Content>
						<Tabs.Content value="assets" class="max-h-80 overflow-auto">
							<span class="text-sm">Drag and Drop Assets Video</span>
							{#await assetsFiles()}
								<span class="inline-flex items-center">
									<Loader class="animate-spin mr-2" />
									Loading...
								</span>
							{:then paths}
								<div class="flex flex-col gap-2 p-2">
									{#each paths as path}
										{@const fileName = path.split('%5C')}
										<video src={path} controls autoplay class="w-full h-fit" title={fileName.pop()}>
											<track kind="captions" />
										</video>
									{/each}
								</div>
							{/await}
						</Tabs.Content>
					</Tabs.Root>
				</Popover.Content>
			</Popover.Root>
		</Tooltip.Trigger>
		<Tooltip.Content avoidCollisions class="bg-background text-foreground border font-medium p-2">
			<p>Add Video</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
