<script lang="ts">
import Loader from '@lucide/svelte/icons/loader';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Select from '@nota/ui/shadcn/select';

import { onMount } from 'svelte';
import { type Artifact, getArtifacts } from './artifacts';
import Mac from './icons/mac.svelte';

let artifacts = $state<Artifact[]>([]);
let isLoading = $state(true);

let current = $derived.by(() => {
  return artifacts.find((artifact) => artifact.isCurrent);
});

onMount(async () => {
  artifacts = await getArtifacts();
  isLoading = false;
});
</script>

<div
	class="divide-primary-foreground/30 bg-background/50 z-50 inline-flex divide-x rounded-md shadow-2xs backdrop-blur-sm rtl:space-x-reverse"
>
	<Button
		variant="outline"
		class="rounded-none border-r-0 first:rounded-s-md last:rounded-e-md"
		href={current?.downloadUrl}
	>
		{#if isLoading}
			<Loader class="animate-spin" />
			<span>Loading...</span>
		{:else}
			{@const Icon = current?.icon ?? Mac}
			<Icon />
			{current?.osName ?? 'MacOS'}
		{/if}
	</Button>
	<Select.Root type="single">
		<Select.Trigger
			class={buttonVariants({
				class: 'rounded-none first:rounded-s-md last:rounded-e-md',
				size: 'icon',
				variant: 'outline'
			})}
			aria-label="Options"
		></Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Label>Select Platform</Select.Label>
				{#each artifacts as artifact, idx (idx)}
					<Select.Item
						value={artifact.osName}
						label={artifact.osName}
						onclick={() => (current = artifact)}
					>
						{#if artifact.icon}
							{@const Icon = artifact.icon}
							<Icon />
						{/if}
						{artifact.osName}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
</div>
