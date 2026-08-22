import type { PredefinedProviderName } from "./types";

export type ModelPricing = {
	/** Vercel AI SDK model string, e.g. model: 'openai/gpt-5.6' */
	modelString: string;
	displayName: string;
	contextWindow: number; // tokens
	maxOutputTokens: number;
	inputCostPerMillion: number; // USD per 1M input tokens
	outputCostPerMillion: number; // USD per 1M output tokens
	cachedInputCostPerMillion?: number; // USD per 1M cached input tokens
	notes?: string;
};

export type CustomModelConfig = {
	id: string;
	displayName: string;
	modelString: string;
	baseUrl: string;
	contextWindow?: number;
};

export type SelectableModel = {
	id: string;
	displayName: string;
	provider: string;
	providerIcon?: string | { dark: string; light: string };
	modelString: string;
	contextWindow: number;
	maxOutputTokens?: number;
	inputCostPerMillion?: number;
	outputCostPerMillion?: number;
	cachedInputCostPerMillion?: number;
	notes?: string;
	isCustom?: boolean;
};

export type ProviderConfig = {
	icon: string | { dark: string; light: string };
	models: Record<string, ModelPricing>;
};

export const LATEST_MODELS: Record<PredefinedProviderName, ProviderConfig> = {
	openai: {
		icon: {
			dark: "https://svgl.app/library/openai_dark.svg",
			light: "https://svgl.app/library/openai.svg",
		},
		models: {
			"gpt-5.6": {
				modelString: "gpt-5.6",
				displayName: "GPT-5.6",
				contextWindow: 1_050_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 5.0,
				outputCostPerMillion: 30.0,
				cachedInputCostPerMillion: 0.5,
				notes:
					"Alias for GPT-5.6 Sol, OpenAI's flagship frontier model. $5/$30 per 1M input/output tokens.",
			},
			"gpt-5.6-sol": {
				modelString: "gpt-5.6-sol",
				displayName: "GPT-5.6 Sol",
				contextWindow: 1_050_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 5.0,
				outputCostPerMillion: 30.0,
				cachedInputCostPerMillion: 0.5,
				notes:
					"Frontier GPT-5.6 model for complex reasoning, coding and professional workloads.",
			},
			"gpt-5.6-terra": {
				modelString: "gpt-5.6-terra",
				displayName: "GPT-5.6 Terra",
				contextWindow: 1_050_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 2.0,
				outputCostPerMillion: 12.0,
				cachedInputCostPerMillion: 0.2,
				notes:
					"GPT-5.6 model balancing intelligence and cost. Long prompts above 272K tokens have higher pricing.",
			},
			"gpt-5.6-luna": {
				modelString: "gpt-5.6-luna",
				displayName: "GPT-5.6 Luna",
				contextWindow: 1_050_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 0.2,
				outputCostPerMillion: 1.2,
				cachedInputCostPerMillion: 0.02,
				notes:
					"Cost-optimized GPT-5.6 model for high-volume workloads. Long prompts above 272K tokens have higher pricing.",
			},
		},
	},

	anthropic: {
		icon: "https://svgl.app/library/claude-ai-icon.svg",
		models: {
			"claude-fable-5": {
				modelString: "claude-fable-5",
				displayName: "Claude Fable 5",
				contextWindow: 1_000_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 10.0,
				outputCostPerMillion: 50.0,
				cachedInputCostPerMillion: 1.0,
				notes:
					"Anthropic's most capable widely released model for long-running agents and highest-capability workloads.",
			},
			"claude-opus-5": {
				modelString: "claude-opus-5",
				displayName: "Claude Opus 5",
				contextWindow: 1_000_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 5.0,
				outputCostPerMillion: 25.0,
				cachedInputCostPerMillion: 0.5,
				notes:
					"Frontier model for complex agentic coding, enterprise work and long-horizon reasoning.",
			},
			"claude-sonnet-5": {
				modelString: "claude-sonnet-5",
				displayName: "Claude Sonnet 5",
				contextWindow: 1_000_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 2.0,
				outputCostPerMillion: 10.0,
				cachedInputCostPerMillion: 0.2,
				notes:
					"Current standard pricing is $2/$10 per 1M input/output tokens; the previously planned September price increase was cancelled.",
			},
			"claude-haiku-4-5": {
				modelString: "claude-haiku-4-5",
				displayName: "Claude Haiku 4.5",
				contextWindow: 200_000,
				maxOutputTokens: 64_000,
				inputCostPerMillion: 1.0,
				outputCostPerMillion: 5.0,
				cachedInputCostPerMillion: 0.1,
				notes:
					"Fastest current Claude model with near-frontier intelligence for high-volume and latency-sensitive workloads.",
			},
		},
	},

	google: {
		icon: "https://svgl.app/library/gemini.svg",
		models: {
			"gemini-3.7-flash": {
				modelString: "gemini-3.7-flash",
				displayName: "Gemini 3.7 Flash",
				contextWindow: 1_000_000,
				maxOutputTokens: 64_000,
				inputCostPerMillion: 0.75,
				outputCostPerMillion: 3.75,
				cachedInputCostPerMillion: 0.075,
				notes:
					"Latest GA Gemini Flash model for agentic workflows and multimodal reasoning. Introductory pricing applies through Dec 31, 2026.",
			},
			"gemini-3.6-flash": {
				modelString: "gemini-3.6-flash",
				displayName: "Gemini 3.6 Flash",
				contextWindow: 1_000_000,
				maxOutputTokens: 64_000,
				inputCostPerMillion: 0.75,
				outputCostPerMillion: 3.75,
				cachedInputCostPerMillion: 0.075,
				notes:
					"Fast Gemini workhorse with 1M context. Current introductory standard pricing applies through Dec 31, 2026.",
			},
			"gemini-3.5-flash": {
				modelString: "gemini-3.5-flash",
				displayName: "Gemini 3.5 Flash",
				contextWindow: 1_048_576,
				maxOutputTokens: 65_536,
				inputCostPerMillion: 1.5,
				outputCostPerMillion: 9.0,
				cachedInputCostPerMillion: 0.15,
				notes:
					"GA Gemini 3.5 Flash model with strong general-purpose performance.",
			},
			"gemini-3.5-flash-lite": {
				modelString: "gemini-3.5-flash-lite",
				displayName: "Gemini 3.5 Flash Lite",
				contextWindow: 1_000_000,
				maxOutputTokens: 64_000,
				inputCostPerMillion: 0.3,
				outputCostPerMillion: 2.5,
				cachedInputCostPerMillion: 0.03,
				notes:
					"Cost-efficient GA Gemini model for high-volume agentic tasks, translation and simple data processing.",
			},
			"gemini-3.1-pro-preview": {
				modelString: "gemini-3.1-pro-preview",
				displayName: "Gemini 3.1 Pro Preview",
				contextWindow: 1_048_576,
				maxOutputTokens: 65_536,
				inputCostPerMillion: 2.0,
				outputCostPerMillion: 12.0,
				cachedInputCostPerMillion: 0.2,
				notes:
					"$2/$12 per 1M input/output tokens for prompts up to 200K; $4/$18 above 200K.",
			},
			"gemini-3.1-flash-lite": {
				modelString: "gemini-3.1-flash-lite",
				displayName: "Gemini 3.1 Flash Lite",
				contextWindow: 1_000_000,
				maxOutputTokens: 64_000,
				inputCostPerMillion: 0.25,
				outputCostPerMillion: 1.5,
				cachedInputCostPerMillion: 0.025,
				notes:
					"Most cost-efficient Gemini model for high-volume agentic tasks, translation and simple data processing.",
			},
		},
	},

	deepseek: {
		icon: "https://svgl.app/library/deepseek.svg",
		models: {
			"deepseek-v4-pro": {
				modelString: "deepseek-v4-pro",
				displayName: "DeepSeek V4 Pro",
				contextWindow: 1_000_000,
				maxOutputTokens: 384_000,
				inputCostPerMillion: 0.66,
				outputCostPerMillion: 1.98,
				cachedInputCostPerMillion: 0.022,
				notes:
					"DeepSeek V4 Pro. Current off-peak pricing: $0.66 input / $1.98 output / $0.022 cache hit per 1M tokens. Peak pricing is 2x.",
			},
			"deepseek-v4-flash": {
				modelString: "deepseek-v4-flash",
				displayName: "DeepSeek V4 Flash",
				contextWindow: 1_000_000,
				maxOutputTokens: 384_000,
				inputCostPerMillion: 0.22,
				outputCostPerMillion: 0.66,
				cachedInputCostPerMillion: 0.007,
				notes:
					"Fast DeepSeek V4 model. Current off-peak pricing: $0.22 input / $0.66 output / $0.007 cache hit per 1M tokens. Peak pricing is 2x.",
			},
		},
	},

	kimi: {
		icon: "https://svgl.app/library/kimi-icon.svg",
		models: {
			"kimi-k3": {
				modelString: "kimi-k3",
				displayName: "Kimi K3",
				contextWindow: 1_048_576,
				maxOutputTokens: 131_072,
				inputCostPerMillion: 3.0,
				outputCostPerMillion: 15.0,
				cachedInputCostPerMillion: 0.3,
				notes:
					"Kimi's flagship 2.8T-parameter model with 1M context and multimodal reasoning.",
			},
			"kimi-k2.7-code": {
				modelString: "kimi-k2.7-code",
				displayName: "Kimi K2.7 Code",
				contextWindow: 262_144,
				maxOutputTokens: 131_072,
				inputCostPerMillion: 0.95,
				outputCostPerMillion: 4.0,
				cachedInputCostPerMillion: 0.19,
				notes:
					"Agentic coding model with 256K context. Cache-hit input is $0.19/M tokens.",
			},
			"kimi-k2.6": {
				modelString: "kimi-k2.6",
				displayName: "Kimi K2.6",
				contextWindow: 262_144,
				maxOutputTokens: 262_144,
				inputCostPerMillion: 0.95,
				outputCostPerMillion: 4.0,
				cachedInputCostPerMillion: 0.16,
				notes: "General-purpose multimodal Kimi model with 256K context.",
			},
		},
	},

	grok: {
		icon: {
			dark: "https://svgl.app/library/grok-dark.svg",
			light: "https://svgl.app/library/grok-light.svg",
		},
		models: {
			"grok-4.5": {
				modelString: "grok-4.5",
				displayName: "Grok 4.5",
				contextWindow: 500_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 2.0,
				outputCostPerMillion: 6.0,
				cachedInputCostPerMillion: 0.3,
				notes:
					"xAI flagship model for coding, agentic tool calling and general workloads.",
			},
			"grok-4.3": {
				modelString: "grok-4.3",
				displayName: "Grok 4.3",
				contextWindow: 1_000_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 1.25,
				outputCostPerMillion: 2.5,
				cachedInputCostPerMillion: 0.2,
				notes:
					"Fast, reliable Grok model with strong tool calling and configurable reasoning. Long-context requests above 200K use higher rates.",
			},
			"grok-4.20-reasoning": {
				modelString: "grok-4.20-0309-reasoning",
				displayName: "Grok 4.20 Reasoning",
				contextWindow: 1_000_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 1.25,
				outputCostPerMillion: 2.5,
				cachedInputCostPerMillion: 0.2,
				notes: "Reasoning-focused Grok 4.20 model with 1M context.",
			},
			"grok-4.20-non-reasoning": {
				modelString: "grok-4.20-0309-non-reasoning",
				displayName: "Grok 4.20 Non-Reasoning",
				contextWindow: 1_000_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 1.25,
				outputCostPerMillion: 2.5,
				cachedInputCostPerMillion: 0.2,
				notes: "Non-reasoning Grok 4.20 variant with 1M context.",
			},
			"grok-4.20-multi-agent": {
				modelString: "grok-4.20-multi-agent-0309",
				displayName: "Grok 4.20 Multi-Agent",
				contextWindow: 1_000_000,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 1.25,
				outputCostPerMillion: 2.5,
				cachedInputCostPerMillion: 0.2,
				notes:
					"Multi-agent Grok model designed for parallel deep-research workflows.",
			},
			"grok-build-0.1": {
				modelString: "grok-build-0.1",
				displayName: "Grok Build 0.1",
				contextWindow: 262_144,
				maxOutputTokens: 128_000,
				inputCostPerMillion: 1.0,
				outputCostPerMillion: 2.0,
				cachedInputCostPerMillion: 0.2,
				notes:
					"Agentic coding and web-development model. Long-context pricing is higher.",
			},
		},
	},
};
