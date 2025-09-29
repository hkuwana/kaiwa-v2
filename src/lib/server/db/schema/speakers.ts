import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { languages } from './languages';

/**
 * Speakers table - Defines AI voice personas for different languages and regions
 *
 * This table stores information about available AI voice speakers that users can
 * choose for conversations. Each speaker represents a specific language, region,
 * dialect, and gender combination (like Japanese male from Tokyo, French female from Paris).
 * It includes voice provider details (OpenAI voice IDs), regional characteristics,
 * and display information like emojis and friendly names for the user interface.
 */
export const speakers = pgTable(
	'speakers',
	{
		id: text('id').primaryKey(), // e.g., 'ja-jp-male'
		languageId: text('language_id')
			.notNull()
			.references(() => languages.id),
		region: text('region').notNull(), // e.g., 'Japan'
		dialectName: text('dialect_name').notNull(), // e.g., 'Japanese'
		bcp47Code: text('bcp47_code').notNull(), // e.g., 'ja-JP'
		speakerEmoji: text('speaker_emoji').notNull(), // e.g., '🇯🇵'
		gender: text('gender').$type<'male' | 'female'>().notNull(),
		voiceName: text('voice_name').notNull(), // e.g., 'Hiro'
		voiceProviderId: text('voice_provider_id').notNull(), // e.g., 'openai-hiro'
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow(),
		openaiVoiceId: text('openai_voice_id').default('alloy')
	},
	(table) => [
		// Performance indexes for speaker queries
		index('speakers_language_id_idx').on(table.languageId),
		index('speakers_is_active_idx').on(table.isActive),
		index('speakers_gender_idx').on(table.gender),
		index('speakers_region_idx').on(table.region),
		// Composite index for active speakers by language
		index('speakers_language_active_idx').on(table.languageId, table.isActive)
	]
);
