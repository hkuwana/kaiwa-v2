CREATE TYPE "public"."analysis_finding_action" AS ENUM('pending', 'accepted', 'ignored', 'dismissed_auto');--> statement-breakpoint
CREATE TYPE "public"."analysis_suggestion_severity" AS ENUM('info', 'hint', 'warning');--> statement-breakpoint
CREATE TYPE "public"."linguistic_macro_skill" AS ENUM('grammar', 'lexis', 'pragmatics', 'discourse', 'pronunciation', 'fluency', 'sociolinguistic');--> statement-breakpoint
CREATE TABLE "analysis_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"language_id" text,
	"conversation_id" text NOT NULL,
	"message_id" text NOT NULL,
	"feature_id" text NOT NULL,
	"module_id" text,
	"run_id" text,
	"severity" "analysis_suggestion_severity" DEFAULT 'hint' NOT NULL,
	"action_status" "analysis_finding_action" DEFAULT 'pending' NOT NULL,
	"action_updated_at" timestamp,
	"offset_start" integer,
	"offset_end" integer,
	"original_text" text,
	"suggested_text" text,
	"explanation" text,
	"example" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linguistic_feature_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_id" text NOT NULL,
	"language_id" text,
	"alias" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linguistic_features" (
	"id" text PRIMARY KEY NOT NULL,
	"language_id" text,
	"macro_skill" "linguistic_macro_skill" NOT NULL,
	"sub_skill" text NOT NULL,
	"micro_rule" text NOT NULL,
	"cefr_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"coaching_copy" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feature_profiles" (
	"user_id" uuid NOT NULL,
	"feature_id" text NOT NULL,
	"language_id" text,
	"occurrence_count" integer DEFAULT 0 NOT NULL,
	"clean_run_count" integer DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp,
	"last_mastered_at" timestamp,
	"mastery_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"review_priority" numeric(5, 2) DEFAULT '1' NOT NULL,
	"streak_length" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_feature_profiles_user_id_feature_id_pk" PRIMARY KEY("user_id","feature_id")
);
--> statement-breakpoint
ALTER TABLE "analysis_findings" ADD CONSTRAINT "analysis_findings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_findings" ADD CONSTRAINT "analysis_findings_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_findings" ADD CONSTRAINT "analysis_findings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_findings" ADD CONSTRAINT "analysis_findings_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_findings" ADD CONSTRAINT "analysis_findings_feature_id_linguistic_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."linguistic_features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linguistic_feature_aliases" ADD CONSTRAINT "linguistic_feature_aliases_feature_id_linguistic_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."linguistic_features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linguistic_feature_aliases" ADD CONSTRAINT "linguistic_feature_aliases_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linguistic_features" ADD CONSTRAINT "linguistic_features_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_profiles" ADD CONSTRAINT "user_feature_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_profiles" ADD CONSTRAINT "user_feature_profiles_feature_id_linguistic_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."linguistic_features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_profiles" ADD CONSTRAINT "user_feature_profiles_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_findings_user_idx" ON "analysis_findings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analysis_findings_conversation_idx" ON "analysis_findings" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "analysis_findings_message_idx" ON "analysis_findings" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "analysis_findings_feature_idx" ON "analysis_findings" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "analysis_findings_language_idx" ON "analysis_findings" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX "analysis_findings_action_idx" ON "analysis_findings" USING btree ("action_status");--> statement-breakpoint
CREATE INDEX "analysis_findings_severity_idx" ON "analysis_findings" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "linguistic_feature_aliases_feature_idx" ON "linguistic_feature_aliases" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "linguistic_feature_aliases_alias_idx" ON "linguistic_feature_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "linguistic_features_language_idx" ON "linguistic_features" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX "linguistic_features_macro_skill_idx" ON "linguistic_features" USING btree ("macro_skill");--> statement-breakpoint
CREATE INDEX "linguistic_features_sub_skill_idx" ON "linguistic_features" USING btree ("sub_skill");--> statement-breakpoint
CREATE INDEX "user_feature_profiles_feature_idx" ON "user_feature_profiles" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "user_feature_profiles_language_idx" ON "user_feature_profiles" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX "user_feature_profiles_priority_idx" ON "user_feature_profiles" USING btree ("review_priority");