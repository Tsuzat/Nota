<script lang="ts">
import Loader from '@lucide/svelte/icons/loader';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Select from '@nota/ui/shadcn/select';

import { onMount } from 'svelte';
import { type Artifact, getArtifacts, type ReleaseAssetsResponse } from './artifacts';
import Mac from './icons/mac.svelte';

interface Props {
  platforms: ReleaseAssetsResponse['platforms'];
}

const { platforms }: Props = $props();

let artifacts = $derived.by(() => {
  return getArtifacts(platforms);
});

let current = $derived.by(() => {
  return artifacts.find((artifact) => artifact.isCurrent);
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
			{@const Icon = current?.icon ?? Mac}
			<Icon />
			{current?.osName ?? 'MacOS'}
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
