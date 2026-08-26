CREATE TABLE "ai_ledger" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"note_id" text,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"used_input_cost" numeric(14,6) NOT NULL,
	"used_output_cost" numeric(14,6) NOT NULL,
	"total_cost_cents" numeric(14,6) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_quota" ALTER COLUMN "ai_credit_balance_cents" SET DATA TYPE numeric(14,6) USING "ai_credit_balance_cents"::numeric(14,6);--> statement-breakpoint
ALTER TABLE "user_quota" ALTER COLUMN "ai_credit_balance_cents" SET DEFAULT '0';--> statement-breakpoint
CREATE INDEX "ai_ledger_user_idx" ON "ai_ledger" ("user_id");--> statement-breakpoint
CREATE INDEX "ai_ledger_user_created_idx" ON "ai_ledger" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_ledger_note_idx" ON "ai_ledger" ("note_id");--> statement-breakpoint
ALTER TABLE "ai_ledger" ADD CONSTRAINT "ai_ledger_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_ledger" ADD CONSTRAINT "ai_ledger_note_id_notes_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE SET NULL;