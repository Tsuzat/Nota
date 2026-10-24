<script lang="ts">
import CircleCheck from "@lucide/svelte/icons/circle-check";
import Cpu from "@lucide/svelte/icons/cpu";
import ExternalLink from "@lucide/svelte/icons/external-link";
import Eye from "@lucide/svelte/icons/eye";
import EyeOff from "@lucide/svelte/icons/eye-off";
import Info from "@lucide/svelte/icons/info";
import Key from "@lucide/svelte/icons/key";
import Loader2 from "@lucide/svelte/icons/loader-2";
import Pen from "@lucide/svelte/icons/pen";
import Plus from "@lucide/svelte/icons/plus";
import Save from "@lucide/svelte/icons/save";
import ShieldCheck from "@lucide/svelte/icons/shield-check";
import Sparkles from "@lucide/svelte/icons/sparkles";
import Trash2 from "@lucide/svelte/icons/trash-2";
import X from "@lucide/svelte/icons/x";
import type {
	CustomModelConfig,
	FetchedModel,
	PredefinedProviderName,
} from "@nota/ai";
import { getCuratedModelsForProvider, validateAndFetchModels } from "@nota/ai";
import { toast } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Checkbox } from "@nota/ui/shadcn/checkbox/index.js";
import { Input } from "@nota/ui/shadcn/input/index.js";
import * as Label from "@nota/ui/shadcn/label/index.js";
import * as Switch from "@nota/ui/shadcn/switch/index.js";
import { cn } from "@nota/ui/utils";
import { openUrl } from "@tauri-apps/plugin-opener";
import { onMount } from "svelte";
import { fade, slide } from "svelte/transition";
import { getAuthSession, getUserQuota } from "#lib/auth-session.svelte.js";
import { checkAppleIntelligenceAvailability } from "#lib/platform/apple-intelligence.js";
import { secureStorage } from "#lib/platform/securestorage.js";
import { ISDESKTOP } from "#lib/utils.js";
import { PUBLIC_NOTA_URL } from "$app/env/public";
import { getGlobalSettings } from "../constants.svelte";

const useSettings = getGlobalSettings();
const user = $derived(getAuthSession().data?.user);
const userQuota = getUserQuota();

function getAICredits() {
	if (!user || !userQuota.data?.aiCreditBalanceCents) return "0";
	const cents = Number(userQuota.data.aiCreditBalanceCents);
	if (Number.isNaN(cents)) return "0";
  return `${(cents/100).toFixed(2)}`
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
		id: "meta",
		label: "Meta Muse",
		docsUrl: "https://dev.meta.ai/api-keys",
		docName: "Meta AI",
	},
	{
		id: "openrouter",
		label: "OpenRouter",
		docsUrl: "https://openrouter.ai/keys",
		docName: "OpenRouter Platform",
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

// Models discovered and selected per provider
let providerModelsState = $state<
	Record<PredefinedProviderName, FetchedModel[]>
>({} as Record<PredefinedProviderName, FetchedModel[]>);
let selectedModelsState = $state<Record<PredefinedProviderName, string[]>>(
	{} as Record<PredefinedProviderName, string[]>,
);

// Apple Intelligence status state
let appleAIAvailable = $state<boolean | null>(null);
let appleAIReason = $state<string>("");

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
	if (ISDESKTOP) {
		await refreshState();
		const appleStatus = await checkAppleIntelligenceAvailability();
		appleAIAvailable = appleStatus.available;
		appleAIReason = appleStatus.reason;
	}
});

function handleOpenUrl(url: string) {
	if (ISDESKTOP) {
		openUrl(url);
	} else if (typeof window !== "undefined") {
		window.open(url, "_blank");
	}
}

async function refreshState() {
	const keyStatus: Record<string, boolean> = {};
	const modelsState: Record<string, FetchedModel[]> = {};
	const selectedState: Record<string, string[]> = {};

	for (const p of PRESET_PROVIDERS) {
		const key = await secureStorage.getItem(`${p.id}_api_key`);
		keyStatus[p.id] = !!key && key.trim().length > 0;

		modelsState[p.id] = getCuratedModelsForProvider(p.id);

		try {
			const saved = localStorage.getItem(`${p.id}_selected_models`);
			if (saved) {
				selectedState[p.id] = JSON.parse(saved);
			} else {
				selectedState[p.id] = modelsState[p.id].map((m) => m.id);
			}
		} catch {
			selectedState[p.id] = modelsState[p.id].map((m) => m.id);
		}
	}

	providerKeysState = keyStatus as Record<PredefinedProviderName, boolean>;
	providerModelsState = modelsState as Record<
		PredefinedProviderName,
		FetchedModel[]
	>;
	selectedModelsState = selectedState as Record<
		PredefinedProviderName,
		string[]
	>;

	try {
		const raw = localStorage.getItem("custom_ai_models");
		customModels = raw ? JSON.parse(raw) : [];
	} catch {
		customModels = [];
	}
}

