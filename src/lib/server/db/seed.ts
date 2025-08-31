// 🌱 Kaiwa MVP Database Seeding
// Phase 1: Essential data for core functionality + monetization

import { db } from './index';
import { users, languages, tiers, subscriptions, payments, analyticsEvents } from './schema';
import type { User, Language, Tier } from './types';
import { sql } from 'drizzle-orm';

// Essential language data for MVP
const mvpLanguages: Omit<Language, 'id'>[] = [
	{
		code: 'en',
		name: 'English',
		nativeName: 'English',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		code: 'es',
		name: 'Spanish',
		nativeName: 'Español',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['hiragana', 'katakana', 'kanji'],
		isSupported: true
	},
	{
		code: 'fr',
		name: 'French',
		nativeName: 'Français',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		code: 'de',
		name: 'German',
		nativeName: 'Deutsch',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		code: 'zh',
		name: 'Chinese',
		nativeName: '中文',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['simplified', 'traditional'],
		isSupported: true
	},
	{
		code: 'ko',
		name: 'Korean',
		nativeName: '한국어',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['hangul', 'hanja'],
		isSupported: true
	},
	{
		code: 'pt',
		name: 'Portuguese',
		nativeName: 'Português',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	}
];

// Tier configuration for MVP
const mvpTiers: Omit<Tier, 'id'>[] = [
	{
		name: 'Free',
		description: 'Perfect for getting started',
		monthlyConversations: 10,
		monthlyMinutes: 30,
		monthlyRealtimeSessions: 3,
		hasRealtimeAccess: true,
		hasAdvancedVoices: false,
		hasAnalytics: false,
		monthlyPriceUsd: '0.00',
		isActive: true
	},
	{
		name: 'plus',
		description: 'For serious language learners',
		monthlyConversations: 100,
		monthlyMinutes: 300,
		monthlyRealtimeSessions: 50,
		hasRealtimeAccess: true,
		hasAdvancedVoices: true,
		hasAnalytics: true,
		monthlyPriceUsd: '9.99',
		isActive: true
	},
	{
		name: 'Premium',
		description: 'Unlimited learning potential',
		monthlyConversations: null,
		monthlyMinutes: null,
		monthlyRealtimeSessions: null,
		hasRealtimeAccess: true,
		hasAdvancedVoices: true,
		hasAnalytics: true,
		monthlyPriceUsd: '19.99',
		isActive: true
	}
];

/**
 * Seed essential languages
 */
export async function seedLanguages(): Promise<void> {
	console.log('🌍 Seeding languages...');

	try {
		const result = await db
			.insert(languages)
			.values(mvpLanguages.map((lang) => ({ id: lang.code, ...lang })))
			.onConflictDoNothing({ target: languages.id })
			.returning();

		console.log(`✅ Seeded ${result.length} new languages`);
	} catch (error) {
		console.error('❌ Error seeding languages:', error);
		throw error;
	}
}

/**
 * Seed tier system
 */
export async function seedTiers(): Promise<void> {
	console.log('🏆 Seeding tiers...');

	try {
		const result = await db
			.insert(tiers)
			.values(mvpTiers.map((tier) => ({ id: tier.name.toLowerCase(), ...tier })))
			.onConflictDoUpdate({
				target: tiers.id,
				set: {
					name: sql`EXCLUDED.name`,
					description: sql`EXCLUDED.description`,
					monthlyConversations: sql`EXCLUDED.monthly_conversations`,
					monthlyMinutes: sql`EXCLUDED.monthly_minutes`,
					monthlyRealtimeSessions: sql`EXCLUDED.monthly_realtime_sessions`,
					hasRealtimeAccess: sql`EXCLUDED.has_realtime_access`,
					hasAdvancedVoices: sql`EXCLUDED.has_advanced_voices`,
					hasAnalytics: sql`EXCLUDED.has_analytics`,
					monthlyPriceUsd: sql`EXCLUDED.monthly_price_usd`,
					isActive: sql`EXCLUDED.is_active`
				}
			})
			.returning();

		console.log(`✅ Seeded/updated ${result.length} tiers`);
	} catch (error) {
		console.error('❌ Error seeding tiers:', error);
		throw error;
	}
}

/**
 * Create system user for internal operations
 */
export async function seedSystemUser(): Promise<void> {
	console.log('🤖 Creating system user...');

	const systemUser: Omit<User, 'id' | 'createdAt' | 'lastUsage'> = {
		googleId: null,
		username: 'system',
		displayName: 'System',
		email: 'system@kaiwa.app',
		avatarUrl: null,
		nativeLanguageId: 'en',
		preferredUILanguageId: 'en',
		tier: 'premium',
		subscriptionStatus: null,
		subscriptionId: null,
		subscriptionExpiresAt: null,
		hashedPassword: null
	};

	try {
		await db.insert(users).values(systemUser).onConflictDoNothing({ target: users.email });

		console.log('✅ System user created/exists');
	} catch (error) {
		console.error('❌ Error creating system user:', error);
		throw error;
	}
}

/**
 * Main seeding function for MVP
 */
export async function seedMVP(): Promise<void> {
	console.log('🚀 Starting MVP database seeding...');

	try {
		await seedLanguages();
		await seedTiers();
		await seedSystemUser();

		console.log('🎉 MVP seeding completed successfully!');
	} catch (error) {
		console.error('💥 MVP seeding failed:', error);
		throw error;
	}
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	seedMVP()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error('Fatal error during seeding:', error);
			process.exit(1);
		});
}
