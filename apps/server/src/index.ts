import { createContext } from "@nota/api/context";
import { appRouter } from "@nota/api/routers/index";
import { auth } from "@nota/auth";
import { env } from "@nota/env/server";
import { hocuspocus } from "@nota/realtime";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { upgradeWebSocket, websocket } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { rateLimitMiddleware } from "./middleware/rate-limiter";
import { banMiddleware, pathBlacklistMiddleware } from "./middleware/security";

const app = new Hono();

app.use(logger());
app.use(bodyLimit({ maxSize: 5 * 1024 * 1024 })); // 5MB limit
app.use("/*", banMiddleware);
app.use("/*", pathBlacklistMiddleware);
app.use("/*", rateLimitMiddleware);
app.use(
	"/*",
	cors({
		origin: (origin) => {
			if (origin.endsWith(".nota.ink")) return origin;
			if (
				origin === "tauri://localhost" ||
				origin === "https://tauri.localhost"
			)
				return origin;
			return env.CORS_ORIGIN;
		},
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get(
	"/collaboration",
	upgradeWebSocket((c) => {
		let clientConnection: ReturnType<
			typeof hocuspocus.handleConnection
		> | null = null;
		let msgTimestamps: number[] = [];

		return {
			onOpen(_event, ws) {
				console.log("[WebSocket] onOpen");
				try {
					const socket = {
						send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
							if (typeof data === "string" || data instanceof ArrayBuffer) {
								ws.send(data);
							} else if (ArrayBuffer.isView(data)) {
								const buf = new Uint8Array(new ArrayBuffer(data.byteLength));
								buf.set(
									new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
								);
								ws.send(buf);
							}
						},
						close: (code?: number, reason?: string) => {
							ws.close(code, reason);
						},
						get readyState() {
							return ws.readyState;
						},
					};

					clientConnection = hocuspocus.handleConnection(socket, c.req.raw);
				} catch (e) {
					console.error("[Hocuspocus] Error in handleConnection:", e);
				}
			},
			onMessage(event) {
				if (!clientConnection) return;

				// WebSocket Message Rate Limiting
				const now = Date.now();
				msgTimestamps.push(now);
				msgTimestamps = msgTimestamps.filter((t) => now - t < 1000);
				if (msgTimestamps.length > 50) {
					console.warn(
						"[WebSocket] Message rate limit exceeded for connection",
					);
					// @ts-expect-error - The standard WebSocket type might lack this signature, but hono/bun handles it.
					// We'll close gracefully by not parsing further, which will trigger client-side disconnects.
					if ("close" in event.target) {
						(event.target as any).close(1008, "Rate Limit Exceeded");
					}
					return;
				}

				let data: Uint8Array;
				if (event.data instanceof Uint8Array) {
					data = event.data;
				} else if (event.data instanceof ArrayBuffer) {
					data = new Uint8Array(event.data);
				} else if (typeof event.data === "string") {
					data = new TextEncoder().encode(event.data);
				} else if (
					ArrayBuffer.isView(event.data) &&
					event.data.buffer instanceof ArrayBuffer
				) {
					data = new Uint8Array(
						event.data.buffer,
						event.data.byteOffset,
						event.data.byteLength,
					);
				} else {
					return;
				}
				clientConnection.handleMessage(data);
			},
			onClose(event) {
				console.log("[WebSocket] onClose");
				if (clientConnection) {
					clientConnection.handleClose({
						code: event?.code,
						reason: event?.reason,
					});
				}
			},
			onError(error) {
				console.error("[WebSocket] onError", error);
			},
		};
	}),
);

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: context,
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context: context,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c) => {
	return c.text("OK");
});

export default {
	fetch: app.fetch,
	websocket,
};