async function startEditProviderKey(providerId: PredefinedProviderName) {
	editingProviderId = providerId;
	const existing = await secureStorage.getItem(`${providerId}_api_key`);
	providerKeyInput = existing || "";
	isValidatedProviderKey = !!existing && existing.trim().length > 0;
	showProviderKey = false;

	if (
		!providerModelsState[providerId] ||
		providerModelsState[providerId].length === 0
	) {
		providerModelsState[providerId] = getCuratedModelsForProvider(providerId);
	}
	if (!selectedModelsState[providerId]) {
		try {
			const saved = localStorage.getItem(`${providerId}_selected_models`);
			selectedModelsState[providerId] = saved
				? JSON.parse(saved)
				: providerModelsState[providerId].map((m) => m.id);
		} catch {
			selectedModelsState[providerId] = providerModelsState[providerId].map(
				(m) => m.id,
			);
		}
	}
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
		const res = await validateAndFetchModels({
			provider: providerId,
			apiKey: providerKeyInput.trim(),
		});

		if (res.valid) {
			isValidatedProviderKey = true;
			if (res.models && res.models.length > 0) {
				providerModelsState[providerId] = res.models;
				if (
					!selectedModelsState[providerId] ||
					selectedModelsState[providerId].length === 0
				) {
					selectedModelsState[providerId] = res.models.map((m) => m.id);
				}
			}
			toast.success(
				`Validated successfully! ${res.models?.length || 0} models available.`,
			);
		} else {
			toast.error(res.error || "Key validation failed.");
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : "Validation error";
		toast.error(msg);
	} finally {
		validatingProviderKey = false;
	}
}

function toggleModelSelection(
	providerId: PredefinedProviderName,
	modelId: string,
) {
	const current = selectedModelsState[providerId] || [];
	if (current.includes(modelId)) {
		selectedModelsState[providerId] = current.filter((id) => id !== modelId);
	} else {
		selectedModelsState[providerId] = [...current, modelId];
	}
}

function selectAllModels(providerId: PredefinedProviderName) {
	const available = providerModelsState[providerId] || [];
	selectedModelsState[providerId] = available.map((m) => m.id);
}

function deselectAllModels(providerId: PredefinedProviderName) {
	selectedModelsState[providerId] = [];
}

async function handleSavePresetKey(providerId: PredefinedProviderName) {
	if (!isValidatedProviderKey) {
		toast.error("Please validate your API key before saving.");
		return;
	}
	try {
		await secureStorage.setItem(
			`${providerId}_api_key`,
			providerKeyInput.trim(),
		);

		const selected = selectedModelsState[providerId] || [];
		localStorage.setItem(
			`${providerId}_selected_models`,
			JSON.stringify(selected),
		);

		toast.success(
			`${providerId.toUpperCase()} configuration saved with ${selected.length} active models.`,
		);
		editingProviderId = null;
		await refreshState();
	} catch {
		toast.error("Failed to store API key and model preferences.");
	}
}

