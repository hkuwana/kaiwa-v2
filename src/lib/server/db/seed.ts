#!/usr/bin/env tsx
// 🌱 Database Seeding Script
// Seeds essential data for development and production

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { languages, tiers, speakers, scenarios } from './schema/index';
import { eq } from 'drizzle-orm';

// Import data using relative paths (not using $lib)
import { languages as languageData } from '../../data/languages';
import { speakersData } from '../../data/speakers';
import { scenariosData } from '../../data/scenarios';
import { defaultTierConfigs } from '../../data/tiers';

// Database connection from environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(DATABASE_URL);
const db = drizzle(sql);

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

async function seedSpeakers() {
	console.log('🗣️ Seeding speakers...');

	for (const speaker of speakersData) {
		try {
			// Check if speaker already exists
			const existing = await db.select().from(speakers).where(eq(speakers.id, speaker.id)).limit(1);

			if (existing.length > 0) {
				console.log(`  ✓ Speaker ${speaker.voiceName} (${speaker.id}) already exists`);
				continue;
			}

			// Insert new speaker
			await db.insert(speakers).values({
				id: speaker.id,
				languageId: speaker.languageId,
				region: speaker.region,
				dialectName: speaker.dialectName,
				bcp47Code: speaker.bcp47Code,
				speakerEmoji: speaker.speakerEmoji,
				gender: speaker.gender,
				voiceName: speaker.voiceName,
				voiceProviderId: speaker.voiceProviderId,
				openaiVoiceId: speaker.openaiVoiceId,
				isActive: speaker.isActive,
				createdAt: new Date()
			});

			console.log(`  ✅ Inserted speaker: ${speaker.voiceName} (${speaker.id})`);
		} catch (error) {
			console.error(`  ❌ Error inserting speaker ${speaker.voiceName}:`, error);
		}
	}
}

async function seedScenarios() {
	console.log('🎯 Seeding scenarios...');

	for (const scenario of scenariosData) {
		try {
			// Check if scenario already exists
			const existing = await db.select().from(scenarios).where(eq(scenarios.id, scenario.id)).limit(1);

			if (existing.length > 0) {
				console.log(`  ✓ Scenario ${scenario.title} (${scenario.id}) already exists`);
				continue;
			}

			// Insert new scenario
			await db.insert(scenarios).values({
				id: scenario.id,
				title: scenario.title,
				description: scenario.description,
				category: scenario.category,
				difficulty: scenario.difficulty,
				instructions: scenario.instructions,
				context: scenario.context,
				expectedOutcome: scenario.expectedOutcome,
				learningObjectives: scenario.learningObjectives,
				comfortIndicators: scenario.comfortIndicators,
				isActive: scenario.isActive,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			console.log(`  ✅ Inserted scenario: ${scenario.title} (${scenario.id})`);
		} catch (error) {
			console.error(`  ❌ Error inserting scenario ${scenario.title}:`, error);
		}
	}
}

async function seedTiers() {
	console.log('🏆 Seeding tiers...');

	const tierValues = Object.values(defaultTierConfigs);

	for (const tier of tierValues) {
		try {
			// Check if tier already exists
			const existing = await db.select().from(tiers).where(eq(tiers.id, tier.id)).limit(1);

			if (existing.length > 0) {
				console.log(`  ✓ Tier ${tier.name} (${tier.id}) already exists`);
				continue;
			}

			// Insert new tier
			await db.insert(tiers).values({
				id: tier.id,
				name: tier.name,
				description: tier.description,
				monthlyConversations: tier.monthlyConversations,
				monthlySeconds: tier.monthlySeconds,
				monthlyRealtimeSessions: tier.monthlyRealtimeSessions,
				maxSessionLengthSeconds: tier.maxSessionLengthSeconds,
				sessionBankingEnabled: tier.sessionBankingEnabled,
				maxBankedSeconds: tier.maxBankedSeconds,
				hasRealtimeAccess: tier.hasRealtimeAccess,
				hasAdvancedVoices: tier.hasAdvancedVoices,
				hasAnalytics: tier.hasAnalytics,
				hasCustomPhrases: tier.hasCustomPhrases,
				hasConversationMemory: tier.hasConversationMemory,
				hasAnkiExport: tier.hasAnkiExport,
				monthlyPriceUsd: tier.monthlyPriceUsd,
				annualPriceUsd: tier.annualPriceUsd,
				conversationTimeoutSeconds: tier.conversationTimeoutSeconds,
				warningThresholdSeconds: tier.warningThresholdSeconds,
				canExtend: tier.canExtend,
				maxExtensions: tier.maxExtensions,
				extensionDurationSeconds: tier.extensionDurationSeconds,
				overagePricePerMinuteInCents: tier.overagePricePerMinuteInCents,
				feedbackSessionsPerMonth: tier.feedbackSessionsPerMonth,
				customizedPhrasesFrequency: tier.customizedPhrasesFrequency,
				conversationMemoryLevel: tier.conversationMemoryLevel,
				stripeProductId: tier.stripeProductId,
				stripePriceIdMonthly: tier.stripePriceIdMonthly,
				stripePriceIdAnnual: tier.stripePriceIdAnnual,
				ankiExportLimit: tier.ankiExportLimit,
				maxMemories: tier.maxMemories,
				isActive: tier.isActive,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			console.log(`  ✅ Inserted tier: ${tier.name} (${tier.id})`);
		} catch (error) {
			console.error(`  ❌ Error inserting tier ${tier.name}:`, error);
		}
	}
}

async function main() {
	try {
		await seedLanguages();
		await seedSpeakers();
		await seedScenarios();
		await seedTiers();

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