import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		POLAR_ACCESS_TOKEN: z.string().min(1),
		POLAR_WEBHOOK_SECRET: z.string().min(1),
		POLAR_PRO_MONTHLY_PLAN_ID: z.string().min(1),
		POLAR_PRO_YEARLY_PLAN_ID: z.string().min(1),
		POLAR_AI_CREDIT_ID: z.string().min(1),
		POLAR_SUCCESS_URL: z.url(),
		CORS_ORIGIN: z.url(),
		VALKEY_URL: z.string().min(1),
		GITHUB_CLIENT_ID: z.string().min(1),
		GITHUB_CLIENT_SECRET: z.string().min(1),
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		RESEND_API_KEY: z.string().min(1),
		R2_REGION: z.string().default("auto"),
		R2_ACCESS_KEY_ID: z.string().min(1),
		R2_SECRET_ACCESS_KEY: z.string().min(1),
		R2_ENDPOINT_URL: z.url(),
		R2_BUCKET_NAME: z.string().min(1),
		R2_PUBLIC_URL: z.url(),
		TURNSILE_SECRET: z.string().min(1),
		RESEND_FROM_EMAIL: z.email(),
		NOTA_AI_API_KEY: z.string().min(1),
		NOTA_AI_PROVIDER: z.preprocess(
			(v) => (v === "others" ? "other" : v),
			z
				.enum([
					"openai",
					"google",
					"anthropic",
					"deepseek",
					"grok",
					"kimi",
					"other",
				])
				.default("other"),
		),
		NOTA_AI_MODEL_ID: z.string().min(1),
		NOTA_AI_INPUT_COST: z.coerce.number().min(0),
		NOTA_AI_OUTPUT_COST: z.coerce.number().min(0),
		NOTA_AI_ENDPOINT: z.string().optional().nullable(),
		PDF_RENDERER_URL: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
