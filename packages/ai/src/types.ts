/**
 * Predefined AI provider identifiers.
 */
export type PredefinedProviderName =
	| "google"
	| "openai"
	| "anthropic"
	| "grok"
	| "kimi"
	| "deepseek";

/**
 * All supported AI provider identifiers, including custom "other" OpenAI-compatible endpoints.
 */
export type AIProviderName = PredefinedProviderName | "other";

/**
 * Configuration for a predefined AI provider.
 */
export interface PredefinedProviderConfig {
	provider: PredefinedProviderName;
	modelId: string;
	apiKey: string;
}

/**
 * Configuration for a custom OpenAI-compatible AI provider.
 */
export interface CustomProviderConfig {
	provider: "other";
	name?: string;
	baseURL: string;
	apiKey: string;
	modelId: string;
}

/**
 * AI Provider configuration union.
 */
export type AIProvider = PredefinedProviderConfig | CustomProviderConfig;

/**
 * Options passed to `callAI`.
 */
export interface CallAIOptions {
	provider: AIProvider;
	prompt: string;
	abortSignal?: AbortSignal;
}

/**
 * Token usage counts returned after AI text generation.
 */
export interface TokenUsage {
	inputTokens: number | undefined;
	outputTokens: number | undefined;
	totalTokens: number | undefined;
}

/**
 * Return type of `callAI` containing streamable text deltas, full text promise, and token usage promise.
 */
export interface CallAIResult {
	/**
	 * Async iterable and readable stream of text chunks as they are generated.
	 */
	textStream: AsyncIterable<string> & ReadableStream<string>;

	/**
	 * Promise that resolves to the complete generated text.
	 */
	text: Promise<string>;

	/**
	 * Promise that resolves to the total token usage (input, output, and total tokens).
	 */
	usage: Promise<TokenUsage>;
}
