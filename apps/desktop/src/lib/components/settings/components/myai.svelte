<script lang="ts">
import { GoogleGenAI } from '@google/genai';
import { Button } from '@lib/components/ui/button';
import { Input } from '@lib/components/ui/input';
import { icons } from '@lib/icons';
import { cn } from '@lib/utils';
import * as Label from '@nota/ui/shadcn/label';
import * as Select from '@nota/ui/shadcn/select';
import { toast } from '@nota/ui/shadcn/sonner';
import * as Switch from '@nota/ui/shadcn/switch';
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { GEMINI_MODELS } from '$lib/ai';
import { decrypt, encrypt } from '..';
import { getGlobalSettings } from '../constants.svelte';

const settings = getGlobalSettings();

let apiKeyInput = $state('');
let saving = $state(false);
let validating = $state(false);
let isValidKey = $state(false);
let validationError = $state('');
let hasStoredKey = $derived(apiKeyInput !== '');

onMount(async () => {
  apiKeyInput = await decrypt(localStorage.getItem('geminiApiKeyEnc') || '');
});

const availableModels = $derived(Object.values(GEMINI_MODELS));
const modelDescriptions: Record<string, string> = {
  [GEMINI_MODELS.GEMINI_2_5_FLASH_LITE]: 'Fast, low-cost responses for simple tasks.',
  [GEMINI_MODELS.GEMINI_2_5_FLASH]: 'Balanced speed and quality for general usage.',
  [GEMINI_MODELS.GEMINI_2_5_PRO]: 'Higher quality outputs for complex reasoning.',
  [GEMINI_MODELS.GEMINI_3_FLASH]: 'Latest fast model for everyday assistance.',
  [GEMINI_MODELS.GEMINI_3_PRO]: 'Latest advanced model with stronger capabilities.',
};

async function handleValidate() {
  validating = true;
  validationError = '';
  const ai = new GoogleGenAI({ apiKey: apiKeyInput.trim() });
  const res = await ai.models.get({
    model: GEMINI_MODELS.GEMINI_2_5_FLASH_LITE,
  });
  isValidKey = res.name !== undefined;
  validationError = res.name === undefined ? 'Key validation failed' : '';
  validating = false;
}

async function handleSaveKey() {
  if (!isValidKey) {
    toast.error('Enter a valid API key');
    return;
  }
  saving = true;
  try {
    const encrypted = await encrypt(apiKeyInput.trim());
    localStorage.setItem('geminiApiKeyEnc', encrypted);
  } catch (e) {
    toast.error('Failed to store API key');
  } finally {
    saving = false;
  }
}

function handleClearKey() {
  localStorage.removeItem('geminiApiKeyEnc');
  hasStoredKey = false;
  apiKeyInput = '';
  toast.warning('Stored API key removed');
}

function handleSelectModel(value: string) {
  settings.geminiModel = value;
  toast.success(`Model set to ${value}`);
}
</script>

<div class="mx-auto w-120 space-y-6 p-6 overflow-auto">
  <div>
    <h3 class="text-lg font-medium">Manage Your Own AI API Key</h3>
    <p class="text-muted-foreground text-sm">
      Manage custom API keys and models.
    </p>
  </div>

  <div class="space-y-4">
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <Label.Root for="use-custom-key">Use My Own API Key</Label.Root>
        <p class="text-muted-foreground text-xs">
          Enable custom provider with your API key.
        </p>
      </div>
      <Switch.Root
        id="use-custom-key"
        bind:checked={settings.useMyOwnAI}
        aria-label="Enable custom API key"
      />
    </div>

    {#if settings.useMyOwnAI}
      <div transition:fade class="rounded-lg border p-4 space-y-3">
        <div class="flex items-center justify-between">
          <Label.Root for="api-key">Gemini API Key</Label.Root>
        </div>
        <p class="text-muted-foreground text-xs">
          Enter your Gemini API key to enable custom provider.
          <a href="https://aistudio.google.com/api-keys" target="_blank" class="text-xs underline hover:text-primary">Get API Key</a>
        </p>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter GEMINI API key"
          bind:value={apiKeyInput}
          aria-invalid={validationError !== ""}
          disabled={!settings.useMyOwnAI || hasStoredKey}
        />
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            class={cn("ring-1", isValidKey && "ring-green-600")}
            disabled={!settings.useMyOwnAI ||
              validating ||
              apiKeyInput.trim() === ""}
            onclick={handleValidate}
            aria-live="polite"
          >
            {#if validating}
              <span class="inline-flex items-center gap-2">
                <icons.Loader class="h-4 w-4 animate-spin" />
                <span>Validating</span>
              </span>
            {:else}
              Validate
            {/if}
          </Button>
          <Button
            disabled={!settings.useMyOwnAI || !isValidKey || saving}
            onclick={handleSaveKey}
          >
            {#if saving}
              Saving…
            {:else}
              Save Key
            {/if}
          </Button>
          <Button
            variant="destructive"
            disabled={!hasStoredKey}
            onclick={handleClearKey}
          >
            Remove Stored Key
          </Button>
        </div>
        {#if validationError !== ""}
          <p class="text-destructive text-xs">{validationError}</p>
        {/if}
      </div>

      <div transition:fade class="rounded-lg border p-4 space-y-3">
        <Label.Root>Model</Label.Root>          
        <p class="text-muted-foreground text-xs">
          Select the AI model to use with your custom provider.
        </p>
        <div class="flex items-center gap-2">
          <Select.Root type="single">
            <Select.Trigger aria-label="Select AI model">
              <span class="text-sm">{settings.geminiModel}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Label>Select Model</Select.Label>
                {#each availableModels as m (m)}
                  <Select.Item
                    value={m}
                    label={m}
                    onclick={() => handleSelectModel(m)}
                  >
                    <span>{m}</span>
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        <p class="text-muted-foreground text-xs">
          {modelDescriptions[settings.geminiModel]}
        </p>
      </div>
    {/if}
  </div>
</div>
