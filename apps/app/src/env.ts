import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
	PUBLIC_SERVER_URL: { public: true, static: true },
	PUBLIC_NOTA_URL: { public: true, static: true },
	PUBLIC_APP_URL: { public: true, static: true },
	PUBLIC_REALTIME_URL: { public: true, static: true },
});
