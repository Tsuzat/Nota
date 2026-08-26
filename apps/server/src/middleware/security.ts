import { cache } from "@nota/cache";
import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { createMiddleware } from "hono/factory";

/**
 * Extracts the IP address from the request headers.
 * Priority: Cloudflare > X-Real-IP > X-Forwarded-For > Bun conn info
 */
export const getIP = (c: Context): string => {
	const cf = c.req.header("CF-Connecting-IP");
	if (cf?.trim()) return cf.trim();
	const realIp = c.req.header("X-Real-IP");
	if (realIp?.trim()) return realIp.trim();
	const xff = c.req.header("X-Forwarded-For");
	if (xff?.trim()) {
		// XFF can be "client, proxy1, proxy2"
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	// Fallback to Bun's connection info (works when not behind Cloudflare)
	try {
		const info = getConnInfo(c);
		const addr =
			(info as unknown as { remote?: { address?: string } })?.remote?.address ??
			(info as unknown as { address?: string })?.address;
		if (addr) return addr;
	} catch {
		// ignore
	}
	return "unknown";
};

export const BAN_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const SEVEN_DAYS_SECONDS = BAN_DURATION_SECONDS;

/**
 * Bans an IP address by storing it in Redis for 7 days
 */
export const banIP = async (
	ip: string,
	durationSeconds: number = BAN_DURATION_SECONDS,
) => {
	if (!ip || ip === "unknown") return;
	await cache.set(`banned_ip:${ip}`, true, durationSeconds);
	const days = (durationSeconds / 86400).toFixed(1);
	console.log(
		`[Security] Banned IP: ${ip} for ${durationSeconds}s (${days} days)`,
	);
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

/**
 * Anything touching these substrings is a scanner / bot.
 * Keep lowercase – we compare against lowercased pathname.
 */
const BLACKLISTED_SUBSTRINGS = [
	"/.env",
	"/.git",
	"/wp-",
	"/wordpress",
	"/wp-content",
	"/wp-includes",
	"/wp-admin",
	"/wp-login",
	"/xmlrpc",
	"/wlwmanifest",
	"/phpinfo",
	"/config.php",
	"/.aws",
	"/.ssh",
	"/backup",
	"/admin.php",
	"/shell",
];

/** File extensions that this app never serves – instant honeypot */
const BLACKLISTED_EXTENSIONS = [
	".php",
	".asp",
	".aspx",
	".cgi",
	".pl",
	".jsp",
	".env",
];

/**
 * Middleware that instantly bans IPs probing known vulnerable paths.
 * Any match results in a 7-day ban.
 */
export const pathBlacklistMiddleware = createMiddleware(async (c, next) => {
	const rawPath = new URL(c.req.url).pathname;
	// decode URI to catch encoded probes like %2e%2e, normalize double slashes, lowercase
	let path: string;
	try {
		path = decodeURIComponent(rawPath).toLowerCase();
	} catch {
		path = rawPath.toLowerCase();
	}

	// Collapse // -> / for matching, but still treat //abcd.php as .php
	const normalized = path.replace(/\/+/g, "/");

	const hasBlacklistedExtension = BLACKLISTED_EXTENSIONS.some((ext) =>
		normalized.endsWith(ext),
	);
	const hasBlacklistedSubstring = BLACKLISTED_SUBSTRINGS.some((p) =>
		normalized.includes(p),
	);

	// Bare hidden-file probes like /.env, /.git/, /.DS_Store – but allow ACME
	const isHiddenProbe =
		/\/\.[^/]+/.test(normalized) &&
		!normalized.startsWith("/.well-known/") &&
		normalized !== "/.well-known";

	const isBlacklisted =
		hasBlacklistedExtension || hasBlacklistedSubstring || isHiddenProbe;

	if (isBlacklisted) {
		const ip = getIP(c);
		// Explicit 7-day ban – overrides default if caller passes custom duration
		await banIP(ip, BAN_DURATION_SECONDS);
		if (ip !== "unknown") {
			console.warn(
				`[Security] Honeypot hit: ${rawPath} from ${ip} -> banned ${BAN_DURATION_SECONDS}s`,
			);
		} else {
			console.warn(
				`[Security] Honeypot hit: ${rawPath} from unknown IP (headers: CF=${c.req.header("CF-Connecting-IP") ?? "-"}, XFF=${c.req.header("X-Forwarded-For") ?? "-"}, RealIP=${c.req.header("X-Real-IP") ?? "-"})`,
			);
		}
		return c.json({ error: "Forbidden" }, 403);
	}

	await next();
});
