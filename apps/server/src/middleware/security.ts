import { cache } from "@nota/cache";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";

/**
 * Extracts the IP address from the request headers.
 * Uses CF-Connecting-IP (Cloudflare) or X-Forwarded-For, falling back to standard methods if not found.
 */
export const getIP = (c: Context): string => {
	const cf = c.req.header("CF-Connecting-IP");
	if (cf) return cf;
	const xff = c.req.header("X-Forwarded-For");
	if (xff) return xff.split(",")[0]?.trim() || "unknown";
	return "unknown";
};

const BAN_DURATION_SECONDS = 15 * 60; // 15 minutes

/**
 * Bans an IP address by storing it in Redis
 */
export const banIP = async (ip: string) => {
	if (ip === "unknown") return;
	await cache.set(`banned_ip:${ip}`, true, BAN_DURATION_SECONDS);
	console.log(`[Security] Banned IP: ${ip} for ${BAN_DURATION_SECONDS}s`);
};

/**
 * Middleware that blocks requests from banned IPs
 */
export const banMiddleware = createMiddleware(async (c, next) => {
	const ip = getIP(c);
	if (ip !== "unknown") {
		const isBanned = await cache.get<boolean>(`banned_ip:${ip}`);
		if (isBanned) {
			return c.json({ error: "Access Denied" }, 403);
		}
	}
	await next();
});

const BLACKLISTED_PATHS = [
	"/.env",
	"/wp-admin",
	"/wp-login.php",
	"/.git",
	"/phpinfo.php",
	"/config.php",
];

/**
 * Middleware that instantly bans IPs trying to access known vulnerable paths
 */
export const pathBlacklistMiddleware = createMiddleware(async (c, next) => {
	const path = new URL(c.req.url).pathname;

	const isBlacklisted = BLACKLISTED_PATHS.some(
		(p) => path.includes(p) || path.endsWith(".php"),
	);

	if (isBlacklisted) {
		const ip = getIP(c);
		await banIP(ip);
		return c.json({ error: "Forbidden" }, 403);
	}

	await next();
});
