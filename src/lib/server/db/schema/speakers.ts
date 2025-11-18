import { pgTable, text, boolean, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { languages } from './languages';

/**
 * Speaker gender enumeration for type safety
 */
export const speakerGenderEnum = pgEnum('speaker_gender', ['male', 'female']);

/**
 * 🗣️ Speakers table - Defines AI voice personas for different languages and regions
 *
 * This table stores information about available AI voice speakers that users can
 * choose for conversations. Each speaker represents a specific language, region,
 * dialect, and gender combination (like Japanese male from Tokyo, French female from Paris).
 * It includes voice provider details (OpenAI voice IDs), regional characteristics,
 * and display information like emojis and friendly names for the user interface.
 *
 * **Key Features:**
 * - 🌍 Multi-language and regional support
 * - 👥 Gender diversity in voice options
 * - 🎭 Distinctive voice personalities and names
 * - 🔗 Integration with OpenAI voice services
 * - 🎨 Rich UI representation with emojis and flags
 * - ✅ Active/inactive status for content management
 *
 * **⚠️ IMPORTANT: voiceName vs openaiVoiceId**
 * - `voiceName`: Display name for the speaker in instructions (e.g., "Minami")
 * - `openaiVoiceId`: Actual OpenAI Realtime API voice ID (e.g., "coral", "alloy", "sage")
 * - When sending to OpenAI, ALWAYS use `openaiVoiceId`, NOT `voiceName`
 * - Bug risk: Using `voiceName` when calling OpenAI APIs causes the API to not recognize the voice
 *
 * @example
 * ```typescript
 * // Create a Japanese female speaker from Osaka (Kansai dialect)
 * await db.insert(speakers).values({
 *   id: 'ja-jp-osaka-female',
 *   languageId: 'ja',
 *   region: 'Osaka',
 *   dialectName: 'Kansai',
 *   bcp47Code: 'ja-JP',
 *   speakerEmoji: '🏯',
 *   gender: 'female',
 *   voiceName: 'Minami',  // Display name for instructions
 *   voiceProviderId: 'openai-osaka',
 *   openaiVoiceId: 'coral'  // Use this when calling OpenAI APIs!
 * });
 * ```
 */
export const speakers = pgTable(
	'speakers',
	{
		id: text('id').primaryKey(),

		languageId: text('language_id')
			.notNull()
			.references(() => languages.id, { onDelete: 'cascade' }),

		region: text('region').notNull(),
		dialectName: text('dialect_name').notNull(),
		bcp47Code: text('bcp47_code').notNull(),
		speakerEmoji: text('speaker_emoji').notNull(),

		gender: speakerGenderEnum('gender').notNull(),

		voiceName: text('voice_name').notNull(),

		voiceProviderId: text('voice_provider_id').notNull(),

		isActive: boolean('is_active').default(true).notNull(),

		createdAt: timestamp('created_at').defaultNow(),

		openaiVoiceId: text('openai_voice_id').default('alloy'),

		characterImageUrl: text('character_image_url'),
		characterImageAlt: text('character_image_alt')
	},
	(table) => [
		// Performance indexes for speaker queries
		index('speakers_language_id_idx').on(table.languageId),
		index('speakers_is_active_idx').on(table.isActive),
		index('speakers_gender_idx').on(table.gender),
		index('speakers_region_idx').on(table.region),
		index('speakers_bcp47_code_idx').on(table.bcp47Code),
		// Composite index for active speakers by language
		index('speakers_language_active_idx').on(table.languageId, table.isActive),
		// Composite index for gender-based filtering
		index('speakers_language_gender_idx').on(table.languageId, table.gender),
		// Index for voice provider queries
		index('speakers_voice_provider_idx').on(table.voiceProviderId)
	]
);
