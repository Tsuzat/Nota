<script lang="ts">
import CircleCheck from "@lucide/svelte/icons/circle-check";
import ExternalLink from "@lucide/svelte/icons/external-link";
import Eye from "@lucide/svelte/icons/eye";
import EyeOff from "@lucide/svelte/icons/eye-off";
import Info from "@lucide/svelte/icons/info";
import Loader2 from "@lucide/svelte/icons/loader-2";
import Pen from "@lucide/svelte/icons/pen";
import Plus from "@lucide/svelte/icons/plus";
import Save from "@lucide/svelte/icons/save";
import ShieldCheck from "@lucide/svelte/icons/shield-check";
import Sparkles from "@lucide/svelte/icons/sparkles";
import Trash2 from "@lucide/svelte/icons/trash-2";
import X from "@lucide/svelte/icons/x";
import type { CustomModelConfig, PredefinedProviderName } from "@nota/ai";
import { LATEST_MODELS, testAIKey } from "@nota/ai";
import { toast } from "@nota/ui";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import { Input } from "@nota/ui/shadcn/input/index.ts";
import * as Label from "@nota/ui/shadcn/label/index.ts";
import * as Switch from "@nota/ui/shadcn/switch/index.ts";
import { cn } from "@nota/ui/utils.ts";
import { createQuery } from "@tanstack/svelte-query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { onMount } from "svelte";
import { fade, slide } from "svelte/transition";
import { getAuthSession, isSignedIn } from "#lib/auth-session.svelte.ts";
import { orpc } from "#lib/orpc.ts";
import { secureStorage } from "#lib/platform/securestorage.ts";
import { PUBLIC_NOTA_URL } from "$app/env/public";
import { getGlobalSettings } from "../constants.svelte";

const useSettings = getGlobalSettings();
const user = $derived(getAuthSession().data?.user);

const userQuota = createQuery(() => {
	return {
		...orpc.userquota.getQuota.queryOptions(),
		enabled: isSignedIn(),
	};
});

function getAICredits() {
	if (!user || !userQuota.data?.aiCreditBalanceCents) return "0";
	return userQuota.data.aiCreditBalanceCents >= 1_000_000
		? `${(userQuota.data.aiCreditBalanceCents / 1_000_000).toFixed(1)}M`
		: userQuota.data.aiCreditBalanceCents >= 1_000
			? `${(userQuota.data.aiCreditBalanceCents / 1_000).toFixed(1)}K`
			: `${userQuota.data.aiCreditBalanceCents}`;
}

const PRESET_PROVIDERS: {
	id: PredefinedProviderName;
	label: string;
	docsUrl?: string;
	docName?: string;
}[] = [
	{
		id: "google",
		label: "Google Gemini",
		docsUrl: "https://aistudio.google.com/app/apikey",
		docName: "Google AI Studio",
	},
	{
		id: "openai",
		label: "OpenAI",
		docsUrl: "https://platform.openai.com/api-keys",
		docName: "OpenAI Platform",
	},
	{
		id: "anthropic",
		label: "Anthropic Claude",
		docsUrl: "https://console.anthropic.com/settings/keys",
		docName: "Anthropic Console",
	},
	{
		id: "deepseek",
		label: "DeepSeek",
		docsUrl: "https://platform.deepseek.com/api_keys",
		docName: "DeepSeek Platform",
	},
	{
		id: "kimi",
		label: "Kimi (Moonshot)",
		docsUrl: "https://platform.moonshot.cn/console/api-keys",
		docName: "Moonshot Platform",
	},
	{
		id: "grok",
		label: "xAI Grok",
		docsUrl: "https://console.x.ai/",
		docName: "xAI Console",
	},
];

// Preset provider key state
let providerKeysState = $state<Record<PredefinedProviderName, boolean>>(
	{} as Record<PredefinedProviderName, boolean>,
);
let editingProviderId = $state<PredefinedProviderName | null>(null);
let providerKeyInput = $state("");
let showProviderKey = $state(false);
let validatingProviderKey = $state(false);
let isValidatedProviderKey = $state(false);

// Custom models state
let customModels = $state<CustomModelConfig[]>([]);
let showAddCustomModal = $state(false);
let customDisplayName = $state("");
let customModelString = $state("");
let customBaseUrl = $state("");
let customApiKey = $state("");
let showCustomApiKey = $state(false);
let validatingCustom = $state(false);
let isValidatedCustom = $state(false);

onMount(async () => {
	await refreshState();
});

