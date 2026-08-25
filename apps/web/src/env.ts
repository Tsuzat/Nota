import { defineEnvVars } from "@sveltejs/kit/env";
import z from "zod";

export const variables = defineEnvVars({
	PUBLIC_SERVER_URL: { public: true, static: true },
	GITHUB_API_TOKEN: {
		schema: z.string().min(1),
	},
	PUBLIC_NOTA_APP_URL: {
		public: true,
		static: true,
	},
	PUBLIC_NOTA_URL: {
		public: true,
		static: true,
	},
});
