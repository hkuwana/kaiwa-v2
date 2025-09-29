import { pgTable, text, boolean, json, index } from 'drizzle-orm/pg-core';

/**
 * Languages table - Defines supported languages and their characteristics
 *
 * This table stores information about all languages supported by the Kaiwa app.
 * It includes language codes (ISO 639-1), display names in English and native script,
 * writing system details (Latin, Chinese, Arabic, etc.), supported scripts
 * (hiragana, katakana, kanji for Japanese), and technical features like
 * right-to-left text support and romanization availability.
 */
export const languages = pgTable(
	'languages',
	{
		id: text('id').primaryKey(), // e.g., 'ja'
		code: text('code').notNull().unique(), // ISO 639-1 e.g., 'ja'
		name: text('name').notNull(), // e.g., 'Japanese'
		nativeName: text('native_name').notNull(), // e.g., '日本語'
		isRTL: boolean('is_rtl').default(false).notNull(),
		flag: text('flag').notNull(),
		hasRomanization: boolean('has_romanization').default(true).notNull(),
		writingSystem: text('writing_system').notNull(), // 'latin', 'chinese', etc.
		supportedScripts: json('supported_scripts').$type<string[]>(), // ['hiragana', 'katakana', 'kanji']
		isSupported: boolean('is_supported').default(true).notNull()
	},
	(table) => [
		// Performance indexes for language queries
		index('languages_code_idx').on(table.code),
		index('languages_writing_system_idx').on(table.writingSystem),
		index('languages_is_supported_idx').on(table.isSupported)
	]
);
