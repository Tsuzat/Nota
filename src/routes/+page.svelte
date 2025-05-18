<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { invoke } from '@tauri-apps/api/core';
	import { confirm } from '@tauri-apps/plugin-dialog';

	let name = $state('');
	let greetMsg = $state('');

	async function askMe() {
		const hello = confirm('Is this windows is visible to you ??');
	}

	async function greet(event: Event) {
		event.preventDefault();
		// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
		greetMsg = await invoke('greet', { name });
	}
</script>

<div class="flex flex-col h-full gap-8 items-center justify-center">
	<h1>Hello World!</h1>
	<form class="flex items-center justify-center gap-2" onsubmit={greet}>
		<Input bind:value={name} />
		<Button type="submit" class="rounded-full">Submit</Button>
	</form>
	{#if greetMsg.trim() !== ''}
		<p>{greetMsg}</p>
	{/if}
	<Button onclick={askMe}>Show Dialog</Button>
</div>
