ALTER TABLE "userworkspaces" DROP CONSTRAINT "userworkspaces_owner_users_id_fk";
--> statement-breakpoint
ALTER TABLE "userworkspaces" ADD CONSTRAINT "userworkspaces_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;