async function refreshState() {
	const keyStatus: Record<string, boolean> = {};
	for (const p of PRESET_PROVIDERS) {
		const key = await secureStorage.getItem(`${p.id}_api_key`);
		keyStatus[p.id] = !!key && key.trim().length > 0;
	}
	providerKeysState = keyStatus;

	try {
		const raw = localStorage.getItem("custom_ai_models");
		if (raw) {
			customModels = JSON.parse(raw);
		} else {
			customModels = [];
		}
	} catch {
		customModels = [];
	}
}

async function startEditProviderKey(providerId: PredefinedProviderName) {
	editingProviderId = providerId;
	const existing = await secureStorage.getItem(`${providerId}_api_key`);
	providerKeyInput = existing || "";
	isValidatedProviderKey = false;
	showProviderKey = false;
}

function cancelEditProviderKey() {
	editingProviderId = null;
	providerKeyInput = "";
	isValidatedProviderKey = false;
}

async function handleValidatePresetKey(providerId: PredefinedProviderName) {
	if (!providerKeyInput.trim()) return;
	validatingProviderKey = true;
	isValidatedProviderKey = false;
	try {
		// Derive the first model from LATEST_MODELS for this provider
		const providerModels = LATEST_MODELS[providerId];
		const firstModelKey = Object.keys(providerModels.models)[0];
		const defaultModel = providerModels.models[firstModelKey].modelString;

		const ok = await testAIKey({
			provider: providerId,
			apiKey: providerKeyInput.trim(),
			modelId: defaultModel,
		});
		isValidatedProviderKey = ok;
		if (ok) toast.success("API Key validated successfully!");
		else toast.error("Key validation failed. Please check key permissions.");
	} catch (e: any) {
		toast.error(e.message || "Validation error");
	} finally {
		validatingProviderKey = false;
	}
}

async function handleSavePresetKey(providerId: PredefinedProviderName) {
	if (!isValidatedProviderKey) {
		toast.error("Please validate key before saving.");
		return;
	}
	try {
		await secureStorage.setItem(
			`${providerId}_api_key`,
			providerKeyInput.trim(),
		);
		toast.success(`${providerId.toUpperCase()} API key saved securely.`);
		editingProviderId = null;
		await refreshState();
	} catch {
		toast.error("Failed to store API key.");
	}
}

async function handleRemovePresetKey(providerId: PredefinedProviderName) {
	try {
		await secureStorage.removeItem(`${providerId}_api_key`);
		toast.warning(`Removed ${providerId.toUpperCase()} API key.`);
		editingProviderId = null;
		await refreshState();
	} catch {
		toast.error("Failed to remove key.");
	}
}

// --- Custom Models Handlers ---
function resetCustomForm() {
	customDisplayName = "";
	customModelString = "";
	customBaseUrl = "";
	customApiKey = "";
	showCustomApiKey = false;
	validatingCustom = false;
	isValidatedCustom = false;
}

async function handleValidateCustomModel() {
	if (
		!customDisplayName.trim() ||
		!customModelString.trim() ||
		!customBaseUrl.trim() ||
		!customApiKey.trim()
	) {
		toast.error("Please fill in all custom model fields.");
		return;
	}
	if (
		customModels.some(
			(m) =>
				m.displayName.toLowerCase() === customDisplayName.trim().toLowerCase(),
		)
	) {
		toast.error("Display name must be unique.");
		return;
	}

	validatingCustom = true;
	isValidatedCustom = false;
	try {
		const ok = await testAIKey({
			provider: "other",
			apiKey: customApiKey.trim(),
			modelId: customModelString.trim(),
			baseURL: customBaseUrl.trim(),
		});
		isValidatedCustom = ok;
		if (ok) toast.success("Custom model connection verified!");
		else toast.error("Could not connect to custom model endpoint.");
	} catch (e: any) {
		toast.error(e.message || "Validation failed");
	} finally {
		validatingCustom = false;
	}
}

async function handleSaveCustomModel() {
	if (!isValidatedCustom) {
		toast.error("Please validate connection first.");
		return;
	}
	try {
		const id = `custom_${Date.now()}`;
		const newModel: CustomModelConfig = {
			id,
			displayName: customDisplayName.trim(),
			modelString: customModelString.trim(),
			baseUrl: customBaseUrl.trim(),
		};

		await secureStorage.setItem(`custom_${id}_api_key`, customApiKey.trim());

		const updatedList = [...customModels, newModel];
		localStorage.setItem("custom_ai_models", JSON.stringify(updatedList));

		toast.success(`Custom model "${newModel.displayName}" added successfully!`);
		showAddCustomModal = false;
		resetCustomForm();
		await refreshState();
	} catch {
		toast.error("Failed to save custom model.");
	}
}

