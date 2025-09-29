import { pgTable, uuid, text, integer, timestamp, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { messages } from './messages';
import { conversations } from './conversations';
import { languages } from './languages';
import { linguisticFeatures } from './linguistic-features';

/**
 * Analysis Findings - AI-generated language learning suggestions
 *
 * Stores AI analysis results for user messages including grammar corrections,
 * vocabulary suggestions, and learning feedback. Users can accept/ignore suggestions.
 */

export const analysisSuggestionSeverityEnum = pgEnum('analysis_suggestion_severity', [
	'info',
	'hint',
	'warning'
]);

export const analysisFindingActionEnum = pgEnum('analysis_finding_action', [
	'pending',
	'accepted',
	'ignored',
	'dismissed_auto'
]);

export const analysisFindings = pgTable(
	'analysis_findings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		languageId: text('language_id').references(() => languages.id),
		conversationId: text('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		messageId: text('message_id')
			.notNull()
			.references(() => messages.id, { onDelete: 'cascade' }),
		featureId: text('feature_id')
			.notNull()
			.references(() => linguisticFeatures.id),
		moduleId: text('module_id'),
		runId: text('run_id'),
		severity: analysisSuggestionSeverityEnum('severity').default('hint').notNull(),
		actionStatus: analysisFindingActionEnum('action_status').default('pending').notNull(),
		actionUpdatedAt: timestamp('action_updated_at'),

		// Text analysis
		offsetStart: integer('offset_start'),
		offsetEnd: integer('offset_end'),
		originalText: text('original_text'),
		suggestedText: text('suggested_text'),
		explanation: text('explanation'),
		example: text('example'),

		metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index('analysis_findings_user_idx').on(table.userId),
		index('analysis_findings_conversation_idx').on(table.conversationId),
		index('analysis_findings_message_idx').on(table.messageId),
		index('analysis_findings_feature_idx').on(table.featureId),
		index('analysis_findings_language_idx').on(table.languageId),
		index('analysis_findings_action_idx').on(table.actionStatus),
		index('analysis_findings_severity_idx').on(table.severity)
	]
);
