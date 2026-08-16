import type { AppRouterClient } from "@nota/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/svelte-query";
import { fetch as fetchTauri } from "@tauri-apps/plugin-http";
import { PUBLIC_SERVER_URL } from "$app/env/public";
import { secureStorage } from "./platform/securestorage";
import { ISDESKTOP } from "./utils";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			console.error(`Error: ${error.message}`);
		},
	}),
});

const desktoplink = new RPCLink({
	url: `${PUBLIC_SERVER_URL}/rpc`,
	headers: async () => {
		const token = await secureStorage.getItem("access_token");
		return {
			Authorization: `Bearer ${token || ""}`,
		};
	},
	fetch(url, options) {
		return fetchTauri(url, {
			...options,
			credentials: "include",
		});
	},
});

const weblink = new RPCLink({
	url: `${PUBLIC_SERVER_URL}/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

export const link = ISDESKTOP ? desktoplink : weblink;

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
