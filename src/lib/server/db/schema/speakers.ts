import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { languages } from './languages';

// Speakers - for voice selection and language practice
export const speakers = pgTable('speakers', {
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
	createdAt: timestamp('created_at').defaultNow()
});
