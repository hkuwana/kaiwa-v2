DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_enum
		WHERE enumlabel = 'roleplay'
			AND enumtypid = 'scenario_role'::regtype
	) THEN
		EXECUTE
			'ALTER TYPE "public"."scenario_role" RENAME VALUE ''roleplay'' TO ''character''';
	END IF;
END;
$$;

ALTER TABLE "scenarios" ADD COLUMN "persona" json;
