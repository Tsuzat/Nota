import type { LanguageModel } from "ai";
import { generateText, streamText } from "ai";
import { systemInstruction } from "./system-prompts";
import type {
	AIProvider,
	CallAIOptions,
	CallAIResult,
	TokenUsage,
} from "./types";

async function resolveModel(
	providerConfig: AIProvider,
): Promise<LanguageModel> {
	if (providerConfig.provider === "other") {
		const { createOpenAICompatible } = await import(
			"@ai-sdk/openai-compatible"
		);
		const openaiCompatible = createOpenAICompatible({
			name: providerConfig.name || "custom",
			baseURL: providerConfig.baseURL,
			apiKey: providerConfig.apiKey,
		});
		return openaiCompatible(providerConfig.modelId);
	}

	switch (providerConfig.provider) {
		case "google": {
			const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
			const google = createGoogleGenerativeAI({
				apiKey: providerConfig.apiKey,
			});
			return google(providerConfig.modelId);
		}
		case "openai": {
			const { createOpenAI } = await import("@ai-sdk/openai");
			const openai = createOpenAI({
				apiKey: providerConfig.apiKey,
			});
			return openai(providerConfig.modelId);
		}
		case "anthropic": {
			const { createAnthropic } = await import("@ai-sdk/anthropic");
			const anthropic = createAnthropic({
				apiKey: providerConfig.apiKey,
			});
			return anthropic(providerConfig.modelId);
		}
		case "grok": {
			const { createOpenAICompatible } = await import(
				"@ai-sdk/openai-compatible"
			);
			const grok = createOpenAICompatible({
				name: "grok",
				baseURL: "https://api.x.ai/v1",
				apiKey: providerConfig.apiKey,
			});
			return grok(providerConfig.modelId);
		}
		case "kimi": {
			const { createOpenAICompatible } = await import(
				"@ai-sdk/openai-compatible"
			);
			const kimi = createOpenAICompatible({
				name: "kimi",
				baseURL: "https://api.moonshot.cn/v1",
				apiKey: providerConfig.apiKey,
			});
			return kimi(providerConfig.modelId);
		}
		case "deepseek": {
			const { createOpenAICompatible } = await import(
				"@ai-sdk/openai-compatible"
			);
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
 * console.log(`Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}`);
 * ```
 */
export function callAI(options: CallAIOptions): CallAIResult {
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

	const resultPromise = resolveModel(options.provider).then((model) => {
		return streamText({
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
	});

	const textStream = new ReadableStream<string>({
		async start(controller) {
			try {
				const result = await resultPromise;
				for await (const chunk of result.textStream) {
					controller.enqueue(chunk);
				}
				controller.close();
			} catch (err) {
				controller.error(err);
			}
		},
	}) as AsyncIterable<string> & ReadableStream<string>;

	if (!(Symbol.asyncIterator in textStream)) {
		(textStream as any)[Symbol.asyncIterator] = async function* () {
			const reader = (textStream as ReadableStream<string>).getReader();
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					yield value;
				}
			} finally {
				reader.releaseLock();
			}
		};
	}

	const usagePromise: Promise<TokenUsage> = resultPromise
		.then((r) => Promise.resolve(r.usage))
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

	const textPromise: Promise<string> = resultPromise.then((r) =>
		Promise.resolve(r.text),
	);

	return {
		textStream,
		text: textPromise,
		usage: usagePromise,
	};
}

/**
 * Utility to verify if an API key is valid.
 */
export async function testAIKey(providerConfig: AIProvider): Promise<boolean> {
	try {
		const languageModel = await resolveModel(providerConfig);

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
