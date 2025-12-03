ALTER TABLE "scenarios" ADD COLUMN "target_languages" json;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "default_speaker_id" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "learning_path_slug" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "learning_path_order" integer;--> statement-breakpoint
CREATE INDEX "scenarios_learning_path_slug_idx" ON "scenarios" USING btree ("learning_path_slug");--> statement-breakpoint
CREATE INDEX "scenarios_learning_path_order_idx" ON "scenarios" USING btree ("learning_path_slug","learning_path_order");--> statement-breakpoint
CREATE INDEX "scenarios_default_speaker_idx" ON "scenarios" USING btree ("default_speaker_id");