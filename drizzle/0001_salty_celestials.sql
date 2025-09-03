ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "user_preferences_updated_at_idx";--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "learning_goal" SET DATA TYPE learning_motivation_enum;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "learning_goal" SET DEFAULT 'Connection';--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "specific_goals" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "recent_session_scores" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "skill_level_history" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "challenge_preference" SET DATA TYPE challenge_preference_enum;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "correction_style" SET DATA TYPE correction_style_enum;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "skill_level";