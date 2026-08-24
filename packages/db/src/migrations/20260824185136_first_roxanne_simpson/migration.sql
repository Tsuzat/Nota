ALTER TABLE "publish" DROP COLUMN "content_hash";--> statement-breakpoint
ALTER TABLE "publish" ADD CONSTRAINT "publish_slug_key" UNIQUE("slug");