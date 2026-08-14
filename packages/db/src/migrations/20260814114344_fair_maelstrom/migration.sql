CREATE TYPE "guest_role" AS ENUM('viewer', 'comment', 'editor', 'admin');--> statement-breakpoint
CREATE TYPE "plan_tier" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "publish_status" AS ENUM('published', 'unpublished');--> statement-breakpoint
CREATE TYPE "snapshot_kind" AS ENUM('auto', 'manual', 'pinned');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY,
	"note_id" text NOT NULL,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_guests" (
	"id" text PRIMARY KEY,
	"note_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "guest_role" DEFAULT 'viewer'::"guest_role" NOT NULL,
	"invited_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_snapshots" (
	"id" text PRIMARY KEY,
	"note_id" text NOT NULL,
	"created_by" text,
	"label" text,
	"kind" "snapshot_kind" NOT NULL,
	"content_compressed" bytea NOT NULL,
	"content_hash" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY,
	"workspace_id" text NOT NULL,
	"parent_note_id" text,
	"owner_id" text NOT NULL,
	"icon" text,
	"name" text NOT NULL,
	"description" text,
	"content" bytea NOT NULL,
	"context_text" text,
	"content_vector" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(context_text, ''))) STORED,
	"starred" boolean DEFAULT false NOT NULL,
	"trashed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publish" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content_html" text NOT NULL,
	"content_hash" text NOT NULL,
	"status" "publish_status" DEFAULT 'published'::"publish_status" NOT NULL,
	"should_index" boolean DEFAULT true NOT NULL,
	"published_by" text NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quota" (
	"user_id" text PRIMARY KEY,
	"plan_tier" "plan_tier" DEFAULT 'free'::"plan_tier" NOT NULL,
	"ai_credit_balance_cents" bigint DEFAULT 0 NOT NULL,
	"assigned_storage_bytes" bigint DEFAULT 524288000 NOT NULL,
	"used_storage_bytes" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"icon" text,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "assets_note_idx" ON "assets" ("note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "note_guests_note_user_uq" ON "note_guests" ("note_id","user_id");--> statement-breakpoint
CREATE INDEX "note_guests_note_idx" ON "note_guests" ("note_id");--> statement-breakpoint
CREATE INDEX "note_guests_user_idx" ON "note_guests" ("user_id");--> statement-breakpoint
CREATE INDEX "snapshots_note_created_idx" ON "note_snapshots" ("note_id","created_at");--> statement-breakpoint
CREATE INDEX "snapshots_note_kind_idx" ON "note_snapshots" ("note_id","kind");--> statement-breakpoint
CREATE INDEX "snapshots_note_hash_idx" ON "note_snapshots" ("note_id","content_hash");--> statement-breakpoint
CREATE INDEX "notes_workspace_idx" ON "notes" ("workspace_id");--> statement-breakpoint
CREATE INDEX "notes_parent_idx" ON "notes" ("parent_note_id");--> statement-breakpoint
CREATE INDEX "notes_trashed_idx" ON "notes" ("trashed_at");--> statement-breakpoint
CREATE INDEX "notes_starred_idx" ON "notes" ("starred");--> statement-breakpoint
CREATE INDEX "notes_search_idx" ON "notes" USING gin ("content_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "publish_slug_uq" ON "publish" ("slug");--> statement-breakpoint
CREATE INDEX "workspace_owner_idx" ON "workspace" ("owner_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_note_id_notes_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "note_guests" ADD CONSTRAINT "note_guests_note_id_notes_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "note_guests" ADD CONSTRAINT "note_guests_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "note_guests" ADD CONSTRAINT "note_guests_invited_by_user_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "note_snapshots" ADD CONSTRAINT "note_snapshots_note_id_notes_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "note_snapshots" ADD CONSTRAINT "note_snapshots_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_workspace_id_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_parent_note_id_notes_id_fkey" FOREIGN KEY ("parent_note_id") REFERENCES "notes"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "publish" ADD CONSTRAINT "publish_id_notes_id_fkey" FOREIGN KEY ("id") REFERENCES "notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "publish" ADD CONSTRAINT "publish_published_by_user_id_fkey" FOREIGN KEY ("published_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "user_quota" ADD CONSTRAINT "user_quota_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;