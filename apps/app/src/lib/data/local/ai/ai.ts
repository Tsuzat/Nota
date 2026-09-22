import {
	type AIProvider,
	type CustomModelConfig,
	callAI as callAIClient,
	LATEST_MODELS,
	type PredefinedProviderName,
	type SelectableModel,
} from "@nota/ai";
import { mode } from "@nota/ui";
import { fetch as fetchTauri } from "@tauri-apps/plugin-http";
import { streamAppleIntelligence } from "#lib/platform/apple-intelligence.ts";
import { secureStorage } from "#lib/platform/securestorage.ts";
import { ISDESKTOP } from "#lib/utils.ts";
import { PUBLIC_SERVER_URL } from "$app/env/public";

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
 * When `aiMode === "apple"`, Apple Intelligence Foundation models are returned.
 * When `aiMode === "byok"`, only models whose provider has a stored API
 * key and is enabled via user checkboxes (plus custom endpoints) are returned.
 * Otherwise all predefined models are returned for Nota-Server inference.
 */
export async function getUserModels(): Promise<SelectableModel[]> {
	const aiMode =
		localStorage.getItem("ai_mode") ||
		(localStorage.getItem("useOwnKeys") === "true" ? "byok" : "nota");
	const models: SelectableModel[] = [];

	if (aiMode === "apple" && ISDESKTOP) {
		models.push(
			{
				id: "apple-on-device",
				displayName: "Apple Intelligence (On-Device)",
				provider: "apple",
				providerIcon:
					mode.current === "dark"
						? "https://svgl.app/library/apple_dark.svg"
						: "https://svgl.app/library/apple.svg",
				modelString: "apple-on-device",
				contextWindow: 4096,
				notes:
					"Native on-device Foundation Model. 100% private, free, no keys needed.",
				isCustom: false,
			},
			{
				id: "apple-private-cloud",
				displayName: "Apple Intelligence (Private Cloud)",
				provider: "apple",
				providerIcon:
					mode.current === "dark"
						? "https://svgl.app/library/apple_dark.svg"
						: "https://svgl.app/library/apple.svg",
				modelString: "apple-private-cloud",
				contextWindow: 32768,
				notes:
					"Apple Private Cloud Compute reasoning model for larger contexts.",
				isCustom: false,
			},
		);
		return models;
	}

	if (aiMode === "byok" && ISDESKTOP) {
		for (const provider of PROVIDERS) {
			const key = await secureStorage.getItem(`${provider}_api_key`);
			if (!key?.trim()) continue;

			// Read user-selected model IDs for this provider
			let selectedIds: string[] | null = null;
			try {
				const raw = localStorage.getItem(`${provider}_selected_models`);
				if (raw) selectedIds = JSON.parse(raw);
			} catch {
				selectedIds = null;
			}

			const { icon, models: providerModels } = LATEST_MODELS[provider];
			for (const [id, pricing] of Object.entries(providerModels)) {
				// If user has specific checkboxes selected, filter by them
				if (
					selectedIds &&
					!selectedIds.includes(id) &&
					!selectedIds.includes(pricing.modelString)
				) {
					continue;
				}
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
 * Helper to fetch from Nota Server via SSE
 */
async function fetchNotaServerAI(
	prompt: string,
	noteId: string | undefined,
	onChunk: (chunk: string) => void,
	onError: (error: Error) => void,
) {
	try {
		const url = `${PUBLIC_SERVER_URL}/api/ai/complete`;
		const body = JSON.stringify({ prompt, noteId });
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		let response: Response;

		if (ISDESKTOP) {
			const token = await secureStorage.getItem("access_token");
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
			response = await fetchTauri(url, {
				method: "POST",
				headers,
				body,
			});
		} else {
			response = await fetch(url, {
				method: "POST",
				headers,
				body,
				credentials: "include",
			});
		}

		if (!response.ok) {
			const errData = await response.json().catch(() => ({}));
			throw new Error(
				errData.error || `Server responded with ${response.status}`,
			);
		}

		if (!response.body) throw new Error("No response body");

		// SSE reading
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			// Normalize CRLF to LF for consistent block splitting
			const normalized = buffer.replace(/\r\n/g, "\n");
			const blocks = normalized.split("\n\n");

			// The last element is either an empty string (if it ended with \n\n)
			// or an incomplete chunk. Pop it and keep it in the buffer.
			buffer = blocks.pop() || "";

			for (const block of blocks) {
				if (!block) continue;
				const blockLines = block.split("\n");
				let event = "message";
				const dataLines: string[] = [];
				for (const line of blockLines) {
					if (line.startsWith("event:")) {
						event = line.startsWith("event: ")
							? line.substring(7).trim()
							: line.substring(6).trim();
					} else if (line.startsWith("data:")) {
						// Per SSE standard: if line starts with 'data: ', strip only the single leading space
						const dataVal = line.startsWith("data: ")
							? line.substring(6)
							: line.substring(5);
						dataLines.push(dataVal);
					}
				}

				const data = dataLines.join("\n");
				if (event === "delta") {
					onChunk(data);
				} else if (event === "error") {
					throw new Error(data);
				}
			}
		}
	} catch (e) {
		console.error(e);
		onError(e instanceof Error ? e : new Error("Unknown error"));
	}
}

/**
 * Stream AI-generated text for the given prompt using the user's currently
 * selected model and provider configuration.
 */
export async function callAI(
	prompt: string,
	onChunk: (chunk: string) => void,
	onError: (error: Error) => void,
	noteId?: string,
): Promise<void> {
	try {
		const aiMode =
			localStorage.getItem("ai_mode") ||
			(localStorage.getItem("useOwnKeys") === "true" ? "byok" : "nota");
		const selectedModelId =
			localStorage.getItem("ai_provider") || "gpt-5.6-luna";

		if (
			ISDESKTOP &&
			(aiMode === "apple" || selectedModelId.startsWith("apple-"))
		) {
			await streamAppleIntelligence(prompt, onChunk, onError, {
				model:
					selectedModelId === "apple-private-cloud"
						? "private-cloud"
						: "on-device",
			});
			return;
		}

		if (
			ISDESKTOP &&
			(aiMode === "byok" || localStorage.getItem("useOwnKeys") === "true")
		) {
			const providerConfig = await resolveProviderConfig(selectedModelId);

			const result = callAIClient({ provider: providerConfig, prompt });

			for await (const chunk of result.textStream) {
				onChunk(chunk);
			}
		} else {
			// Web or (Desktop in Nota Server mode)
			await fetchNotaServerAI(prompt, noteId, onChunk, onError);
		}
	} catch (e: unknown) {
		console.error(e);
		onError(e instanceof Error ? e : new Error("Unknown error"));
	}
}
