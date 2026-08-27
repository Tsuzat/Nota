import { callAI } from "@nota/ai";
import { auth } from "@nota/auth";
import { invalidateAiLedgerCache } from "@nota/cache/ai_ledger";
import { deleteCachedUserQuota } from "@nota/cache/user_quota";
import { recordAiUsageAndDeduct } from "@nota/db/data/ai_ledger";
import { getUserQuota, parseCents } from "@nota/db/data/user_quota";
import { env } from "@nota/env/server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

const computeCosts = (
	inputTokens: number,
	outputTokens: number,
	inputPricePer1M: number,
	outputPricePer1M: number,
) => {
	const ic = (inputTokens * inputPricePer1M * 100) / 1_000_000;
	const oc = (outputTokens * outputPricePer1M * 100) / 1_000_000;
	return {
		usedInputCost: ic.toFixed(6),
		usedOutputCost: oc.toFixed(6),
		totalCostCents: (ic + oc).toFixed(6),
	};
};

// Hard cap per generation so a hung upstream never burns tokens forever.
const AI_TIMEOUT_MS = 180_000;
// Keep the SSE connection alive through Cloudflare/Railway proxies.
const HEARTBEAT_MS = 15_000;

const buildProvider = () => {
	const p = env.NOTA_AI_PROVIDER;
	const baseURL = env.NOTA_AI_ENDPOINT || undefined;
	if (p === "other") {
		if (!baseURL) throw new Error("NOTA_AI_ENDPOINT required");
		return {
			provider: "other" as const,
			baseURL,
			apiKey: env.NOTA_AI_API_KEY,
			modelId: env.NOTA_AI_MODEL_ID,
			name: "nota" as const,
		};
	}
	return {
		provider: p as
			| "openai"
			| "google"
			| "anthropic"
			| "deepseek"
			| "grok"
			| "kimi",
		apiKey: env.NOTA_AI_API_KEY,
		modelId: env.NOTA_AI_MODEL_ID,
	};
};

export const createAiSseRoute = () => {
	const r = new Hono();
	r.post("/api/ai/complete", async (c) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

		let body: {
			prompt?: string;
			noteId?: string | null;
			description?: string | null;
		} = {};
		try {
			body = await c.req.json();
		} catch {}
		const prompt = (body.prompt ?? "").trim();
		if (!prompt) return c.json({ error: "prompt required" }, 400);
		if (prompt.length > 20000) return c.json({ error: "prompt too long" }, 400);

		const quota = await getUserQuota(session.user.id);
		if (!quota) return c.json({ error: "Quota not found" }, 404);
		if (parseCents(quota.aiCreditBalanceCents as unknown as string) <= 0) {
			return c.json(
				{ error: "No AI credits remaining. Please purchase more credits." },
				402,
			);
		}

		const provider = buildProvider();

		return streamSSE(c, async (stream) => {
			// Abort the upstream AI request the moment the client disconnects
			// so we don't keep burning tokens on a dead connection (Hono's
			// writeSSE swallows errors, so without this the loop would run
			// to completion).
			const controller = new AbortController();
			stream.onAbort(() => controller.abort());
			// Safety net: never let a single generation hang forever.
			const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
			// Keep the SSE connection alive through Cloudflare/Railway proxies.
			const heartbeat = setInterval(() => {
				void stream.writeSSE({ event: "ping", data: "" });
			}, HEARTBEAT_MS);

			try {
				let result: ReturnType<typeof callAI> | null = null;
				try {
					result = callAI({ provider, prompt, abortSignal: controller.signal });
				} catch (e) {
					console.error("[ai-sse] failed to start AI call:", e);
					await stream.writeSSE({
						data: "AI request failed to start",
						event: "error",
					});
					return;
				}

				let hadError = false;
				let errorMessage = "AI request interrupted";
				try {
					for await (const chunk of result.textStream) {
						if (stream.aborted) {
							hadError = true;
							break;
						}
						await stream.writeSSE({ data: chunk, event: "delta" });
					}
				} catch (e) {
					hadError = true;
					errorMessage = e instanceof Error ? e.message : "AI failed";
					console.error("[ai-sse] stream error:", e);
				}

				// Resolve usage even on abort — callAI accumulates partial usage.
				const usage = await result.usage.catch(
					() =>
						({ inputTokens: 0, outputTokens: 0 }) as {
							inputTokens?: number;
							outputTokens?: number;
						},
				);
				const it = usage.inputTokens ?? 0;
				const ot = usage.outputTokens ?? 0;

				if (it > 0 || ot > 0) {
					const { usedInputCost, usedOutputCost, totalCostCents } =
						computeCosts(
							it,
							ot,
							env.NOTA_AI_INPUT_COST,
							env.NOTA_AI_OUTPUT_COST,
						);
					try {
						const ledger = await recordAiUsageAndDeduct({
							userId: session.user.id,
							noteId: body.noteId ?? null,
							inputTokens: it,
							outputTokens: ot,
							usedInputCost,
							usedOutputCost,
							totalCostCents,
							description: body.description ?? null,
						});
						void deleteCachedUserQuota(session.user.id).catch(() => {});
						void invalidateAiLedgerCache(session.user.id).catch(() => {});
						if (!hadError) {
							await stream.writeSSE({
								data: JSON.stringify({
									inputTokens: it,
									outputTokens: ot,
									usedInputCost,
									usedOutputCost,
									totalCostCents,
									ledgerId: ledger.id,
									ok: true,
								}),
								event: "done",
							});
						}
					} catch (e) {
						console.error("[ai-sse] recordAiUsageAndDeduct failed:", e);
						if (!hadError) {
							await stream.writeSSE({
								data: JSON.stringify({
									ok: false,
									error:
										e instanceof Error ? e.message : "Failed to record usage",
								}),
								event: "done",
							});
						}
					}
				} else if (!hadError) {
					await stream.writeSSE({
						data: JSON.stringify({ ok: false, error: "No usage reported" }),
						event: "done",
					});
				}

				if (hadError) {
					await stream.writeSSE({ data: errorMessage, event: "error" });
				}
			} finally {
				clearInterval(heartbeat);
				clearTimeout(timeout);
			}
		});
	});
	return r;
};
