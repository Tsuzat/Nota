CREATE TABLE "passkey" (
	"id" text PRIMARY KEY,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
DROP TABLE "verification";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "issuer" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" ("issuer","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deviceCode_deviceCode_uidx" ON "device_code" ("device_code");--> statement-breakpoint
CREATE UNIQUE INDEX "deviceCode_userCode_uidx" ON "device_code" ("user_code");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" ("credential_id");--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;