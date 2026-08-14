CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assets_note_idx` ON `assets` (`note_id`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`parent_note_id` text,
	`icon` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`content_text` text,
	`starred` integer DEFAULT false NOT NULL,
	`trashed_at` integer,
	`created_at` integer DEFAULT '"2026-08-13T22:07:07.845Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2026-08-13T22:07:07.845Z"' NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notes_workspace_idx` ON `notes` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `notes_parent_idx` ON `notes` (`parent_note_id`);--> statement-breakpoint
CREATE INDEX `notes_trashed_idx` ON `notes` (`trashed_at`);--> statement-breakpoint
CREATE INDEX `notes_starred_idx` ON `notes` (`starred`);--> statement-breakpoint
CREATE TABLE `notes_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`label` text,
	`kind` text NOT NULL,
	`content_compressed` blob NOT NULL,
	`content_hash` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `snapshot_note_created_idx` ON `notes_snapshot` (`note_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `snapshot_note_hash_idx` ON `notes_snapshot` (`note_id`,`content_hash`);--> statement-breakpoint
CREATE TABLE `workspace` (
	`id` text PRIMARY KEY NOT NULL,
	`icon` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT '"2026-08-13T22:07:07.844Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2026-08-13T22:07:07.845Z"' NOT NULL
);
