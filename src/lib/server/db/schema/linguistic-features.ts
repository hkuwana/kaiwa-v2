import {
	pgTable,
	text,
	timestamp,
	jsonb,
	boolean,
	index,
	pgEnum,
	uuid
} from 'drizzle-orm/pg-core';
import { languages } from './languages';

/**
 * Linguistic Features table - Defines language learning rules and micro-skills
 *
 * This table stores the linguistic knowledge base used for language analysis.
 * It contains grammar rules, vocabulary patterns, pronunciation features, and other
 * language-specific micro-skills organized by macro categories (grammar, lexis,
 * pragmatics, etc.). Each feature includes CEFR level references and coaching copy
 * for providing educational feedback to users. Used by the AI analysis system
 * to identify and explain language learning opportunities.
 */

export const linguisticMacroSkillEnum = pgEnum('linguistic_macro_skill', [
	'grammar',
	'lexis',
	'pragmatics',
	'discourse',
	'pronunciation',
	'fluency',
	'sociolinguistic'
]);

export const linguisticFeatures = pgTable(
	'linguistic_features',
	{
		id: text('id').primaryKey(),
		languageId: text('language_id').references(() => languages.id),
		macroSkill: linguisticMacroSkillEnum('macro_skill').notNull(),
		subSkill: text('sub_skill').notNull(),
		microRule: text('micro_rule').notNull(),
		cefrReferences: jsonb('cefr_references').$type<string[]>().default([]).notNull(),
		coachingCopy: text('coaching_copy'),
		isActive: boolean('is_active').default(true).notNull(),
		metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index('linguistic_features_language_idx').on(table.languageId),
		index('linguistic_features_macro_skill_idx').on(table.macroSkill),
		index('linguistic_features_sub_skill_idx').on(table.subSkill)
	]
);

export const linguisticFeatureAliases = pgTable(
	'linguistic_feature_aliases',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		featureId: text('feature_id')
			.notNull()
			.references(() => linguisticFeatures.id, { onDelete: 'cascade' }),
		languageId: text('language_id').references(() => languages.id),
		alias: text('alias').notNull(),
		notes: text('notes'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('linguistic_feature_aliases_feature_idx').on(table.featureId),
		index('linguistic_feature_aliases_alias_idx').on(table.alias)
	]
);
