<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import Mac from './icons/mac.svelte';

	import { onMount } from 'svelte';
	import { getArtifacts, type Artifact } from './artifacts';

	let artifacts = $state<Artifact[]>([]);

	let current = $derived.by(() => {
		return artifacts.find((artifact) => artifact.isCurrent);
	});

	onMount(async () => {
		artifacts = await getArtifacts();
	});
</script>

<div
	class="divide-primary-foreground/30 inline-flex divide-x rounded-md shadow-2xs rtl:space-x-reverse"
>
	<Button
		variant="outline"
		class="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
		href={current?.downloadUrl}
	>
		{@const Icon = current?.icon ?? Mac}
		<Icon />
		{current?.osName ?? 'MacOS'}
	</Button>
	<Select.Root type="single">
		<Select.Trigger
			class={buttonVariants({
				variant: 'default',
				class: 'rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10',
				size: 'icon'
			})}
			aria-label="Options"
		></Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Label>Select Platform</Select.Label>
				{#each artifacts as artifact}
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
