DROP TABLE "sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "userworkspaces" RENAME COLUMN "icons" TO "icon";--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "encrypted_password" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token_expires_at" timestamp with time zone;