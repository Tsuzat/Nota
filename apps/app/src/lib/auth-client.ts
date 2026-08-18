import { polarClient } from "@polar-sh/better-auth/client";
import { fetch as fetchTauri } from "@tauri-apps/plugin-http";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { PUBLIC_SERVER_URL } from "$app/env/public";
import { secureStorage } from "./platform/securestorage";
import { ISDESKTOP } from "./utils";

export const authClient = createAuthClient({
	baseURL: PUBLIC_SERVER_URL,
	plugins: [polarClient(), deviceAuthorizationClient()],
	...(ISDESKTOP && {
		fetchOptions: {
			customFetchImpl: fetchTauri,
			onSuccess: (ctx) => {
				const authToken = ctx.response.headers.get("set-auth-token");
				if (authToken) {
					secureStorage.setItem("access_token", authToken);
				}
			},
			auth: {
				type: "Bearer",
				token: () => secureStorage.getItem("access_token"),
			},
		},
	}),
});
