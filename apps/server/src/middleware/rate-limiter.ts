import { cache } from "@nota/cache";
import { createMiddleware } from "hono/factory";
import { banIP, getIP } from "./security";

const WINDOW_IN_SECONDS = 60;
const KNOWN_LIMIT = 120;
const UNKNOWN_LIMIT = 20;

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
	const ip = getIP(c);
	if (ip === "unknown") {
		return next();
	}

	const origin = c.req.header("Origin") || "";
	const isKnownOrigin =
		origin.endsWith(".nota.ink") ||
		origin === "tauri://localhost" ||
		origin === "https://tauri.localhost";

	const limit = isKnownOrigin ? KNOWN_LIMIT : UNKNOWN_LIMIT;

	const currentMinute = Math.floor(Date.now() / 1000 / WINDOW_IN_SECONDS);
	const key = `ratelimit:${ip}:${currentMinute}`;

	const countStr = await cache.get<string | number>(key);
	const count = countStr ? Number(countStr) : 0;

	if (count >= limit) {
		// Spam Threshold: If they exceed the limit by 3x, ban them
		if (count >= limit * 3) {
			await banIP(ip);
		} else {
			// Just increment normally even if they are blocked, to track spam
			await cache.incrby(key, 1);
		}

		return c.json({ error: "Too Many Requests" }, 429);
	}

	// Increment the counter
	if (count === 0) {
		// Set initial value with expiration (current window + 1 minute to be safe)
		await cache.set(key, 1, WINDOW_IN_SECONDS * 2);
	} else {
		await cache.incrby(key, 1);
	}

	await next();
});
