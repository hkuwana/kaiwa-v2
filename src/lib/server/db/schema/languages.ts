import { pgTable, text, boolean, json } from 'drizzle-orm/pg-core';

// Languages - enhanced to match kaiwa-old structure
export const languages = pgTable('languages', {
	id: text('id').primaryKey(), // e.g., 'ja'
	code: text('code').notNull().unique(), // ISO 639-1 e.g., 'ja'
	name: text('name').notNull(), // e.g., 'Japanese'
	nativeName: text('native_name').notNull(), // e.g., '日本語'
	isRTL: boolean('is_rtl').default(false).notNull(),
	hasRomanization: boolean('has_romanization').default(true).notNull(),
	writingSystem: text('writing_system').notNull(), // 'latin', 'chinese', etc.
	supportedScripts: json('supported_scripts').$type<string[]>(), // ['hiragana', 'katakana', 'kanji']
	isSupported: boolean('is_supported').default(true).notNull()
});
