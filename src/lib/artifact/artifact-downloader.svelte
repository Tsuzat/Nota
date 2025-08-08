<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import Mac from './icons/mac.svelte';

	import { onMount } from 'svelte';
	import { getArtifacts, type Artifact } from './artifacts';
	import { Loader } from '@lucide/svelte';

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
	class="divide-primary-foreground/30 inline-flex divide-x rounded-md shadow-2xs rtl:space-x-reverse"
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
						{artifact.osName}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
</div>