async function handleDeleteCustomModel(id: string, name: string) {
	try {
		await secureStorage.removeItem(`custom_${id}_api_key`);
		const updatedList = customModels.filter((m) => m.id !== id);
		localStorage.setItem("custom_ai_models", JSON.stringify(updatedList));
		toast.warning(`Removed custom model "${name}".`);
		await refreshState();
	} catch {
		toast.error("Failed to remove custom model.");
	}
}
</script>

<div class="w-full max-w-xl mx-auto space-y-5 pb-10">
  <!-- Page Header -->
  <div class="space-y-0.5">
    <h2
      class="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2"
    >
      <Sparkles class="size-5 text-amber-500" />
      <span>AI Settings</span>
    </h2>
    <span class="text-xs text-muted-foreground leading-snug"
      >Configure AI writing assistants, inference providers, and API keys.</span
    >
  </div>

  <!-- Section 1: General & Credits -->
  <div class="space-y-2">
    <h3
      class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-0.5"
    >
      General
    </h3>
    <div class="rounded-xl border border-border/40 divide-y bg-muted/10">
      <!-- Master Switch -->
      <div
        class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20"
      >
        <div class="space-y-0.5 min-w-0 pr-4">
          <div class="flex items-center gap-2">
            <Label.Root
              for="use-ai"
              class="font-medium text-sm text-foreground cursor-pointer"
              >Enable AI Capabilities</Label.Root
            >
            <span
              class={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                useSettings.useAI
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border",
              )}
            >
              {useSettings.useAI ? "Active" : "Disabled"}
            </span>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5 leading-snug">
            Toggle AI inline generation, writing assistant, and smart commands.
          </p>
        </div>
        <Switch.Root id="use-ai" bind:checked={useSettings.useAI} />
      </div>

      <!-- Credits Balance -->
      <div
        class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20"
      >
        <div class="space-y-0.5 min-w-0 pr-4">
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm text-foreground"
              >Nota AI Credits</span
            >
            <span
              class="font-mono text-xs font-semibold text-foreground bg-background px-2 py-0.5 rounded border border-border/50 tabular-nums"
            >
              {getAICredits()} Credits
            </span>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5 leading-snug">
            Used for server-side hosted generation. Credits never expire.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          class="gap-1.5 font-medium text-xs h-8 rounded-lg shrink-0"
          onclick={() => openUrl(`${PUBLIC_NOTA_URL}#pricing`)}
        >
          <Plus class="size-3.5" />
          <span>Buy Credits</span>
        </Button>
      </div>

      <!-- Use Own Keys Switch -->
      <div
        class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20"
      >
        <div class="space-y-0.5 min-w-0 pr-4">
          <div class="flex items-center gap-2">
            <Label.Root
              for="use-own-keys"
              class="font-medium text-sm text-foreground cursor-pointer"
              >Let me use my own keys</Label.Root
            >
            <span
              class={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                useSettings.useOwnKeys
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-muted text-muted-foreground border-border",
              )}
            >
              {useSettings.useOwnKeys ? "Custom Keys" : "Nota Server"}
            </span>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5 leading-snug">
            Connect API keys for Gemini, OpenAI, Claude, DeepSeek, Kimi, or
            Custom endpoints.
          </p>
        </div>
        <Switch.Root id="use-own-keys" bind:checked={useSettings.useOwnKeys} />
      </div>
    </div>
  </div>

  <!-- Section 2: Own Keys & Custom Models Configuration -->
  {#if useSettings.useOwnKeys}
    <div transition:slide={{ duration: 200 }} class="space-y-5 pt-1">
      <!-- Preset Providers List -->
      <div class="space-y-2">
        <h3
          class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-0.5"
        >
          Preset AI Providers
        </h3>
        <div
          class="rounded-xl border border-border/40 divide-y bg-muted/10 overflow-hidden"
        >
          {#each PRESET_PROVIDERS as provider (provider.id)}
            {@const isConfigured = providerKeysState[provider.id]}
            {@const isEditing = editingProviderId === provider.id}

            <div class="p-3.5 transition-colors hover:bg-muted/20 space-y-3">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5 min-w-0 pr-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm text-foreground"
                      >{provider.label}</span
                    >
                    <span
                      class={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                        isConfigured
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {#if isConfigured}
                        <CircleCheck class="size-3" />
                        <span>Configured</span>
                      {:else}
                        <span>Not Configured</span>
                      {/if}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  {#if provider.docsUrl}
                    <Button
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      variant="link"
                    >
                      <span>Get Key</span>
                      <ExternalLink class="size-3" />
                    </Button>
                  {/if}

                  {#if isEditing}
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-7 text-xs rounded-md"
                      onclick={cancelEditProviderKey}
                    >
                      Cancel
                    </Button>
                  {:else if isConfigured}
                    <Button
                      size="sm"
                      variant="outline"
                      class="h-7 text-xs rounded-md gap-1"
                      onclick={() => startEditProviderKey(provider.id)}
                    >
                      <Pen class="size-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      class="h-7 text-xs rounded-md gap-1"
                      onclick={() => handleRemovePresetKey(provider.id)}
                    >
                      <Trash2 class="size-3" />
                    </Button>
                  {:else}
                    <Button
                      size="sm"
                      variant="default"
                      class="h-7 text-xs rounded-md gap-1"
                      onclick={() => startEditProviderKey(provider.id)}
                    >
                      <Plus class="size-3" />
                      <span>Configure</span>
                    </Button>
                  {/if}
                </div>
              </div>

              <!-- Inline Edit Form for Preset Provider Key -->
              {#if isEditing}
                <div
                  transition:slide={{ duration: 150 }}
                  class="pt-2 border-t border-border/30 space-y-2.5"
                >
                  <div class="space-y-1">
                    <Label.Root
                      class="text-xs font-medium text-muted-foreground"
                      >API Key for {provider.label}</Label.Root
                    >
                    <div class="relative flex items-center">
                      <Input
                        type={showProviderKey ? "text" : "password"}
                        placeholder={`Enter ${provider.label} API Key`}
                        bind:value={providerKeyInput}
                        class="bg-background border-border/70 h-9 pr-10 font-mono text-xs rounded-lg"
                      />
                      <button
                        type="button"
                        class="absolute right-3 text-muted-foreground hover:text-foreground"
                        onclick={() => (showProviderKey = !showProviderKey)}
                      >
                        {#if showProviderKey}
                          <EyeOff class="size-3.5" />
                        {:else}
                          <Eye class="size-3.5" />
                        {/if}
                      </button>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      class={cn(
                        "gap-1 text-xs h-7.5 rounded-md",
                        isValidatedProviderKey &&
                          "border-emerald-600 text-emerald-600 bg-emerald-50",
                      )}
                      disabled={validatingProviderKey ||
                        !providerKeyInput.trim()}
                      onclick={() => handleValidatePresetKey(provider.id)}
                    >
                      {#if validatingProviderKey}
                        <Loader2 class="size-3 animate-spin" />
                        <span>Testing…</span>
                      {:else if isValidatedProviderKey}
                        <CircleCheck class="size-3 text-emerald-600" />
                        <span>Key Valid</span>
                      {:else}
                        <ShieldCheck class="size-3" />
                        <span>Validate Key</span>
                      {/if}
                    </Button>

                    <Button
                      size="sm"
                      class="gap-1 text-xs h-7.5 rounded-md"
                      disabled={!isValidatedProviderKey}
                      onclick={() => handleSavePresetKey(provider.id)}
                    >
                      <Save class="size-3" />
                      <span>Save Key</span>
                    </Button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Custom AI Models Section -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-0.5">
          <h3
            class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80"
          >
            Custom AI Models
          </h3>
          <Button
            variant="outline"
            onclick={() => {
              showAddCustomModal = !showAddCustomModal;
              if (showAddCustomModal) resetCustomForm();
            }}
          >
            {#if showAddCustomModal}
              <X />
              <span>Cancel</span>
            {:else}
              <Plus />
              <span>Add Custom Model</span>
            {/if}
          </Button>
        </div>

        <!-- Add Custom Model Expandable Form -->
        {#if showAddCustomModal}
          <div
            transition:slide={{ duration: 180 }}
            class="rounded-xl border border-primary/30 p-4 bg-primary/5 space-y-3"
          >
            <div class="space-y-0.5">
              <h4 class="font-semibold text-sm text-foreground">
                Configure Custom OpenAI-Compatible Model
              </h4>
              <p class="text-xs text-muted-foreground leading-snug">
                Connect local Ollama, vLLM, LMStudio, or custom API endpoints.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div class="space-y-1">
                <Label.Root class="text-xs font-medium text-muted-foreground"
                  >Unique Display Name</Label.Root
                >
                <Input
                  placeholder="e.g. Local Ollama Llama 3"
                  bind:value={customDisplayName}
                  class="bg-background border-border/70 h-8.5 text-xs rounded-lg"
                />
              </div>

              <div class="space-y-1">
                <Label.Root class="text-xs font-medium text-muted-foreground"
                  >Model Identifier</Label.Root
                >
                <Input
                  placeholder="e.g. llama3 or mistral-7b"
                  bind:value={customModelString}
                  class="bg-background border-border/70 h-8.5 font-mono text-xs rounded-lg"
                />
              </div>
            </div>

            <div class="space-y-1">
              <Label.Root class="text-xs font-medium text-muted-foreground"
                >Base URL</Label.Root
              >
              <Input
                placeholder="e.g. http://localhost:11434/v1"
                bind:value={customBaseUrl}
                class="bg-background border-border/70 h-8.5 font-mono text-xs rounded-lg"
              />
            </div>

            <div class="space-y-1">
              <Label.Root class="text-xs font-medium text-muted-foreground"
                >API Key</Label.Root
              >
              <div class="relative flex items-center">
                <Input
                  type={showCustomApiKey ? "text" : "password"}
                  placeholder="API key or 'ollama'"
                  bind:value={customApiKey}
                  class="bg-background border-border/70 h-8.5 pr-10 font-mono text-xs rounded-lg"
                />
                <button
                  type="button"
                  class="absolute right-3 text-muted-foreground hover:text-foreground"
                  onclick={() => (showCustomApiKey = !showCustomApiKey)}
                >
                  {#if showCustomApiKey}
                    <EyeOff class="size-3.5" />
                  {:else}
                    <Eye class="size-3.5" />
                  {/if}
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                class={cn(
                  "gap-1 text-xs h-8 rounded-md",
                  isValidatedCustom &&
                    "border-emerald-600 text-emerald-600 bg-emerald-50",
                )}
                disabled={validatingCustom ||
                  !customApiKey.trim() ||
                  !customBaseUrl.trim() ||
                  !customModelString.trim()}
                onclick={handleValidateCustomModel}
              >
                {#if validatingCustom}
                  <Loader2 class="size-3 animate-spin" />
                  <span>Connecting…</span>
                {:else if isValidatedCustom}
                  <CircleCheck class="size-3 text-emerald-600" />
                  <span>Connection Verified</span>
                {:else}
                  <ShieldCheck class="size-3" />
                  <span>Test Connection</span>
                {/if}
              </Button>

              <Button
                size="sm"
                class="gap-1 text-xs h-8 rounded-md"
                disabled={!isValidatedCustom}
                onclick={handleSaveCustomModel}
              >
                <Save class="size-3" />
                <span>Save Custom Model</span>
              </Button>
            </div>
          </div>
        {/if}

        <!-- List of Configured Custom Models -->
        <div
          class="rounded-xl border border-border/40 divide-y bg-muted/10 overflow-hidden"
        >
          {#if customModels.length === 0}
            <div class="p-4 text-xs text-muted-foreground text-center">
              No custom models added yet. Click "Add Custom Model" above to
              configure your own OpenAI-compatible endpoint.
            </div>
          {:else}
            {#each customModels as m (m.id)}
              <div
                class="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors"
              >
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-xs text-foreground"
                      >{m.displayName}</span
                    >
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    >
                      <CircleCheck class="size-3" />
                      <span>Configured</span>
                    </span>
                  </div>
                  <div
                    class="flex items-center gap-3 text-[11px] font-mono text-muted-foreground"
                  >
                    <span>Model: {m.modelString}</span>
                    <span>•</span>
                    <span class="truncate max-w-50">{m.baseUrl}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  class="h-7 text-xs rounded-md gap-1 shrink-0"
                  onclick={() => handleDeleteCustomModel(m.id, m.displayName)}
                >
                  <Trash2 class="size-3" />
                </Button>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div
      transition:fade
      class="rounded-xl border border-border/40 p-4 bg-muted/10 text-xs text-muted-foreground flex items-center gap-3"
    >
      <Info class="size-4 text-primary shrink-0" />
      <span class="leading-relaxed"
        >Using <strong>Nota AI Server</strong> for inference. Toggle
        <em>"Let me use my own keys"</em> above to configure custom API keys for
        Google Gemini, OpenAI, Claude, DeepSeek, Kimi, or Custom endpoints.</span
      >
    </div>
  {/if}
</div>
