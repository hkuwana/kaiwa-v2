ALTER TYPE "public"."scenario_role" RENAME VALUE 'roleplay' TO 'character';

ALTER TABLE "scenarios" ADD COLUMN "persona" json;
