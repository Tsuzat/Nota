<script lang="ts">
import { SimpleToolTip } from '@lib/components/custom';
import { Button } from '@lib/components/ui/button';
import { Input } from '@lib/components/ui/input';
import { BarSpinner } from '@lib/icons';
import { cn } from '@lib/utils';
import { getAuthContext, secureStorage, testAIKey, type AIProvider } from '@nota/client';
import * as Label from '@nota/ui/shadcn/label';
import * as Switch from '@nota/ui/shadcn/switch';
import * as Select from '@nota/ui/shadcn/select';
import { toast } from '@nota/ui/shadcn/sonner';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { getGlobalSettings } from '../constants.svelte';
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';

const useSettings = getGlobalSettings();
const user = $derived(getAuthContext().user);

function getAICredits() {
  if (!user) return '0 Credits';
  if (!user.ai_credits) return '0 Credits';
  return user.ai_credits >= 1000000
    ? `${(user.ai_credits / 1000000).toFixed(1)}M`
    : user.ai_credits >= 1000
      ? `${(user.ai_credits / 1000).toFixed(1)}K`
      : `${user.ai_credits}`;
}

const PROVIDERS = [
  { value: 'server', label: 'Nota AI (Server)' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Anthropic Claude' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'kimi', label: 'Kimi (Moonshot)' },
  { value: 'custom', label: 'Custom (OpenAI Compatible)' }
];

let apiKeyInput = $state('');
let modelInput = $state('');
let baseUrlInput = $state('');

let saving = $state(false);
let validating = $state(false);
let isValidKey = $state(false);
let hasStoredKey = $state(false);

async function loadProviderConfig(provider: string) {
  if (provider === 'server') return;
  const key = await secureStorage.getItem(`${provider}_api_key`);
  apiKeyInput = key || '';
  hasStoredKey = !!key;
  modelInput = localStorage.getItem(`${provider}_model`) || '';
  baseUrlInput = localStorage.getItem(`${provider}_base_url`) || '';
}

onMount(() => {
  loadProviderConfig(useSettings.aiProvider);
});

function handleProviderChange(value: string) {
  useSettings.aiProvider = value as AIProvider;
  isValidKey = false;
  loadProviderConfig(value);
}

async function handleValidate() {
  validating = true;
  isValidKey = false;
  try {
    const ok = await testAIKey(useSettings.aiProvider as AIProvider, apiKeyInput.trim(), modelInput.trim(), baseUrlInput.trim());
    isValidKey = ok;
    if (!ok) toast.error('Key validation failed');
    else toast.success('Key is valid');
  } catch (e: any) {
    isValidKey = false;
    toast.error(e.message || 'Validation error');
  } finally {
    validating = false;
  }
}

async function handleSaveKey() {
  if (!isValidKey) {
    toast.error('Validate the key first!');
    return;
  }
  saving = true;
  try {
    const p = useSettings.aiProvider;
    await secureStorage.setItem(`${p}_api_key`, apiKeyInput.trim());
    localStorage.setItem(`${p}_model`, modelInput.trim());
    localStorage.setItem(`${p}_base_url`, baseUrlInput.trim());
    hasStoredKey = true;
    toast.success('AI configuration saved successfully');
  } catch (e) {
    toast.error('Failed to store AI config');
  } finally {
    saving = false;
  }
}

async function handleClearKey() {
  const p = useSettings.aiProvider;
  await secureStorage.removeItem(`${p}_api_key`);
  localStorage.removeItem(`${p}_model`);
  localStorage.removeItem(`${p}_base_url`);
  apiKeyInput = '';
  modelInput = '';
  baseUrlInput = '';
  hasStoredKey = false;
  isValidKey = false;
  toast.warning('Stored configuration removed');
}
</script>

<div class="mx-auto w-full space-y-6">
	<div>
		<h3 class="text-lg font-medium">AI</h3>
		<p class="text-muted-foreground text-sm">Configure and See AI settings.</p>
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
				<Label.Root for="use-ai">Available AI Credits</Label.Root>
				<p class="text-muted-foreground text-xs">
					Your AI credits are used to power the AI features. They never expire.
				</p>	
			</div>
			<SimpleToolTip content={`${user?.ai_credits || 0} AI Credits Available`}>
				<span class="text-sm text-muted-foreground">{getAICredits()}</span>
			</SimpleToolTip>
		</div>
		<Button onclick={() => openUrl(`${PUBLIC_NOTA_FRONTEND_URL}#pricing`)}>Buy More AI Credits</Button>
	</div>

  <!-- Custom AI Section -->
  <div class="space-y-4 pt-4 border-t">
    <div>
      <h3 class="text-lg font-medium">AI Provider</h3>
      <p class="text-muted-foreground text-sm">
        Select which AI service to use for generation.
      </p>
    </div>

    <div class="rounded-lg border p-4 space-y-4">
      <div class="flex flex-col gap-2">
        <Label.Root>Provider</Label.Root>
        <Select.Root type="single" value={useSettings.aiProvider} onValueChange={handleProviderChange}>
          <Select.Trigger aria-label="Select AI provider" class="w-full">
            <span class="text-sm">{PROVIDERS.find(p => p.value === useSettings.aiProvider)?.label || 'Server'}</span>
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>Providers</Select.Label>
              {#each PROVIDERS as provider}
                <Select.Item value={provider.value} label={provider.label}>
                  <span>{provider.label}</span>
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>

      {#if useSettings.aiProvider !== 'server'}
        <div transition:fade class="space-y-3 pt-2">
          <div class="space-y-1">
            <Label.Root for="api-key">API Key</Label.Root>
            <Input
              id="api-key"
              type="password"
              placeholder={`Enter ${useSettings.aiProvider} API key`}
              bind:value={apiKeyInput}
              disabled={hasStoredKey}
            />
          </div>

          <div class="space-y-1">
            <Label.Root for="model-id">Model ID</Label.Root>
            <Input
              id="model-id"
              type="text"
              placeholder="e.g. gpt-4o-mini (leave blank for default)"
              bind:value={modelInput}
              disabled={hasStoredKey}
            />
          </div>

          {#if useSettings.aiProvider === 'custom' || useSettings.aiProvider === 'deepseek' || useSettings.aiProvider === 'kimi'}
            <div class="space-y-1">
              <Label.Root for="base-url">Base URL</Label.Root>
              <Input
                id="base-url"
                type="text"
                placeholder="e.g. https://api.openai.com/v1"
                bind:value={baseUrlInput}
                disabled={hasStoredKey}
              />
            </div>
          {/if}

          <div class="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              class={cn("ring-1", isValidKey && "ring-green-600")}
              disabled={validating || apiKeyInput.trim() === ""}
              onclick={handleValidate}
            >
              {#if validating}
                <span class="inline-flex items-center gap-2">
                  <BarSpinner />
                  <span>Validating</span>
                </span>
              {:else}
                Validate
              {/if}
            </Button>
            <Button
              disabled={!isValidKey || saving}
              onclick={handleSaveKey}
            >
              {saving ? 'Saving…' : 'Save Config'}
            </Button>
            <Button
              variant="destructive"
              disabled={!hasStoredKey}
              onclick={handleClearKey}
            >
              Clear Config
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>