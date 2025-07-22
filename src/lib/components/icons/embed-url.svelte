<script lang="ts">
	import Button from '../ui/button/button.svelte';
	import { Input } from '../ui/input';

	interface Props {
		onSelect?: (url: string) => void;
	}

	const { onSelect }: Props = $props();

	let value = $state('');
	let isUrl = $derived.by(() => {
		try {
			new URL(value);
			return true;
		} catch {
			return false;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		onSelect?.('url:' + value);
	}
</script>

<form class="flex flex-col gap-2 p-1" onsubmit={handleSubmit}>
	<Input bind:value placeholder="Embed Image URL" type="url" required />
	{#if isUrl}
		<div class="flex items-center gap-4">
			<span>Preview: </span>
			<img src={value} alt="preview" class="aspect-square size-8" />
		</div>
	{/if}
	<Button type="submit">Embed URL</Button>
</form>
