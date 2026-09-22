import { LATEST_MODELS } from "./models";
import type {
	FetchedModel,
	PredefinedProviderName,
	ValidateKeyOptions,
	ValidateKeyResult,
} from "./types";

/**
 * Returns curated fallback models for a predefined provider.
 */
export function getCuratedModelsForProvider(
	provider: PredefinedProviderName,
): FetchedModel[] {
	const config = LATEST_MODELS[provider];
	if (!config?.models) return [];

	return Object.entries(config.models).map(([key, m]) => ({
		id: m.modelString || key,
		displayName: m.displayName || key,
		description: m.notes,
		contextWindow: m.contextWindow,
	}));
}

/**
 * Validates an API key for an AI provider and fetches the available models.
 */
export async function validateAndFetchModels(
	options: ValidateKeyOptions,
): Promise<ValidateKeyResult> {
	const { provider, apiKey, baseURL } = options;
	const trimmedKey = apiKey.trim();

	if (!trimmedKey) {
		return { valid: false, error: "API key cannot be empty", models: [] };
	}

	try {
		switch (provider) {
			case "openai": {
				const res = await fetch("https://api.openai.com/v1/models", {
					headers: { Authorization: `Bearer ${trimmedKey}` },
				});
				if (res.status === 401 || res.status === 403) {
					return { valid: false, error: "Invalid OpenAI API key", models: [] };
				}
				if (!res.ok) {
					throw new Error(`OpenAI API error (${res.status})`);
				}
				const data = (await res.json()) as { data: Array<{ id: string }> };
				const curated = LATEST_MODELS.openai.models;
				const chatModels = data.data
					.filter(
						(m) =>
							m.id.startsWith("gpt-") ||
							m.id.startsWith("o1") ||
							m.id.startsWith("o3") ||
							m.id.startsWith("chatgpt-"),
					)
					.map((m) => ({
						id: m.id,
						displayName: curated[m.id]?.displayName ?? m.id,
						description: curated[m.id]?.notes,
						contextWindow: curated[m.id]?.contextWindow,
					}))
					.sort((a, b) => a.id.localeCompare(b.id));

				return {
					valid: true,
					models:
						chatModels.length > 0
							? chatModels
							: getCuratedModelsForProvider("openai"),
				};
			}

			case "google": {
				const res = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`,
				);
				if (res.status === 400 || res.status === 401 || res.status === 403) {
					return {
						valid: false,
						error: "Invalid Google Gemini API key",
						models: [],
					};
				}
				if (!res.ok) {
					throw new Error(`Google API error (${res.status})`);
				}
				const data = (await res.json()) as {
					models: Array<{
						name: string;
						displayName?: string;
						description?: string;
						inputTokenLimit?: number;
						supportedGenerationMethods?: string[];
					}>;
				};
				const curated = LATEST_MODELS.google.models;
				const models: FetchedModel[] = (data.models || [])
					.filter((m) =>
						m.supportedGenerationMethods?.includes("generateContent"),
					)
					.map((m) => {
						const cleanId = m.name.replace(/^models\//, "");
						return {
							id: cleanId,
							displayName:
								m.displayName || curated[cleanId]?.displayName || cleanId,
							description: m.description || curated[cleanId]?.notes,
							contextWindow:
								m.inputTokenLimit || curated[cleanId]?.contextWindow,
						};
					});

				return {
					valid: true,
					models:
						models.length > 0 ? models : getCuratedModelsForProvider("google"),
				};
			}

			case "anthropic": {
				// Attempt Anthropic's models endpoint
				try {
					const res = await fetch("https://api.anthropic.com/v1/models", {
						headers: {
							"x-api-key": trimmedKey,
							"anthropic-version": "2023-06-01",
						},
					});
					if (res.status === 401 || res.status === 403) {
						return {
							valid: false,
							error: "Invalid Anthropic API key",
							models: [],
						};
					}
					if (res.ok) {
						const data = (await res.json()) as {
							data: Array<{ id: string; display_name?: string }>;
						};
						const curated = LATEST_MODELS.anthropic.models;
						const models: FetchedModel[] = (data.data || []).map((m) => ({
							id: m.id,
							displayName: m.display_name || curated[m.id]?.displayName || m.id,
							description: curated[m.id]?.notes,
							contextWindow: curated[m.id]?.contextWindow,
						}));
						if (models.length > 0) {
							return { valid: true, models };
						}
					}
				} catch {
					// Fall through to curated fallback if models endpoint is blocked
				}
				return {
					valid: true,
					models: getCuratedModelsForProvider("anthropic"),
				};
			}

			case "deepseek": {
				const res = await fetch("https://api.deepseek.com/models", {
					headers: { Authorization: `Bearer ${trimmedKey}` },
				});
				if (res.status === 401 || res.status === 403) {
					return {
						valid: false,
						error: "Invalid DeepSeek API key",
						models: [],
					};
				}
				if (!res.ok) {
					throw new Error(`DeepSeek API error (${res.status})`);
				}
				const data = (await res.json()) as { data: Array<{ id: string }> };
				const curated = LATEST_MODELS.deepseek.models;
				const models = (data.data || []).map((m) => ({
					id: m.id,
					displayName: curated[m.id]?.displayName || m.id,
					description: curated[m.id]?.notes,
					contextWindow: curated[m.id]?.contextWindow,
				}));

				return {
					valid: true,
					models:
						models.length > 0
							? models
							: getCuratedModelsForProvider("deepseek"),
				};
			}

			case "kimi": {
				const res = await fetch("https://api.moonshot.cn/v1/models", {
					headers: { Authorization: `Bearer ${trimmedKey}` },
				});
				if (res.status === 401 || res.status === 403) {
					return { valid: false, error: "Invalid Kimi API key", models: [] };
				}
				if (!res.ok) {
					throw new Error(`Kimi API error (${res.status})`);
				}
				const data = (await res.json()) as { data: Array<{ id: string }> };
				const curated = LATEST_MODELS.kimi.models;
				const models = (data.data || []).map((m) => ({
					id: m.id,
					displayName: curated[m.id]?.displayName || m.id,
					description: curated[m.id]?.notes,
					contextWindow: curated[m.id]?.contextWindow,
				}));

				return {
					valid: true,
					models:
						models.length > 0 ? models : getCuratedModelsForProvider("kimi"),
				};
			}

			case "openrouter": {
				const res = await fetch("https://openrouter.ai/api/v1/models", {
					headers: { Authorization: `Bearer ${trimmedKey}` },
				});
				if (res.status === 401 || res.status === 403) {
					return {
						valid: false,
						error: "Invalid OpenRouter API key",
						models: [],
					};
				}
				if (!res.ok) {
					throw new Error(`OpenRouter API error (${res.status})`);
				}
				const data = (await res.json()) as {
					data: Array<{
						id: string;
						name?: string;
						description?: string;
						context_length?: number;
					}>;
				};
				const curated = LATEST_MODELS.openrouter.models;
				const models: FetchedModel[] = (data.data || []).map((m) => ({
					id: m.id,
					displayName: m.name || curated[m.id]?.displayName || m.id,
					description: m.description || curated[m.id]?.notes,
					contextWindow: m.context_length || curated[m.id]?.contextWindow,
				}));

				return {
					valid: true,
					models:
						models.length > 0
							? models
							: getCuratedModelsForProvider("openrouter"),
				};
			}

			case "meta": {
				try {
					const res = await fetch("https://api.meta.ai/v1/models", {
						headers: { Authorization: `Bearer ${trimmedKey}` },
					});
					if (res.status === 401 || res.status === 403) {
						return { valid: false, error: "Invalid Meta API key", models: [] };
					}
					if (res.ok) {
						const data = (await res.json()) as { data: Array<{ id: string }> };
						const curated = LATEST_MODELS.meta.models;
						const models = (data.data || []).map((m) => ({
							id: m.id,
							displayName: curated[m.id]?.displayName || m.id,
							description: curated[m.id]?.notes,
							contextWindow: curated[m.id]?.contextWindow,
						}));
						if (models.length > 0) {
							return { valid: true, models };
						}
					}
				} catch {
					// Fall through to curated models
				}
				return { valid: true, models: getCuratedModelsForProvider("meta") };
			}

			case "grok": {
				const res = await fetch("https://api.x.ai/v1/models", {
					headers: { Authorization: `Bearer ${trimmedKey}` },
				});
				if (res.status === 401 || res.status === 403) {
					return {
						valid: false,
						error: "Invalid Grok (xAI) API key",
						models: [],
					};
				}
				if (!res.ok) {
					throw new Error(`xAI API error (${res.status})`);
				}
				const data = (await res.json()) as { data: Array<{ id: string }> };
				const curated = LATEST_MODELS.grok.models;
				const models = (data.data || []).map((m) => ({
					id: m.id,
					displayName: curated[m.id]?.displayName || m.id,
					description: curated[m.id]?.notes,
					contextWindow: curated[m.id]?.contextWindow,
				}));

				return {
					valid: true,
					models:
						models.length > 0 ? models : getCuratedModelsForProvider("grok"),
				};
			}

			case "other": {
				if (!baseURL) {
					return {
						valid: false,
						error: "Base URL is required for OpenAI-compatible endpoints",
						models: [],
					};
				}
				const cleanUrl = baseURL.replace(/\/+$/, "");
				const modelsUrl = cleanUrl.endsWith("/v1")
					? `${cleanUrl}/models`
					: `${cleanUrl}/v1/models`;

				try {
					const res = await fetch(modelsUrl, {
						headers: { Authorization: `Bearer ${trimmedKey}` },
					});
					if (res.status === 401 || res.status === 403) {
						return { valid: false, error: "Authentication failed", models: [] };
					}
					if (res.ok) {
						const data = (await res.json()) as {
							data?: Array<{ id: string }>;
							models?: Array<{ id: string }>;
						};
						const list = data.data || data.models || [];
						const models = list.map((m) => ({
							id: m.id,
							displayName: m.id,
						}));
						return { valid: true, models };
					}
				} catch {
					// Fall through to return empty list with valid key indicator
				}
				return { valid: true, models: [] };
			}

			default:
				return {
					valid: false,
					error: `Unsupported provider: ${provider}`,
					models: [],
				};
		}
	} catch (err: unknown) {
		console.warn(`Model fetching failed for ${provider}:`, err);
		// If network error but provider is known, offer curated fallback
		if (provider !== "other") {
			return {
				valid: true,
				models: getCuratedModelsForProvider(provider),
			};
		}
		return {
			valid: false,
			error: err instanceof Error ? err.message : "Failed to validate API key",
			models: [],
		};
	}
}
