<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import type { NodeViewProps } from '@tiptap/core';
	import { AudioLines, Check, Link, Loader, Upload, X } from 'lucide-svelte';
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
	import { checkIfAudio } from '$lib/components/shad-editor/utils';
	const { node, editor, selected, deleteNode, updateAttributes }: NodeViewProps = $props();

	let open = $state(false);
	let audioUrl: string | undefined = $state(undefined);

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

		const audio = await openFile({
			multiple: false,
			defaultPath: await pictureDir(),
			title: 'Choose a audio',
			filters: [{ name: 'Audios', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }]
		});
		if (audio === null) return;

		// Copy the file to the assets folder
		const id = toast.loading('Copying audio to assets...');
		const audioName = audio.split(`${OS === 'windows' ? '\\' : '/'}`).pop();
		if (audioName === undefined) {
			toast.error('Invalid audio path');
			return;
		}
		const assetsPath = await resolve(path, 'assets', audioName);
		await copyFile(audio, assetsPath);
		const src = convertFileSrc(assetsPath);
		editor.chain().focus().setAudio(src).run();
		toast.success('Audio copied successfully!', { id });
		handleClose(false);
	}

	function handleClose(opn: boolean) {
		if (!opn) {
			open = false;
			audioUrl = undefined;
		}
	}

	async function assetsFiles(): Promise<string[]> {
		if (path === null) return [];
		const assetsPath = await resolve(path, 'assets');
		const files = await readDir(assetsPath);
		const audiosPath: string[] = [];
		for (const file of files) {
			if (file.isFile && checkIfAudio(file.name)) {
				const audioPath = await resolve(assetsPath, file.name);
				audiosPath.push(convertFileSrc(audioPath));
			}
		}
		console.log(audiosPath);
		return audiosPath;
	}
</script>

<NodeViewWrapper class="w-full relative" contenteditable="false">
	<Button variant="ghost" class="w-full h-fit p-0 m-0" onclick={() => (open = true)}>
		<div class="h-fit w-full p-4 bg-muted/50 border rounded flex items-center justify-start gap-2">
			<AudioLines class="size-4" />
			<span>Add An Audio</span>
		</div>
	</Button>
	<Popover.Root bind:open onOpenChange={handleClose}>
		<Popover.Trigger class="absolute bottom-0 left-1/2">
			<span class="sr-only">Add An Audio</span>
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
						<AudioLines class="size-4 mr-2" />
						<span>Assets</span>
					</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="link" class="w-full">
					<div class="w-full">
						<div class="*:my-2">
							<Label for="audio">Audio Link</Label>
							<div class="relative flex items-center">
								<Input
									bind:value={audioUrl}
									class="pr-6"
									placeholder="Audio URL https://example.com/audio.mp3"
								/>
								<Button
									variant="ghost"
									onclick={() => (audioUrl = undefined)}
									class="size-4 p-0 absolute right-2"
								>
									<X class="size-3" />
								</Button>
							</div>
						</div>
						{#if audioUrl && audioUrl.trim() !== ''}
							<div class="*:my-2 w-full" transition:slide={{ duration: 300, easing: quartIn }}>
								<h3 class="text-xl font-medium">Audio Preview</h3>
								<audio controls src={audioUrl} style="width: 100%;"> </audio>
								<Button
									class="ml-auto"
									onclick={() => {
										if (audioUrl !== undefined) {
											editor.chain().focus().setAudio(audioUrl).run();
											audioUrl = undefined;
											open = false;
										}
									}}>Insert</Button
								>
							</div>
						{/if}
					</div>
				</Tabs.Content>
				<Tabs.Content value="local">
					<span class="font-medium">Select audios from your system</span>
					<Button variant="outline" class="w-full h-12 mt-4" onclick={handleLocalFile}>
						<Upload class="size-4 mr-2" />
						<span>Pick System Files</span>
					</Button>
				</Tabs.Content>
				<Tabs.Content value="assets" class="max-h-80 w-full overflow-auto">
					<span class="text-sm">Click audio to insert</span>
					{#await assetsFiles()}
						<span class="inline-flex items-center">
							<Loader class="animate-spin mr-2" />
							Loading...
						</span>
					{:then paths}
						<div class="flex flex-col w-full gap-2 p-2">
							{#each paths as path}
								{@const fileName = path.split('%5C')}
								<div class="flex items-center justify-between">
									<Button
										variant="ghost"
										title={'Insert Audio' + fileName.pop()}
										class="size-auto w-full p-2"
										onclick={() => {
											editor.chain().focus().setAudio(path).run();
											open = false;
										}}
									>
										<audio controls src={path} style="width: 100%;"> </audio>
									</Button>
								</div>
							{/each}
						</div>
					{/await}
				</Tabs.Content>
			</Tabs.Root>
		</Popover.Content>
	</Popover.Root>
</NodeViewWrapper>
