<script lang="ts">
import Printer from '@lucide/svelte/icons/printer';
import ToggleMode from '@nota/ui/custom/ToggleMode.svelte';
import { EdraEditor } from '@nota/ui/edra/shadcn/index.ts';
import type { Content } from '@nota/ui/edra/types.js';
import { IconRenderer } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import { Skeleton } from '@nota/ui/shadcn/skeleton';
import { toast } from '@nota/ui/shadcn/sonner';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { logerror } from '$lib/sentry/index.js';

const { data } = $props();
let content = $state<Content>();
let isLoading = $state(false);
let name = $state<string>();
let icon = $state<string>();

$effect(() => {
  if (data.id) loadData(data.id);
});

async function loadData(id: string) {
  isLoading = true;
  try {
    const res = await fetch(`${PUBLIC_BACKEND_URL}/api/db/notes/${id}/preview`);
    if (res.ok) {
      const data = await res.json();
      name = data.name;
      icon = data.icon;
      content = data.content;
      if (name)
        toast.warning('Read Only Mode', {
          description: `Note "${name}" is opened as preview. Changes will not be updated to cloud`,
        });
    }
  } catch (error) {
    logerror('Error when loading note preview', { error });
    toast.error('Something went wrong when loading notes');
    goto(resolve('/'));
  } finally {
    isLoading = false;
  }
}
</script>

<svelte:head>
	<title>{name || 'Preview Note'}</title>
</svelte:head>

{#if content !== undefined && name !== undefined && icon !== undefined}
	<div class="fixed top-2 right-2 ml-auto inline-flex items-center gap-2 print:hidden">
		<ToggleMode />
		<Button variant="ghost" size="icon-sm" onclick={() => window.print()}>
			<Printer />
		</Button>
	</div>
	<header class="mx-auto flex h-12 w-full shrink-0 items-center justify-center gap-2 text-center">
		<div class="flex items-center gap-2">
			<div class={buttonVariants({ variant: 'ghost', size: "icon-sm" })}>
				<IconRenderer icon={icon} />
			</div>
			<span>{name}</span>
		</div>
	</header>
	<EdraEditor class="flex-1 grow flex-col overflow-auto p-8!" editable={false} {content} />
{:else if name === undefined && icon === undefined && content === undefined && isLoading}
	<main class="flex h-screen w-screen flex-col items-center justify-start gap-8 p-8">
		<header class="mx-auto flex h-12 w-full max-w-3xl items-center justify-center gap-2 text-center">
			<div class="flex items-center gap-2">
				<Skeleton class="size-8 rounded-md" />
				<Skeleton class="h-6 w-48 rounded-md" />
			</div>
		</header>
		<div class="mx-auto w-full max-w-4xl space-y-4">
			<Skeleton class="h-6 w-3/4 rounded-md" />
			<Skeleton class="h-4 w-full rounded-md" />
			<Skeleton class="h-4 w-full rounded-md" />
			<Skeleton class="h-4 w-5/6 rounded-md" />
			<Skeleton class="h-100 w-full rounded-lg" />
		</div>
	</main>
{:else if name === undefined && icon === undefined && content === undefined && !isLoading}
	<main class="flex h-screen w-screen flex-col items-center justify-center gap-2">
		<h2>Something Went Wrong</h2>
		<p>Notes might not exist or you may not have permissions for this note.</p>
		<a href={resolve('/')} class="underline">Go to Home</a>
	</main>
{/if}
