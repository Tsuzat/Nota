<script lang="ts">
	import IconPicker from '$lib/components/icons/icon-picker.svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Notebook } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		type?: 'local' | 'cloud';
		children?: Snippet<[]>;
	}

	let { open = $bindable(false), type = 'local', children }: Props = $props();

	let icon = $state('lucide:Notebook');
	let name = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
		}
		if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
			event.preventDefault();
			open = true;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
	{#if children}
		<Dialog.Trigger>
			{@render children()}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content class="" showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>New Workspace</Dialog.Title>
			<Dialog.Description>Create a local or remote workspace</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="flex items-center gap-2">
			<IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
				<div class={buttonVariants({ variant: 'outline', size: 'icon' })}>
					<IconRenderer {icon} />
				</div>
			</IconPicker>
			<Input placeholder="Workspace Name" type="text" required />
		</form>
	</Dialog.Content>
</Dialog.Root>
