<script lang="ts">
	import { getGlobalSettings } from '../constants.svelte';
	import * as Switch from '$lib/components/ui/switch';
	import * as Label from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select';
	import { getUserPreferedAIModel, setUserPreferedAIModel, GeminiModel } from '$lib/gemini';

	const useSettings = getGlobalSettings();

	let apiKey = $state('');
	let hasApiKey = $state(false);
	let selectedModel = $state(getUserPreferedAIModel());

	onMount(() => {
		const storedKey = localStorage.getItem('gemini_api_key');
		if (storedKey) {
			hasApiKey = true;
		}
	});

	function saveApiKey() {
		if (apiKey.trim() === '') {
			toast.error('API Key cannot be empty.');
			return;
		}
		localStorage.setItem('gemini_api_key', apiKey);
		hasApiKey = true;
		apiKey = '';
		toast.success('API Key saved successfully.');
	}

	function removeApiKey() {
		localStorage.removeItem('gemini_api_key');
		hasApiKey = false;
		toast.success('API Key removed successfully.');
	}
</script>

<div class="mx-auto w-120 space-y-6 p-6">
	<div>
		<h3 class="text-lg font-medium">AI</h3>
		<p class="text-muted-foreground text-sm">Configure AI features.</p>
	</div>
	<div class="space-y-4">
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<Label.Root for="use-ai">Use AI</Label.Root>
				<p class="text-muted-foreground text-xs">Enable or disable all AI features.</p>
			</div>
			<Switch.Root id="use-ai" bind:checked={useSettings.useAI} />
		</div>

		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<Label.Root for="ai-model">AI Model</Label.Root>
				<p class="text-muted-foreground text-xs">Select the AI model to use.</p>
			</div>
			<Select.Root
				type="single"
				bind:value={selectedModel}
				onValueChange={(v) => setUserPreferedAIModel(v as GeminiModel)}
			>
				<Select.Trigger class="w-[180px]">
					{selectedModel}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value={GeminiModel.FlashLite} label="Flash Lite" />
					<Select.Item value={GeminiModel.Flash} label="Flash" />
					<Select.Item value={GeminiModel.Pro} label="Pro" />
				</Select.Content>
			</Select.Root>
		</div>

		<div class="rounded-lg border p-4">
			<Label.Root for="gemini-api-key">Gemini API Key</Label.Root>
			<p class="text-muted-foreground text-xs">
				Your API key is stored securely in your browser's local storage.
			</p>
			<div class="mt-2 flex items-center space-x-2">
				{#if hasApiKey}
					<Input type="password" value="******************" disabled class="grow" />
					<Button variant="destructive" onclick={removeApiKey}>Remove</Button>
				{:else}
					<Input
						type="password"
						id="gemini-api-key"
						placeholder="Enter your Gemini API Key"
						bind:value={apiKey}
						class="grow"
					/>
					<Button onclick={saveApiKey}>Save</Button>
				{/if}
			</div>
			<p class="text-muted-foreground mt-2 text-xs">
				Don't have a key? Get one from
				<a
					href="https://aistudio.google.com/app/apikey"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary underline"
				>
					Google AI Studio
				</a>.
			</p>
		</div>
	</div>
</div>
