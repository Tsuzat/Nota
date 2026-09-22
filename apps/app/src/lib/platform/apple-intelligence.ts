import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { ISDESKTOP } from "#lib/utils.js";

export interface AppleAIAvailability {
	available: boolean;
	reason: string;
}

export interface AppleAIUsage {
	inputTokens: number;
	cachedInputTokens: number;
	outputTokens: number;
	reasoningTokens: number;
}

export interface AppleAIStreamStart {
	streamId: string;
	eventName: string;
}

export type AppleAIStreamEvent =
	| { type: "text"; text: string }
	| { type: "reasoning"; text: string }
	| { type: "usage"; usage: AppleAIUsage }
	| { type: "done" }
	| {
			type: "error";
			code: string;
			message: string;
			contextSize?: number;
			tokenCount?: number;
	  };

export interface AppleAIOptions {
	model?: "on-device" | "private-cloud";
	temperature?: number;
	maxTokens?: number;
	abortSignal?: AbortSignal;
}

/**
 * Checks if the current host is macOS desktop and Apple Intelligence Foundation Models are available.
 */
export async function checkAppleIntelligenceAvailability(): Promise<AppleAIAvailability> {
	if (
		!ISDESKTOP ||
		typeof window === "undefined" ||
		!navigator.userAgent.includes("Mac")
	) {
		return {
			available: false,
			reason:
				"Apple Intelligence is only available on macOS Desktop (Apple Silicon).",
		};
	}

	try {
		const res = await invoke<AppleAIAvailability>(
			"apple_ai_check_availability",
		);
		return res;
	} catch (e: unknown) {
		const msg =
			e instanceof Error
				? e.message
				: typeof e === "string"
					? e
					: "Apple Intelligence is unavailable on this device.";
		return {
			available: false,
			reason: msg,
		};
	}
}

/**
 * Checks if Private Cloud Compute (PCC) is available on this Mac.
 */
export async function checkPCCAvailability(): Promise<AppleAIAvailability> {
	if (
		!ISDESKTOP ||
		typeof window === "undefined" ||
		!navigator.userAgent.includes("Mac")
	) {
		return {
			available: false,
			reason: "Private Cloud Compute is only available on macOS Desktop.",
		};
	}

	try {
		const res = await invoke<AppleAIAvailability>(
			"apple_ai_pcc_check_availability",
		);
		return res;
	} catch (e: unknown) {
		const msg =
			e instanceof Error
				? e.message
				: typeof e === "string"
					? e
					: "Private Cloud Compute unavailable.";
		return {
			available: false,
			reason: msg,
		};
	}
}

/**
 * Streams text generation using Apple Intelligence.
 *
 * @param prompt The user prompt to send to Apple Intelligence
 * @param onChunk Callback receiving each text delta chunk as it streams
 * @param onError Callback if generation or stream fails
 * @param options Model options (e.g. 'on-device' or 'private-cloud') and AbortSignal
 * @returns A cancellation cleanup function
 */
export async function streamAppleIntelligence(
	prompt: string,
	onChunk: (chunk: string) => void,
	onError: (error: Error) => void,
	options?: AppleAIOptions,
): Promise<() => void> {
	if (
		!ISDESKTOP ||
		typeof window === "undefined" ||
		!navigator.userAgent.includes("Mac")
	) {
		onError(
			new Error("Apple Intelligence is only available on macOS Desktop."),
		);
		return () => {};
	}

	let unlisten: UnlistenFn | null = null;
	let activeStreamId: string | null = null;
	let activeFallbackCleanup: (() => void) | null = null;
	let completed = false;

	const cleanup = async () => {
		if (completed) return;
		completed = true;
		if (activeFallbackCleanup) {
			activeFallbackCleanup();
			activeFallbackCleanup = null;
		}
		if (activeStreamId) {
			try {
				await invoke("apple_ai_cancel_stream", {
					streamId: activeStreamId,
				});
			} catch {
				// cancellation failure is harmless if stream already finished
			}
		}
		if (unlisten) {
			unlisten();
			unlisten = null;
		}
	};

	if (options?.abortSignal) {
		if (options.abortSignal.aborted) {
			cleanup();
			return () => {};
		}
		options.abortSignal.addEventListener("abort", () => {
			cleanup();
		});
	}

	try {
		const targetModel = options?.model ?? "on-device";
		const request = {
			messages: [{ role: "user", content: prompt }],
			model: targetModel,
			temperature: options?.temperature,
			maxTokens: options?.maxTokens,
		};

		const start = await invoke<AppleAIStreamStart>("apple_ai_stream", {
			request,
		});
		activeStreamId = start.streamId;

		unlisten = await listen<AppleAIStreamEvent>(
			start.eventName,
			async (event) => {
				const payload = event.payload;
				if (!payload) return;

				if (payload.type === "text") {
					onChunk(payload.text);
				} else if (payload.type === "done") {
					completed = true;
					if (unlisten) {
						unlisten();
						unlisten = null;
					}
				} else if (payload.type === "error") {
					// If Private Cloud Compute is not provisioned or assets are unavailable,
					// gracefully fall back to the on-device Foundation Model.
					if (
						targetModel === "private-cloud" &&
						(payload.code === "assets-unavailable" ||
							payload.message.includes("assets-unavailable") ||
							payload.message.includes("LanguageModelError error -1"))
					) {
						console.warn(
							"Apple Private Cloud Compute unavailable; falling back to On-Device Foundation Model.",
						);
						if (unlisten) {
							unlisten();
							unlisten = null;
						}
						// Retry on-device
						try {
							activeFallbackCleanup = await streamAppleIntelligence(
								prompt,
								onChunk,
								onError,
								{ ...options, model: "on-device" },
							);
							return;
						} catch (fallbackErr) {
							completed = true;
							onError(
								fallbackErr instanceof Error
									? fallbackErr
									: new Error(String(fallbackErr)),
							);
							return;
						}
					}

					completed = true;
					const friendlyMsg =
						payload.code === "assets-unavailable"
							? "Apple Intelligence model assets are unavailable. If Apple Intelligence was recently turned on, macOS is still downloading model assets in System Settings > Apple Intelligence & Siri."
							: `[${payload.code}] ${payload.message}`;

					onError(new Error(friendlyMsg));
					if (unlisten) {
						unlisten();
						unlisten = null;
					}
				}
			},
		);

		return cleanup;
	} catch (err: unknown) {
		// If initial invoke fails on private-cloud, try on-device as well
		if (
			options?.model === "private-cloud" &&
			String(err).includes("assets-unavailable")
		) {
			console.warn(
				"Apple Private Cloud Compute invocation failed; retrying with On-Device model.",
			);
			return streamAppleIntelligence(prompt, onChunk, onError, {
				...options,
				model: "on-device",
			});
		}
		completed = true;
		onError(err instanceof Error ? err : new Error(String(err)));
		return () => {};
	}
}
