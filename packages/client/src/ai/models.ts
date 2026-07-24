export type ModelPricing = {
  /** Vercel AI SDK model string, e.g. model: 'openai/gpt-5.5' */
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
  modelString: string;
  contextWindow: number;
  maxOutputTokens?: number;
  inputCostPerMillion?: number;
  outputCostPerMillion?: number;
  notes?: string;
  isCustom?: boolean;
};

export type ProviderModels = Record<string, ModelPricing>;

export const LATEST_MODELS: Record<
  "openai" | "claude" | "gemini" | "deepseek" | "kimi" | "grok",
  ProviderModels
> = {
  openai: {
    "gpt-5.6": {
      modelString: "gpt-5.6",
      displayName: "GPT-5.6",
      contextWindow: 1_050_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 2.5,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.25,
      notes: "Balanced GPT-5.6 model (Terra). Knowledge cutoff Feb 16, 2026.",
    },
    "gpt-5.6-luna": {
      modelString: "gpt-5.6-luna",
      displayName: "GPT-5.6 Luna",
      contextWindow: 1_050_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 1.0,
      outputCostPerMillion: 6.0,
      cachedInputCostPerMillion: 0.1,
      notes: "Smallest, most cost-efficient GPT-5.6 model.",
    },
    "gpt-5.6-sol": {
      modelString: "gpt-5.6-sol",
      displayName: "GPT-5.6 Sol",
      contextWindow: 1_050_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 5.0,
      outputCostPerMillion: 30.0,
      cachedInputCostPerMillion: 0.5,
      notes: "Flagship GPT-5.6 model for complex reasoning.",
    },
    "gpt-5.6-terra": {
      modelString: "gpt-5.6-terra",
      displayName: "GPT-5.6 Terra",
      contextWindow: 1_050_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 2.5,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.25,
      notes: "Balanced GPT-5.6 model for everyday production work.",
    },
    "gpt-5.5": {
      modelString: "gpt-5.5",
      displayName: "GPT-5.5",
      contextWindow: 1_050_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 5.0,
      outputCostPerMillion: 30.0,
      cachedInputCostPerMillion: 0.5,
      notes: "Previous flagship model. Knowledge cutoff Dec 01, 2025.",
    },
    "gpt-5.4-pro": {
      modelString: "gpt-5.4-pro",
      displayName: "GPT-5.4 Pro",
      contextWindow: 1_050_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 30.0,
      outputCostPerMillion: 180.0,
      cachedInputCostPerMillion: 3.0, // estimated at 10% of input
      notes: "Highest reasoning capability in GPT-5.4 family.",
    },
    "gpt-5.4": {
      modelString: "gpt-5.4",
      displayName: "GPT-5.4",
      contextWindow: 1_050_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 2.5,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.25,
      notes: "Balanced GPT-5.4 model.",
    },
    "gpt-5.4-mini": {
      modelString: "gpt-5.4-mini",
      displayName: "GPT-5.4 Mini",
      contextWindow: 400_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 0.75,
      outputCostPerMillion: 4.5,
      cachedInputCostPerMillion: 0.075,
      notes: "Cost-efficient GPT-5.4 model.",
    },
    "gpt-5.4-nano": {
      modelString: "gpt-5.4-nano",
      displayName: "GPT-5.4 Nano",
      contextWindow: 400_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 0.2,
      outputCostPerMillion: 1.25,
      cachedInputCostPerMillion: 0.02,
      notes: "Fastest and cheapest GPT-5.4 model.",
    },
  },

  claude: {
    "claude-sonnet-5": {
      modelString: "claude-sonnet-5",
      displayName: "Claude Sonnet 5",
      contextWindow: 1_000_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.3,
      notes: "Balanced flagship. Intro pricing $2/$10 until Aug 31, 2026.",
    },
    "claude-fable-5": {
      modelString: "claude-fable-5",
      displayName: "Claude Fable 5",
      contextWindow: 1_000_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 10.0,
      outputCostPerMillion: 50.0,
      cachedInputCostPerMillion: 1.0,
      notes: "Most capable widely released Claude model.",
    },
    "claude-opus-4-8": {
      modelString: "claude-opus-4-8",
      displayName: "Claude Opus 4.8",
      contextWindow: 1_000_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 5.0,
      outputCostPerMillion: 25.0,
      cachedInputCostPerMillion: 0.5,
      notes: "Most capable Opus-tier model. Fast mode available at 2.5x speed.",
    },
    "claude-opus-4-7": {
      modelString: "claude-opus-4-7",
      displayName: "Claude Opus 4.7",
      contextWindow: 1_000_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 5.0,
      outputCostPerMillion: 25.0,
      cachedInputCostPerMillion: 0.5,
      notes: "Previous Opus flagship.",
    },
    "claude-opus-4-6": {
      modelString: "claude-opus-4-6",
      displayName: "Claude Opus 4.6",
      contextWindow: 1_000_000,
      maxOutputTokens: 128_000,
      inputCostPerMillion: 5.0,
      outputCostPerMillion: 25.0,
      cachedInputCostPerMillion: 0.5,
      notes: "Earlier Opus model.",
    },
    "claude-sonnet-4-6": {
      modelString: "claude-sonnet-4-6",
      displayName: "Claude Sonnet 4.6",
      contextWindow: 1_000_000,
      maxOutputTokens: 64_000,
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.3,
      notes: "Earlier Sonnet model.",
    },
  },

  gemini: {
    "gemini-3.6-flash": {
      modelString: "gemini-3.6-flash",
      displayName: "Gemini 3.6 Flash",
      contextWindow: 1_000_000,
      maxOutputTokens: 64_000,
      inputCostPerMillion: 1.5,
      outputCostPerMillion: 7.5,
      cachedInputCostPerMillion: 0.15,
      notes:
        "Fast flagship Gemini model. 17% fewer tokens in multi-step tasks.",
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
        "Frontier intelligence at Flash latency. Knowledge cutoff Jan 2026.",
    },
    "gemini-3.5-flash-lite": {
      modelString: "gemini-3.5-flash-lite",
      displayName: "Gemini 3.5 Flash Lite",
      contextWindow: 1_000_000,
      maxOutputTokens: 64_000,
      inputCostPerMillion: 0.3,
      outputCostPerMillion: 2.5,
      cachedInputCostPerMillion: 0.03,
      notes: "Lowest-cost Gemini 3.5 model.",
    },
    "gemini-3.1-pro-preview": {
      modelString: "gemini-3.1-pro-preview",
      displayName: "Gemini 3.1 Pro Preview",
      contextWindow: 1_048_576,
      maxOutputTokens: 65_536,
      inputCostPerMillion: 2.0,
      outputCostPerMillion: 12.0,
      cachedInputCostPerMillion: 0.2,
      notes: "Preview of Gemini 3.1 Pro.",
    },
    "gemini-3.1-flash-lite-preview": {
      modelString: "gemini-3.1-flash-lite-preview",
      displayName: "Gemini 3.1 Flash Lite Preview",
      contextWindow: 1_048_576,
      maxOutputTokens: 65_536,
      inputCostPerMillion: 0.25,
      outputCostPerMillion: 1.5,
      cachedInputCostPerMillion: 0.025,
      notes: "Most cost-efficient Gemini 3.1 model.",
    },
  },

  deepseek: {
    "deepseek-v4-pro": {
      modelString: "deepseek-v4-pro",
      displayName: "DeepSeek V4 Pro",
      contextWindow: 1_000_000,
      maxOutputTokens: 384_000,
      inputCostPerMillion: 0.435,
      outputCostPerMillion: 0.87,
      cachedInputCostPerMillion: 0.003625,
      notes: "Flagship DeepSeek V4 model.",
    },
    "deepseek-v4": {
      modelString: "deepseek-v4",
      displayName: "DeepSeek V4",
      contextWindow: 1_000_000,
      maxOutputTokens: 384_000,
      inputCostPerMillion: 0.28,
      outputCostPerMillion: 0.56,
      cachedInputCostPerMillion: 0.028,
      notes: "Balanced DeepSeek V4 model.",
    },
    "deepseek-v4-flash": {
      modelString: "deepseek-v4-flash",
      displayName: "DeepSeek V4 Flash",
      contextWindow: 1_000_000,
      maxOutputTokens: 384_000,
      inputCostPerMillion: 0.14,
      outputCostPerMillion: 0.28,
      cachedInputCostPerMillion: 0.0028,
      notes: "Fast inference DeepSeek V4 model.",
    },
  },

  kimi: {
    "kimi-k3": {
      modelString: "kimi-k3",
      displayName: "Kimi K3",
      contextWindow: 1_000_000,
      maxOutputTokens: 1_000_000,
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.3,
      notes: "Kimi's flagship model. 2.8T parameters.",
    },
    "kimi-k2.6": {
      modelString: "kimi-k2.6",
      displayName: "Kimi K2.6",
      contextWindow: 262_144,
      maxOutputTokens: 262_144,
      inputCostPerMillion: 0.95,
      outputCostPerMillion: 4.0,
      cachedInputCostPerMillion: 0.16,
      notes: "General-purpose multimodal model.",
    },
    "kimi-k2.5": {
      modelString: "kimi-k2.5",
      displayName: "Kimi K2.5",
      contextWindow: 262_100,
      maxOutputTokens: 262_100,
      inputCostPerMillion: 0.6,
      outputCostPerMillion: 3.0,
      cachedInputCostPerMillion: 0.12,
      notes: "Fast and economical Kimi model.",
    },
  },

  grok: {
    "grok-4.5": {
      modelString: "grok-4.5",
      displayName: "Grok 4.5",
      contextWindow: 500_000,
      maxOutputTokens: 128_000, // estimated
      inputCostPerMillion: 2.0,
      outputCostPerMillion: 6.0,
      cachedInputCostPerMillion: 0.2,
      notes: "xAI flagship model for code and agentic tasks.",
    },
    "grok-4.20-reasoning": {
      modelString: "grok-4.20-reasoning",
      displayName: "Grok 4.20 Reasoning",
      contextWindow: 2_000_000,
      maxOutputTokens: 2_000_000,
      inputCostPerMillion: 1.25,
      outputCostPerMillion: 2.5,
      cachedInputCostPerMillion: 0.2,
      notes: "Reasoning-focused Grok 4.20 model.",
    },
    "grok-4.20-non-reasoning": {
      modelString: "grok-4.20-non-reasoning",
      displayName: "Grok 4.20 Non-Reasoning",
      contextWindow: 2_000_000,
      maxOutputTokens: 2_000_000,
      inputCostPerMillion: 1.25,
      outputCostPerMillion: 2.5,
      cachedInputCostPerMillion: 0.2,
      notes: "Non-reasoning variant of Grok 4.20.",
    },
    "grok-4-1-fast-reasoning": {
      modelString: "grok-4-1-fast-reasoning",
      displayName: "Grok 4.1 Fast Reasoning",
      contextWindow: 2_000_000,
      maxOutputTokens: 30_000,
      inputCostPerMillion: 0.2,
      outputCostPerMillion: 0.5,
      cachedInputCostPerMillion: 0.02,
      notes: "Fast reasoning model with 2M context.",
    },
    "grok-4-1-fast-non-reasoning": {
      modelString: "grok-4-1-fast-non-reasoning",
      displayName: "Grok 4.1 Fast Non-Reasoning",
      contextWindow: 2_000_000,
      maxOutputTokens: 30_000, // estimated, same as reasoning variant
      inputCostPerMillion: 0.2,
      outputCostPerMillion: 0.5,
      cachedInputCostPerMillion: 0.02,
      notes: "Fast model without reasoning overhead.",
    },
    "grok-4-1": {
      modelString: "grok-4-1",
      displayName: "Grok 4.1",
      contextWindow: 1_000_000,
      maxOutputTokens: 8_000,
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.3,
      notes: "Base Grok 4.1 model.",
    },
    "grok-4-fast-reasoning": {
      modelString: "grok-4-fast-reasoning",
      displayName: "Grok 4 Fast Reasoning",
      contextWindow: 2_000_000,
      maxOutputTokens: 82_000, // estimated from search result
      inputCostPerMillion: 0.2,
      outputCostPerMillion: 0.5,
      cachedInputCostPerMillion: 0.02,
      notes: "Fast reasoning model from Grok 4 family.",
    },
  },
};