async function handleRemovePresetKey(providerId: PredefinedProviderName) {
	try {
		await secureStorage.removeItem(`${providerId}_api_key`);
		localStorage.removeItem(`${providerId}_selected_models`);
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
		!customBaseUrl.trim()
	) {
		toast.error("Please fill in display name, model ID, and base URL.");
		return;
	}

	validatingCustom = true;
	isValidatedCustom = false;

	try {
		const res = await validateAndFetchModels({
			provider: "other",
			apiKey: customApiKey.trim() || "ollama",
			baseURL: customBaseUrl.trim(),
		});

		if (res.valid) {
			isValidatedCustom = true;
			toast.success("Custom endpoint connection verified!");
		} else {
			toast.error(res.error || "Could not connect to custom endpoint.");
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : "Validation failed";
		toast.error(msg);
	} finally {
		validatingCustom = false;
	}
}

async function handleSaveCustomModel() {
	if (!isValidatedCustom) {
		toast.error("Please test connection before saving.");
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

		if (customApiKey.trim()) {
			await secureStorage.setItem(`custom_${id}_api_key`, customApiKey.trim());
		}

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
    <h2 class="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
      <Sparkles class="size-5 text-amber-500" />
      <span>AI Settings</span>
    </h2>
    <span class="text-xs text-muted-foreground leading-snug">
      Configure AI writing assistants, inference providers, and models.
    </span>
  </div>

  <!-- Section 1: General & Master Switch -->
  <div class="space-y-2">
    <h3 class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-0.5">
      General
    </h3>
    <div class="rounded-xl border border-border/40 divide-y bg-muted/10">
      <!-- Master Switch -->
      <div class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20">
        <div class="space-y-0.5 min-w-0 pr-4">
          <div class="flex items-center gap-2">
            <Label.Root for="use-ai" class="font-medium text-sm text-foreground cursor-pointer">
              Enable AI Capabilities
            </Label.Root>
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
          <span class="text-xs text-muted-foreground mt-0.5 leading-snug">
            Toggle AI inline generation, writing assistant, and smart commands.
          </span>
        </div>
        <Switch.Root id="use-ai" bind:checked={useSettings.useAI} />
      </div>

      <!-- Credits Balance (Nota Server) -->
      <div class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20">
        <div class="space-y-0.5 min-w-0 pr-4">
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm text-foreground">Nota AI Credits</span>
            <span class="font-mono text-xs font-semibold text-foreground bg-background px-2 py-0.5 rounded border border-border/50 tabular-nums">
              ${getAICredits()}
            </span>
          </div>
          <span class="text-xs text-muted-foreground mt-0.5 leading-snug">
            Used for server-side inference. Credits never expire.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          class="gap-1.5 font-medium text-xs h-8 rounded-lg shrink-0"
          onclick={() => handleOpenUrl(`${PUBLIC_NOTA_URL}#pricing`)}
        >
          <Plus class="size-3.5" />
          <span>Buy Credits</span>
        </Button>
      </div>
    </div>
  </div>

  <!-- Section 2: AI Inference Provider Selection (Desktop only) -->
  {#if ISDESKTOP}
    <div class="space-y-2">
      <h3 class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-0.5">
        Inference Provider
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <!-- Option 1: Nota Server -->
        <button
          type="button"
          onclick={() => (useSettings.aiMode = "nota")}
          class={cn(
            "flex flex-col text-left p-3.5 rounded-xl border transition-all relative cursor-pointer",
            useSettings.aiMode === "nota"
              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
              : "border-border/50 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:border-border",
          )}
        >
          <div class="flex items-center justify-between w-full mb-1">
            <div class="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <Sparkles class="size-3.5 text-amber-500" />
              <span>Nota Server</span>
            </div>
            <span class="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Hosted
            </span>
          </div>
          <span class="text-[11px] text-muted-foreground leading-snug">
            Zero setup. Uses hosted Nota account credits.
          </span>
        </button>

        <!-- Option 2: Apple Intelligence (macOS) -->
        <button
          type="button"
          onclick={() => (useSettings.aiMode = "apple")}
          class={cn(
            "flex flex-col text-left p-3.5 rounded-xl border transition-all relative cursor-pointer",
            useSettings.aiMode === "apple"
              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
              : "border-border/50 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:border-border",
          )}
        >
          <div class="flex items-center justify-between w-full mb-1">
            <div class="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <Cpu class="size-3.5 text-emerald-500" />
              <span>Apple Intelligence</span>
            </div>
            <span
              class={cn(
                "text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border",
                appleAIAvailable
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border",
              )}
            >
              {appleAIAvailable ? "Ready" : "macOS"}
            </span>
          </div>
          <span class="text-[11px] text-muted-foreground leading-snug">
            On-device & Private Cloud. 100% private, no keys.
          </span>
        </button>

        <!-- Option 3: BYOK (Bring Your Own Key) -->
        <button
          type="button"
          onclick={() => (useSettings.aiMode = "byok")}
          class={cn(
            "flex flex-col text-left p-3.5 rounded-xl border transition-all relative cursor-pointer",
            useSettings.aiMode === "byok"
              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
              : "border-border/50 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:border-border",
          )}
        >
          <div class="flex items-center justify-between w-full mb-1">
            <div class="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <Key class="size-3.5 text-primary" />
              <span>Custom Keys</span>
            </div>
            <span class="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
              BYOK
            </span>
          </div>
          <span class="text-[11px] text-muted-foreground leading-snug">
            Connect personal API keys with model control.
          </span>
        </button>
      </div>
    </div>

    <!-- Apple Intelligence Dedicated Configuration -->
    {#if useSettings.aiMode === "apple"}
      <div transition:slide={{ duration: 180 }} class="rounded-xl border border-border/40 p-4 bg-muted/10 space-y-3.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Cpu class="size-4 text-emerald-500" />
            <span class="font-semibold text-sm text-foreground">Apple Intelligence</span>
          </div>
          <span
            class={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
              appleAIAvailable
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20",
            )}
          >
            {#if appleAIAvailable}
              <CircleCheck class="size-3" />
              <span>Available on this Mac</span>
            {:else}
              <Info class="size-3" />
              <span>{appleAIReason || "Checking availability..."}</span>
            {/if}
          </span>
        </div>

        <span class="text-xs text-muted-foreground leading-relaxed">
          Powered natively by macOS Foundation Models and Apple Private Cloud Compute. All prompts and notes remain completely private, running on-device or on end-to-end encrypted Apple Silicon servers.
        </span>

        <!-- Model Choice -->
        <div class="pt-2 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onclick={() => {
              useSettings.aiProvider = "apple-on-device";
              toast.success("Default model set to Apple Intelligence (On-Device)");
            }}
            class={cn(
              "p-3 rounded-lg border text-left transition-all cursor-pointer",
              useSettings.aiProvider === "apple-on-device"
                ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                : "border-border/50 bg-background/50 hover:bg-muted/30 text-muted-foreground",
            )}
          >
            <div class="flex items-center justify-between font-medium text-xs text-foreground">
              <div class="flex items-center gap-1.5">
                <span>On-Device Model</span>
                <span class="text-[9px] font-semibold px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                  Recommended
                </span>
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/50">
                ~4k Context
              </span>
            </div>
            <span class="text-[11px] text-muted-foreground mt-1 leading-snug">
              Fastest on-device response. Runs 100% locally on Apple Silicon without any keys or network needed.
            </span>
          </button>

          <button
            type="button"
            onclick={() => {
              useSettings.aiProvider = "apple-private-cloud";
              toast.success("Default model set to Apple Intelligence (Private Cloud)");
            }}
            class={cn(
              "p-3 rounded-lg border text-left transition-all cursor-pointer",
              useSettings.aiProvider === "apple-private-cloud"
                ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                : "border-border/50 bg-background/50 hover:bg-muted/30 text-muted-foreground",
            )}
          >
            <div class="flex items-center justify-between font-medium text-xs text-foreground">
              <span>Private Cloud Compute</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/50">
                ~32k Context
              </span>
            </div>
            <span class="text-[11px] text-muted-foreground mt-1 leading-snug">
              Expanded context for complex notes. Requires Apple PCC entitlement; automatically falls back to on-device if cloud assets are unprovisioned.
            </span>
          </button>
        </div>
      </div>
    {/if}

    <!-- BYOK Configuration Section -->
    {#if useSettings.aiMode === "byok"}
      <div transition:slide={{ duration: 200 }} class="space-y-5 pt-1">
        <!-- Preset Providers List -->
        <div class="space-y-2">
          <div class="space-y-0.5 px-0.5">
            <h3 class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Preset AI Providers
            </h3>
            <span class="text-xs text-muted-foreground">
              Validate your API key to discover models, then select which models you want enabled in the editor.
            </span>
          </div>

          <div class="rounded-xl border border-border/40 divide-y bg-muted/10 overflow-hidden">
            {#each PRESET_PROVIDERS as provider (provider.id)}
              {@const isConfigured = providerKeysState[provider.id]}
              {@const isEditing = editingProviderId === provider.id}
              {@const modelsCount = selectedModelsState[provider.id]?.length ?? 0}

              <div class="p-3.5 transition-colors hover:bg-muted/20 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5 min-w-0 pr-2">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm text-foreground">
                        {provider.label}
                      </span>
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
                          <span>Configured ({modelsCount} {modelsCount === 1 ? "model" : "models"})</span>
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
                        onclick={cancelEditProviderKey}
                      >
                        Cancel
                      </Button>
                    {:else if isConfigured}
                      <Button
                        size="sm"
                        variant="outline"
                        onclick={() => startEditProviderKey(provider.id)}
                      >
                        <Pen class="size-3" />
                        <span>Manage Models</span>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="destructive"
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

                <!-- Inline Edit Form with Model Selection Checkboxes -->
                {#if isEditing}
                  <div
                    transition:slide={{ duration: 150 }}
                    class="pt-2 border-t border-border/30 space-y-3"
                  >
                    <!-- Key Input -->
                    <div class="space-y-1">
                      <Label.Root class="text-xs font-medium text-muted-foreground">
                        API Key for {provider.label}
                      </Label.Root>
                      <div class="relative flex items-center">
                        <Input
                          type={showProviderKey ? "text" : "password"}
                          placeholder={`Enter ${provider.label} API Key`}
                          bind:value={providerKeyInput}
                          class="bg-background border-border/70 h-9 pr-10 font-mono text-xs rounded-lg"
                        />
                        <button
                          type="button"
                          class="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
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

                    <!-- Validation Action -->
                    <div class="flex items-center justify-between pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        class={cn(
                          "gap-1 text-xs h-7.5 rounded-md",
                          isValidatedProviderKey &&
                            "border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
                        )}
                        disabled={validatingProviderKey || !providerKeyInput.trim()}
                        onclick={() => handleValidatePresetKey(provider.id)}
                      >
                        {#if validatingProviderKey}
                          <BarSpinner size={10} />
                          <span>Validating & Discovering...</span>
                        {:else if isValidatedProviderKey}
                          <CircleCheck class="size-3 text-emerald-600" />
                          <span>Key Validated</span>
                        {:else}
                          <ShieldCheck class="size-3" />
                          <span>Validate & Fetch Models</span>
                        {/if}
                      </Button>

                      {#if isValidatedProviderKey}
                        <div class="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onclick={() => selectAllModels(provider.id)}
                          >
                            Select All
                          </Button>
                          <span class="text-muted-foreground text-xs">•</span>
                          <Button
                            variant="ghost"
                            size="xs"
                            onclick={() => deselectAllModels(provider.id)}
                          >
                            Deselect All
                          </Button>
                        </div>
                      {/if}
                    </div>

                    <!-- Available Models Checkbox List -->
                    {#if isValidatedProviderKey && providerModelsState[provider.id]?.length > 0}
                      <div transition:slide={{ duration: 150 }} class="space-y-1.5 pt-2">
                        <Label.Root class="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>Available Models</span>
                          <span class="text-[10px] text-muted-foreground">
                            {selectedModelsState[provider.id]?.length || 0} of {providerModelsState[provider.id].length} enabled
                          </span>
                        </Label.Root>

                        <div class="max-h-56 overflow-y-auto rounded-lg border border-border/50 divide-y divide-border/30 bg-background/50 p-1">
                          {#each providerModelsState[provider.id] as model (model.id)}
                            {@const isSelected = selectedModelsState[provider.id]?.includes(model.id)}
                            <label
                              class={cn(
                                "flex items-start gap-2.5 p-2 rounded transition-colors cursor-pointer hover:bg-muted/40",
                                isSelected && "bg-muted/20",
                              )}
                            >
                              <div class="pt-0.5">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleModelSelection(provider.id, model.id)}
                                />
                              </div>
                              <div class="space-y-0.5 min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                  <span class="font-medium text-xs text-foreground">
                                    {model.displayName || model.id}
                                  </span>
                                  {#if model.contextWindow}
                                    <span class="text-[10px] font-mono text-muted-foreground">
                                      {(model.contextWindow / 1000).toFixed(0)}k ctx
                                    </span>
                                  {/if}
                                </div>
                                <div class="text-[11px] font-mono text-muted-foreground truncate">
                                  {model.id}
                                </div>
                                {#if model.description}
                                  <p class="text-[10px] text-muted-foreground/80 line-clamp-1">
                                    {model.description}
                                  </p>
                                {/if}
                              </div>
                            </label>
                          {/each}
                        </div>
                      </div>
                    {/if}

                    <!-- Save Action -->
                    <div class="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        class="gap-1 text-xs h-8 rounded-md"
                        disabled={!isValidatedProviderKey}
                        onclick={() => handleSavePresetKey(provider.id)}
                      >
                        <Save class="size-3" />
                        <span>Save Configuration</span>
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
            <div class="space-y-0.5">
              <h3 class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Custom OpenAI-Compatible Models
              </h3>
              <span class="text-xs text-muted-foreground">
                Connect local Ollama, LM Studio, vLLM, or private OpenAI-compatible endpoints.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onclick={() => {
                showAddCustomModal = !showAddCustomModal;
                if (showAddCustomModal) resetCustomForm();
              }}
            >
              {#if showAddCustomModal}
                <X class="size-3.5" />
                <span>Cancel</span>
              {:else}
                <Plus class="size-3.5" />
                <span>Add Endpoint</span>
              {/if}
            </Button>
          </div>

          <!-- Add Custom Model Form -->
          {#if showAddCustomModal}
            <div
              transition:slide={{ duration: 180 }}
              class="rounded-xl border border-primary/30 p-4 bg-primary/5 space-y-3"
            >
              <div class="space-y-0.5">
                <h4 class="font-semibold text-sm text-foreground">
                  Add Custom OpenAI-Compatible Model
                </h4>
                <span class="text-xs text-muted-foreground leading-snug">
                  Provide the API base URL and model name for inference.
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div class="space-y-1">
                  <Label.Root class="text-xs font-medium text-muted-foreground">
                    Display Name
                  </Label.Root>
                  <Input
                    placeholder="e.g. Local Ollama Llama 3"
                    bind:value={customDisplayName}
                    class="bg-background border-border/70 h-8.5 text-xs rounded-lg"
                  />
                </div>

                <div class="space-y-1">
                  <Label.Root class="text-xs font-medium text-muted-foreground">
                    Model Identifier
                  </Label.Root>
                  <Input
                    placeholder="e.g. llama3 or mistral-7b"
                    bind:value={customModelString}
                    class="bg-background border-border/70 h-8.5 font-mono text-xs rounded-lg"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <Label.Root class="text-xs font-medium text-muted-foreground">
                  Base URL
                </Label.Root>
                <Input
                  placeholder="e.g. http://localhost:11434/v1"
                  bind:value={customBaseUrl}
                  class="bg-background border-border/70 h-8.5 font-mono text-xs rounded-lg"
                />
              </div>

              <div class="space-y-1">
                <Label.Root class="text-xs font-medium text-muted-foreground">
                  API Key (Optional for local models)
                </Label.Root>
                <div class="relative flex items-center">
                  <Input
                    type={showCustomApiKey ? "text" : "password"}
                    placeholder="API key or 'ollama'"
                    bind:value={customApiKey}
                    class="bg-background border-border/70 h-8.5 pr-10 font-mono text-xs rounded-lg"
                  />
                  <button
                    type="button"
                    class="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
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
                      "border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
                  )}
                  disabled={validatingCustom || !customBaseUrl.trim() || !customModelString.trim()}
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
                  <span>Save Endpoint</span>
                </Button>
              </div>
            </div>
          {/if}

          <!-- List of Configured Custom Models -->
          <div class="rounded-xl border border-border/40 divide-y bg-muted/10 overflow-hidden">
            {#if customModels.length === 0}
              <div class="p-4 text-xs text-muted-foreground text-center">
                No custom endpoints configured yet. Click "Add Endpoint" above to connect Ollama, LM Studio, or vLLM.
              </div>
            {:else}
              {#each customModels as m (m.id)}
                <div class="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-xs text-foreground">
                        {m.displayName}
                      </span>
                      <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CircleCheck class="size-3" />
                        <span>Ready</span>
                      </span>
                    </div>
                    <div class="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
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
    {:else if useSettings.aiMode === "nota"}
      <div
        transition:fade
        class="rounded-xl border border-border/40 p-4 bg-muted/10 text-xs text-muted-foreground flex items-center gap-3"
      >
        <Info class="size-4 text-primary shrink-0" />
        <span class="leading-relaxed">
          Using <strong>Nota AI Server</strong> for inference. All AI commands will consume your Nota credits balance. You can switch to <strong>Apple Intelligence</strong> or <strong>Custom Keys (BYOK)</strong> above anytime.
        </span>
      </div>
    {/if}
  {:else}
    <!-- Web fallback notification -->
    <div
      transition:fade
      class="rounded-xl border border-border/40 p-4 bg-muted/10 text-xs text-muted-foreground flex items-center gap-3"
    >
      <Info class="size-4 text-primary shrink-0" />
      <span class="leading-relaxed">
        Using <strong>Nota AI Server</strong> for hosted inference. To use on-device <strong>Apple Intelligence</strong> or connect your own API keys (BYOK), please use the <strong>Nota Desktop App</strong>.
      </span>
    </div>
  {/if}
</div>
