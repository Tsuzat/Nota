import { describe, expect, it } from "bun:test";
import {
	type AIProvider,
	type CallAIOptions,
	type CustomProviderConfig,
	LATEST_MODELS,
	type PredefinedProviderConfig,
	type PredefinedProviderName,
	type SelectableModel,
	type TokenUsage,
} from "../src";

// ---------------------------------------------------------------------------
// LATEST_MODELS structure tests
// ---------------------------------------------------------------------------

describe("LATEST_MODELS", () => {
	const providers = Object.keys(LATEST_MODELS) as PredefinedProviderName[];

	it("should export all six predefined providers", () => {
		const expected: PredefinedProviderName[] = [
			"openai",
			"anthropic",
			"google",
			"deepseek",
			"kimi",
			"grok",
		];
		for (const p of expected) {
			expect(providers).toContain(p);
		}
		expect(providers.length).toBe(6);
	});

	it("should have an icon for every provider", () => {
		for (const provider of providers) {
			const config = LATEST_MODELS[provider];
			expect(config.icon).toBeDefined();
			if (typeof config.icon === "string") {
				expect(config.icon.length).toBeGreaterThan(0);
			} else {
				expect(config.icon.dark.length).toBeGreaterThan(0);
				expect(config.icon.light.length).toBeGreaterThan(0);
			}
		}
	});

	it("should have at least one model per provider", () => {
		for (const provider of providers) {
			const modelKeys = Object.keys(LATEST_MODELS[provider].models);
			expect(modelKeys.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("every model should have valid pricing and context fields", () => {
		for (const provider of providers) {
			const models = LATEST_MODELS[provider].models;
			for (const [_, model] of Object.entries(models)) {
				expect(model.displayName.length).toBeGreaterThan(0);
				expect(model.modelString.length).toBeGreaterThan(0);
				expect(model.contextWindow).toBeGreaterThan(0);
				expect(model.maxOutputTokens).toBeGreaterThan(0);
				expect(model.inputCostPerMillion).toBeGreaterThanOrEqual(0);
				expect(model.outputCostPerMillion).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it("should not contain legacy keys 'claude' or 'gemini'", () => {
		const keys = Object.keys(LATEST_MODELS);
		expect(keys).not.toContain("claude");
		expect(keys).not.toContain("gemini");
	});
});

// ---------------------------------------------------------------------------
// Type correctness tests (compile-time, but exercise at runtime too)
// ---------------------------------------------------------------------------

describe("Type definitions", () => {
	it("PredefinedProviderConfig should accept valid provider names", () => {
		const config: PredefinedProviderConfig = {
			provider: "google",
			modelId: "gemini-3.6-flash",
			apiKey: "test-key",
		};
		expect(config.provider).toBe("google");
	});

	it("CustomProviderConfig requires baseURL and provider 'other'", () => {
		const config: CustomProviderConfig = {
			provider: "other",
			baseURL: "http://localhost:11434/v1",
			apiKey: "ollama",
			modelId: "llama3",
		};
		expect(config.provider).toBe("other");
		expect(config.baseURL).toBe("http://localhost:11434/v1");
	});

	it("AIProvider union accepts both predefined and custom configs", () => {
		const predefined: AIProvider = {
			provider: "anthropic",
			modelId: "claude-sonnet-5",
			apiKey: "sk-test",
		};
		const custom: AIProvider = {
			provider: "other",
			baseURL: "http://localhost:11434/v1",
			apiKey: "ollama",
			modelId: "llama3",
		};
		expect(predefined.provider).toBe("anthropic");
		expect(custom.provider).toBe("other");
	});

	it("SelectableModel should accept all required fields", () => {
		const model: SelectableModel = {
			id: "gpt-5.6",
			displayName: "GPT-5.6",
			provider: "openai",
			modelString: "gpt-5.6",
			contextWindow: 1_050_000,
		};
		expect(model.id).toBe("gpt-5.6");
		expect(model.isCustom).toBeUndefined();
	});

	it("CallAIOptions should accept an abortSignal", () => {
		const controller = new AbortController();
		const opts: CallAIOptions = {
			provider: {
				provider: "openai",
				modelId: "gpt-5.6-luna",
				apiKey: "sk-test",
			},
			prompt: "Hello",
			abortSignal: controller.signal,
		};
		expect(opts.abortSignal).toBeDefined();
	});

	it("TokenUsage allows undefined fields", () => {
		const usage: TokenUsage = {
			inputTokens: undefined,
			outputTokens: undefined,
			totalTokens: undefined,
		};
		expect(usage.inputTokens).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Provider–model consistency tests
// ---------------------------------------------------------------------------

describe("Provider-model consistency", () => {
	it("model keys should be derivable from modelString (no provider prefix)", () => {
		const providers = Object.keys(LATEST_MODELS) as PredefinedProviderName[];
		for (const provider of providers) {
			for (const [_, model] of Object.entries(LATEST_MODELS[provider].models)) {
				// modelString should NOT contain a '/' prefix like 'openai/gpt-5.6'
				// because resolveModel in call-ai.ts passes modelString directly to the SDK
				expect(model.modelString).not.toContain("/");
			}
		}
	});

	it("all provider keys in LATEST_MODELS are valid PredefinedProviderNames", () => {
		const validNames: PredefinedProviderName[] = [
			"google",
			"openai",
			"anthropic",
			"grok",
			"kimi",
			"deepseek",
		];
		for (const key of Object.keys(LATEST_MODELS)) {
			expect(validNames).toContain(key as PredefinedProviderName);
		}
	});
});
