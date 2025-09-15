#!/usr/bin/env tsx
// 🌱 Database Seeding Script
// Seeds essential data for development and production

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { languages, tiers } from './schema/index';
import { eq } from 'drizzle-orm';

// Database connection from environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(DATABASE_URL);
const db = drizzle(sql);

// Language data (copied from languages.ts to avoid import issues)
const languageData = [
	{
		id: 'ja',
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		flag: '🇯🇵',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'japanese',
		supportedScripts: ['hiragana', 'katakana', 'kanji'],
		isSupported: true
	},
	{
		id: 'en',
		code: 'en',
		name: 'English',
		nativeName: 'English',
		flag: '🇺🇸',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'es',
		code: 'es',
		name: 'Spanish',
		nativeName: 'Español',
		flag: '🇪🇸',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'fr',
		code: 'fr',
		name: 'French',
		nativeName: 'Français',
		flag: '🇫🇷',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	}
];

console.log('🌱 Starting database seeding...');

async function seedLanguages() {
	console.log('📚 Seeding languages...');

	for (const language of languageData) {
		try {
			// Check if language already exists
			const existing = await db.select().from(languages).where(eq(languages.id, language.id)).limit(1);

			if (existing.length > 0) {
				console.log(`  ✓ Language ${language.name} (${language.id}) already exists`);
				continue;
			}

			// Insert new language
			await db.insert(languages).values({
				id: language.id,
				code: language.code,
				name: language.name,
				nativeName: language.nativeName,
				flag: language.flag,
				isRTL: language.isRTL,
				hasRomanization: language.hasRomanization,
				writingSystem: language.writingSystem,
				supportedScripts: language.supportedScripts,
				isSupported: language.isSupported
			});

			console.log(`  ✅ Inserted language: ${language.name} (${language.id})`);
		} catch (error) {
			console.error(`  ❌ Error inserting language ${language.name}:`, error);
		}
	}
}


async function main() {
	try {
		await seedLanguages();

		console.log('🎉 Database seeding completed successfully!');
		await sql.end();
		process.exit(0);
	} catch (error) {
		console.error('💥 Error during seeding:', error);
		await sql.end();
		process.exit(1);
	}
}

// Run the seeding
main().catch((error) => {
	console.error('💥 Unexpected error:', error);
	process.exit(1);
});