import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { generateText, streamText } from "ai";
import { systemInstruction } from "./system-prompts";
import type {
	AIProvider,
	CallAIOptions,
	CallAIResult,
	TokenUsage,
} from "./types";

function resolveModel(providerConfig: AIProvider): LanguageModel {
	if (providerConfig.provider === "other") {
		const openaiCompatible = createOpenAICompatible({
			name: providerConfig.name || "custom",
			baseURL: providerConfig.baseURL,
			apiKey: providerConfig.apiKey,
		});
		return openaiCompatible(providerConfig.modelId);
	}

	switch (providerConfig.provider) {
		case "google": {
			const google = createGoogleGenerativeAI({
				apiKey: providerConfig.apiKey,
			});
			return google(providerConfig.modelId);
		}
		case "openai": {
			const openai = createOpenAI({
				apiKey: providerConfig.apiKey,
			});
			return openai(providerConfig.modelId);
		}
		case "anthropic": {
			const anthropic = createAnthropic({
				apiKey: providerConfig.apiKey,
			});
			return anthropic(providerConfig.modelId);
		}
		case "grok": {
			const grok = createOpenAICompatible({
				name: "grok",
				baseURL: "https://api.x.ai/v1",
				apiKey: providerConfig.apiKey,
			});
			return grok(providerConfig.modelId);
		}
		case "kimi": {
			const kimi = createOpenAICompatible({
				name: "kimi",
				baseURL: "https://api.moonshot.cn/v1",
				apiKey: providerConfig.apiKey,
			});
			return kimi(providerConfig.modelId);
		}
		case "deepseek": {
			const deepseek = createOpenAICompatible({
				name: "deepseek",
				baseURL: "https://api.deepseek.com",
				apiKey: providerConfig.apiKey,
			});
			return deepseek(providerConfig.modelId);
		}
		default:
			// @ts-expect-error fallback
			throw new Error(`Unsupported provider: ${providerConfig.provider}`);
	}
}

/**
 * Initiates text generation with the specified AI provider and streams the result.
 *
 * Supports streaming text, graceful cancellation via AbortSignal, and token usage reporting.
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 *
 * const result = callAI({
 *   provider: { provider: "google", modelId: "gemini-2.5-flash", apiKey: "..." },
 *   prompt: "Summarize this article...",
 *   abortSignal: controller.signal,
 * });
 *
 * for await (const delta of result.textStream) {
 *   console.log(delta);
 * }
 *
 * const usage = await result.usage;
 * console.log(\`Input tokens: \${usage.inputTokens}, Output tokens: \${usage.outputTokens}\`);
 * ```
 */
export function callAI(options: CallAIOptions): CallAIResult {
	const model = resolveModel(options.provider);

	let accumulatedUsage: TokenUsage = {
		inputTokens: undefined,
		outputTokens: undefined,
		totalTokens: undefined,
	};

	console.log(
		"Calling AI with provider:",
		options.provider.provider,
		"model:",
		options.provider.modelId,
		"prompt:",
		options.prompt,
	);

	const result = streamText({
		model,
		system: systemInstruction,
		prompt: options.prompt,
		abortSignal: options.abortSignal,
		onStepEnd(step) {
			if (step.usage) {
				accumulatedUsage = {
					inputTokens: step.usage.inputTokens,
					outputTokens: step.usage.outputTokens,
					totalTokens: step.usage.totalTokens,
				};
			}
		},
		onAbort(event) {
			if (event.steps && event.steps.length > 0) {
				const lastStep = event.steps[event.steps.length - 1];
				if (lastStep?.usage) {
					accumulatedUsage = {
						inputTokens: lastStep.usage.inputTokens,
						outputTokens: lastStep.usage.outputTokens,
						totalTokens: lastStep.usage.totalTokens,
					};
				}
			}
		},
	});

	const usagePromise: Promise<TokenUsage> = Promise.resolve(result.usage)
		.then((u) => ({
			inputTokens: u.inputTokens,
			outputTokens: u.outputTokens,
			totalTokens: u.totalTokens,
		}))
		.catch((err: unknown) => {
			if (options.abortSignal?.aborted) {
				return accumulatedUsage;
			}
			throw err;
		});

	return {
		textStream: result.textStream,
		text: Promise.resolve(result.text),
		usage: usagePromise,
	};
}

/**
 * Utility to verify if an API key is valid.
 */
export async function testAIKey(providerConfig: AIProvider): Promise<boolean> {
	try {
		const languageModel = resolveModel(providerConfig);

		await generateText({
			model: languageModel,
			prompt: "Say hi",
		});
		return true;
	} catch (e) {
		console.error("API Key verification failed:", e);
		return false;
	}
}
