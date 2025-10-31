<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { EdraEditor } from '$lib/components/edra/shadcn/index.js';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { supabase } from '$lib/supabase';
	import type { CloudNote } from '$lib/supabase/db/cloudnotes.svelte';
	import Loader from '@lucide/svelte/icons/loader';
	import type { Content } from '@tiptap/core';
	import { toast } from 'svelte-sonner';

	let note = $state<CloudNote>();
	let content = $state<Content>();
	let isLoading = $state(false);
	const { data } = $props();

	$effect(() => {
		if (data.id) loadData(data.id);
	});

	async function loadData(id: string) {
		isLoading = true;
		note = undefined;
		try {
			const { data, error } = await supabase.from('notes').select().eq('id', id).single();
			if (error) {
				console.error(error);
				toast.error(error.details);
			} else {
				note = data;
				content = data.content;
				if (note)
					toast.warning('Read Only Mode', {
						description: `Note "${note.name}" is opened as preview. Changes will not be updated to cloud`
					});
			}
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong when loading notes');
			goto(resolve('/'));
		} finally {
			isLoading = false;
		}
	}
</script>

{#if note !== undefined}
	<header class="mx-auto flex h-12 w-full shrink-0 items-center justify-center gap-2 text-center">
		<div class="flex items-center gap-2">
			<div class={buttonVariants({ variant: 'ghost', class: 'size-7! p-1' })}>
				<IconRenderer icon={note.icon} class="size-8" />
			</div>
			<h2>{note.name}</h2>
		</div>
	</header>
	<EdraEditor class="flex-1 grow flex-col overflow-auto p-8!" editable={false} {content} />
{:else if note === undefined && isLoading}
	<main class="flex h-screen w-screen flex-col items-center justify-center">
		<div class="flex items-center gap-2">
			<Loader class="text-primary animate-spin" />
			<span>Loading Notes</span>
		</div>
	</main>
{:else if note === undefined && !isLoading}
	<main class="flex h-screen w-screen flex-col items-center justify-center gap-2">
		<h2>Something Went Wrong</h2>
		<p>Notes might not exist or you may not have permissions for this note.</p>
		<a href={resolve('/')} class="underline">Go to Home</a>
	</main>
{/if}
