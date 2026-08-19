import {
	type AIProvider,
	type CustomModelConfig,
	callAI as callAIClient,
	LATEST_MODELS,
	type PredefinedProviderName,
	type SelectableModel,
} from "@nota/ai";
import { secureStorage } from "#lib/platform/securestorage.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read user-configured custom models from localStorage. */
function getCustomModels(): CustomModelConfig[] {
	try {
		const raw = localStorage.getItem("custom_ai_models");
		return raw ? (JSON.parse(raw) as CustomModelConfig[]) : [];
	} catch {
		return [];
	}
}

/** Convert a predefined provider's model entry into a SelectableModel. */
function toSelectableModel(
	provider: PredefinedProviderName,
	modelId: string,
	pricing: (typeof LATEST_MODELS)[PredefinedProviderName]["models"][string],
	icon: (typeof LATEST_MODELS)[PredefinedProviderName]["icon"],
): SelectableModel {
	return {
		id: modelId,
		provider,
		providerIcon: icon,
		displayName: pricing.displayName,
		modelString: pricing.modelString,
		contextWindow: pricing.contextWindow,
		maxOutputTokens: pricing.maxOutputTokens,
		inputCostPerMillion: pricing.inputCostPerMillion,
		outputCostPerMillion: pricing.outputCostPerMillion,
		cachedInputCostPerMillion: pricing.cachedInputCostPerMillion,
		notes: pricing.notes,
		isCustom: false,
	};
}

const PROVIDERS = Object.keys(LATEST_MODELS) as PredefinedProviderName[];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the list of AI models currently available to the user.
 *
 * When `useOwnKeys` is enabled, only models whose provider has a stored API
 * key (plus any custom endpoints) are returned. Otherwise all predefined
 * models are returned (for future Nota-Server-based inference).
 */
export async function getUserModels(): Promise<SelectableModel[]> {
	const useOwnKeys = localStorage.getItem("useOwnKeys") === "true";
	const models: SelectableModel[] = [];

	if (useOwnKeys) {
		for (const provider of PROVIDERS) {
			const key = await secureStorage.getItem(`${provider}_api_key`);
			if (!key?.trim()) continue;

			const { icon, models: providerModels } = LATEST_MODELS[provider];
			for (const [id, pricing] of Object.entries(providerModels)) {
				models.push(toSelectableModel(provider, id, pricing, icon));
			}
		}

		// Append custom (OpenAI-compatible) models
		for (const custom of getCustomModels()) {
			models.push({
				id: custom.id,
				provider: "other",
				displayName: custom.displayName,
				modelString: custom.modelString,
				contextWindow: custom.contextWindow ?? 0,
				isCustom: true,
			});
		}
	} else {
		// Nota-Server mode — show all predefined models
		for (const provider of PROVIDERS) {
			const { icon, models: providerModels } = LATEST_MODELS[provider];
			for (const [id, pricing] of Object.entries(providerModels)) {
				models.push(toSelectableModel(provider, id, pricing, icon));
			}
		}
	}

	return models;
}

/**
 * Resolve the selected model into an `AIProvider` config by looking up the
 * model ID in custom endpoints first, then in `LATEST_MODELS`.
 */
async function resolveProviderConfig(
	selectedModelId: string,
): Promise<AIProvider> {
	// 1. Check custom models
	const customModels = getCustomModels();
	const customMatch = customModels.find(
		(m) => m.id === selectedModelId || m.modelString === selectedModelId,
	);
	if (customMatch) {
		const apiKey = await secureStorage.getItem(
			`custom_${customMatch.id}_api_key`,
		);
		if (!apiKey) throw new Error("Missing API key for custom model.");
		return {
			provider: "other",
			name: customMatch.displayName,
			modelId: customMatch.modelString,
			apiKey,
			baseURL: customMatch.baseUrl,
		};
	}

	// 2. Check predefined providers
	for (const provider of PROVIDERS) {
		const providerData = LATEST_MODELS[provider];
		const directMatch = providerData.models[selectedModelId];
		const stringMatch = Object.values(providerData.models).find(
			(m) => m.modelString === selectedModelId,
		);

		if (directMatch || stringMatch) {
			const modelString = (directMatch ?? stringMatch)?.modelString;
			const apiKey = await secureStorage.getItem(`${provider}_api_key`);
			if (!apiKey)
				throw new Error(`Missing API key for provider: ${provider}.`);
			return { provider, modelId: modelString, apiKey };
		}
	}

	throw new Error(`Could not find configuration for model: ${selectedModelId}`);
}

/**
 * Stream AI-generated text for the given prompt using the user's currently
 * selected model and provider configuration.
 */
export async function callAI(
	prompt: string,
	onChunk: (chunk: string) => void,
	onError: (error: Error) => void,
): Promise<void> {
	try {
		const useOwnKeys = localStorage.getItem("useOwnKeys") === "true";
		if (!useOwnKeys) {
			throw new Error("Nota Server inference is not yet implemented.");
		}

		const selectedModelId =
			localStorage.getItem("ai_provider") || "gpt-5.6-luna";
		const providerConfig = await resolveProviderConfig(selectedModelId);

		const result = callAIClient({ provider: providerConfig, prompt });

		for await (const chunk of result.textStream) {
			onChunk(chunk);
		}
	} catch (e) {
		console.error(e);
		onError(e instanceof Error ? e : new Error("Unknown error"));
	}
}
