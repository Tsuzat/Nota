<script lang="ts">
import { Button } from '@nota/ui/shadcn/button';
import { Input } from '@nota/ui/shadcn/input';
import * as Label from '@nota/ui/shadcn/label';
import * as Select from '@nota/ui/shadcn/select';
import { toast } from '@nota/ui/shadcn/sonner';
import * as Switch from '@nota/ui/shadcn/switch';
import { onMount } from 'svelte';
import { GeminiModel, getUserPreferedAIModel, setUserPreferedAIModel } from '$lib/gemini';
import { getGlobalSettings } from '../constants.svelte';

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
					{#each Object.values(GeminiModel) as model (model)}
						<Select.Item value={model} label={model} />
					{/each}
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
