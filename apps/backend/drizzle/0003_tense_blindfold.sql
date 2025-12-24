ALTER TABLE "users" ALTER COLUMN "subscription_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "assigned_storage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "used_storage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "next_billing_at" timestamp with time zone;