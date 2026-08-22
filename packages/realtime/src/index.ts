import { Logger } from "@hocuspocus/extension-logger";
import { Redis } from "@hocuspocus/extension-redis";
import { Hocuspocus } from "@hocuspocus/server";
import { env } from "@nota/env/server";
import { onAuthenticate } from "./hooks/on-authenticate";
import { onLoadDocument } from "./hooks/on-load-document";
import { onStoreDocument } from "./hooks/on-store-document";

const parseRedisUrl = (url: string) => {
	const parsed = new URL(url);
	return {
		host: parsed.hostname,
		port: Number.parseInt(parsed.port || "6379", 10),
		options: {
			username: parsed.username
				? decodeURIComponent(parsed.username)
				: undefined,
			password: parsed.password
				? decodeURIComponent(parsed.password)
				: undefined,
		},
	};
};

export const hocuspocus = new Hocuspocus({
	name: "nota-realtime",
	extensions: [new Logger(), new Redis(parseRedisUrl(env.VALKEY_URL))],
	onAuthenticate,
	onLoadDocument,
	onStoreDocument,
	async onConnect(data) {
		console.log(
			`[Hocuspocus] onConnect: ${data.documentName} (ID: ${data.socketId})`,
		);
	},
	async onDisconnect(data) {
		console.log(
			`[Hocuspocus] onDisconnect: ${data.documentName} (ID: ${data.socketId})`,
		);
	},
	async onUpgrade(data) {
		console.log(`[Hocuspocus] onUpgrade: ${data.request.url}`);
	},
	async onRequest(data) {
		console.log(`[Hocuspocus] onRequest: ${data.request.url}`);
	},
});
