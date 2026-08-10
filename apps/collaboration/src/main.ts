import { Hocuspocus } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { Redis } from "@hocuspocus/extension-redis";
import { parseCookie } from "cookie";
import { z } from "zod/v4";
import { type BufferSource, type HeadersInit } from "bun";

// ─── Environment ────────────────────────────────────────────────────────────────
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";
const PORT = Number(process.env.PORT) || 1234;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_USERNAME = process.env.REDIS_USERNAME;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
// Use REDIS_TLS=true for public/external Redis endpoints.
// Railway's private network (*.railway.internal) does NOT need TLS.
const REDIS_TLS = process.env.REDIS_TLS === "true";

const redisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  options: {
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    ...(REDIS_TLS ? { tls: {} } : {}),
  },
};

// ─── Zod schema for the backend's collab access response ────────────────────────
const CollabAccessResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: z.object({
    user_id: z.uuid(),
    user_name: z.string(),
    user_avatar: z.string(),
    role: z.string(),
    read_only: z.boolean(),
  }),
});

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Extract the raw access_token from the WebSocket connection.
 *
 * - Desktop: token is set directly on the HocuspocusProvider and arrives as
 *   `payloadToken` in the onAuthenticate callback.
 * - Web: token is read from the `access_token` HTTP cookie sent by the browser.
 */
function extractAccessToken(request: Request, payloadToken?: string): string {
  // Desktop path — token supplied by @hocuspocus/provider
  if (payloadToken) {
    return payloadToken;
  }

  // Web path — token in the browser cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = parseCookie(cookieHeader);
    const cookieToken = cookies["access_token"];
    if (cookieToken) return cookieToken;
  }

  throw new Error(
    "No access token found: expected a provider token (desktop) or an access_token cookie (web).",
  );
}

/**
 * Common headers for all internal backend calls.
 */
function internalHeaders(accessToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    "X-Internal-Api-Key": INTERNAL_API_KEY,
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}

// ─── Hocuspocus ─────────────────────────────────────────────────────────────────
const hocuspocus = new Hocuspocus({
  name: "Nota Collaboration",
  extensions: [new Logger(), new Redis(redisOptions)],
  timeout: 30000,
  debounce: 5000,
  maxDebounce: 30000,
  // Raise queue limits so burst sync/awareness before ~800ms onAuthenticate
  // doesn't kill the socket with `unauthenticated queue length exceeded`.
  maxUnauthenticatedQueueMessages: 5000,
  maxUnauthenticatedQueueSize: 50 * 1024 * 1024,
  quiet: true,

  // 1. AUTHENTICATE — verify user access via backend
  async onAuthenticate(data) {
    const { request, documentName, token } = data;
    const t0 = performance.now();

    const accessToken = extractAccessToken(request, token);
    console.log(
      `[auth] "${documentName}" token=...${accessToken.slice(-6)} url=${request.url}`,
    );

    const noteId = documentName.replace("note:", "");

    // Call the backend's collab access-check endpoint.
    // The backend handles JWT + session validation and collaborator lookup.
    const res = await fetch(
      `${INTERNAL_API_URL}/api/v1/collab/notes/${noteId}`,
      {
        headers: internalHeaders(accessToken),
        signal: AbortSignal.timeout(5000),
      },
    );

    const authMs = Math.round(performance.now() - t0);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn(
        `[auth] failed for "${documentName}" in ${authMs}ms status=${res.status}`,
      );
      throw new Error(
        (body as { error?: string }).error || "Not authorized for this note",
      );
    }

    const parsed = CollabAccessResponseSchema.parse(await res.json());
    const { data: access } = parsed;

    // Attach the access token to the connection context so onStoreDocument
    // can use it without re-parsing cookies.
    console.log(
      `[auth] user=${access.user_id} role=${access.role} doc="${documentName}" (${authMs}ms)`,
    );
    return {
      user: {
        id: access.user_id,
        name: access.user_name,
        avatar: access.user_avatar,
        role: access.role,
        readOnly: access.read_only,
      },
      token: accessToken,
    };
  },

  // 2. LOAD — fetch initial Y.js state when the first client opens a doc
  async onLoadDocument(data) {
    const noteId = data.documentName.replace("note:", "");

    const res = await fetch(
      `${INTERNAL_API_URL}/api/v1/collab/notes/${noteId}/ydoc`,
      { headers: internalHeaders() },
    );

    // 404 means brand-new doc — Hocuspocus starts with an empty Y.Doc
    if (res.status === 404) return;

    if (!res.ok) {
      console.error(`[load] backend returned ${res.status} for note ${noteId}`);
      return;
    }

    const buffer = await res.arrayBuffer();
    const { applyUpdate } = await import("yjs");
    applyUpdate(data.document, new Uint8Array(buffer));
  },

  // 3. STORE — debounced save, and on last-client-disconnect
  async onStoreDocument(data) {
    const noteId = data.documentName.replace("note:", "");
    const { encodeStateAsUpdate } = await import("yjs");
    const update = encodeStateAsUpdate(data.document);

    const res = await fetch(
      `${INTERNAL_API_URL}/api/v1/collab/notes/${noteId}/ydoc`,
      {
        method: "PUT",
        headers: {
          ...internalHeaders(data.lastContext.token),
          "Content-Type": "application/octet-stream",
        },
        body: Buffer.from(update),
      },
    );

    if (!res.ok) {
      console.error(
        `[store] backend returned ${res.status} for note ${noteId}`,
      );
    }
  },
});

// ─── Bun Native WebSocket Server ────────────────────────────────────────────────
interface WsData {
  request: Request;
  clientConnection: ReturnType<typeof hocuspocus.handleConnection> | null;
}

const server = Bun.serve<WsData>({
  port: PORT,

  fetch(req, server) {
    if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
      const success = server.upgrade(req, {
        data: { request: req, clientConnection: null },
      });
      if (success) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    return new Response("Nota Collaboration Server", { status: 200 });
  },

  websocket: {
    open(ws) {
      // Wrap the Bun WebSocket into the shape Hocuspocus expects
      const wsLike = {
        get readyState() {
          return ws.readyState;
        },
        send(data: string | ArrayBufferLike | Uint8Array | ArrayBufferView) {
          ws.send(data as string | BufferSource);
        },
        close(code?: number, reason?: string) {
          ws.close(code, reason);
        },
        addEventListener() {},
        removeEventListener() {},
      };
      ws.data.clientConnection = hocuspocus.handleConnection(
        wsLike,
        ws.data.request,
      );
    },

    message(ws, message) {
      const data =
        message instanceof ArrayBuffer
          ? new Uint8Array(message)
          : typeof message === "string"
            ? new TextEncoder().encode(message)
            : new Uint8Array(message);
      ws.data.clientConnection?.handleMessage(data);
    },

    close(ws, code, reason) {
      ws.data.clientConnection?.handleClose({ code, reason });
    },
  },
});

console.log(
  `\n  Nota Collaboration Server  →  ws://${server.hostname}:${server.port}\n`,
);
