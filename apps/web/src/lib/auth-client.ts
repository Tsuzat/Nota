import { polarClient } from "@polar-sh/better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { PUBLIC_SERVER_URL } from "$app/env/public";
import { toast } from "@nota/ui";

export const authClient = createAuthClient({
	// better-auth derives its route-matching base from this URL's path, so the
	// public auth path must equal the server-side mount (/api/auth everywhere)
	baseURL: PUBLIC_SERVER_URL,
	plugins: [polarClient(), deviceAuthorizationClient()],
	fetchOptions: {
        onError: async (context) => {
            const { response } = context;
            if (response.status === 429) {
                const retryAfter = response.headers.get("X-Retry-After");
				toast.warning(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
            }
        },
    }
});
