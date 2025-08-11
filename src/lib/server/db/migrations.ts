// 🔄 Database Migration Utilities
// Handles schema migrations across different phases

import { db } from './index.js';
import { sql } from 'drizzle-orm';

/**
 * Phase 1: Create MVP tables if they don't exist
 * This is a safety net for development environments
 */
export async function ensureMVPTables(): Promise<void> {
	console.log('🔧 Ensuring MVP tables exist...');

	try {
		// Check if core tables exist
		const result = await db.execute(sql`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name IN ('users', 'languages', 'tiers', 'conversations', 'messages', 'user_usage');
		`);

		const existingTables = result.map((row) => (row as any).table_name);
		const requiredTables = [
			'users',
			'languages',
			'tiers',
			'conversations',
			'messages',
			'user_usage'
		];
		const missingTables = requiredTables.filter((table) => !existingTables.includes(table));

		if (missingTables.length > 0) {
			console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
			console.log('Please run: pnpm db:push');
		} else {
			console.log('✅ All MVP tables exist');
		}
	} catch (error) {
		console.error('❌ Error checking tables:', error);
		throw error;
	}
}

/**
 * Phase 2: Add advanced features tables
 */
export async function migrateToPhase2(): Promise<void> {
	console.log('🚀 Migrating to Phase 2 (Advanced Features)...');

	// This will be implemented when we move to Phase 2
	// Will add tables for: scenarios, practice_sessions, learning_paths, etc.

	console.log('📝 Phase 2 migration not yet implemented');
}

/**
 * Phase 3: Add monetization and analytics
 */
export async function migrateToPhase3(): Promise<void> {
	console.log('💰 Migrating to Phase 3 (Monetization & Analytics)...');

	// This will be implemented when we move to Phase 3
	// Will add tables for: subscriptions, payments, analytics, etc.

	console.log('📝 Phase 3 migration not yet implemented');
}

/**
 * Clean up development data (useful for testing)
 */
export async function cleanupDevData(): Promise<void> {
	console.log('🧹 Cleaning up development data...');

	try {
		// Delete test conversations but keep system data
		await db.execute(sql`
			DELETE FROM messages 
			WHERE conversation_id IN (
				SELECT id FROM conversations 
				WHERE user_id != (SELECT id FROM users WHERE email = 'system@kaiwa.app')
			);
		`);

		await db.execute(sql`
			DELETE FROM conversations 
			WHERE user_id != (SELECT id FROM users WHERE email = 'system@kaiwa.app');
		`);

		await db.execute(sql`
			DELETE FROM user_usage 
			WHERE user_id != (SELECT id FROM users WHERE email = 'system@kaiwa.app');
		`);

		console.log('✅ Development data cleaned');
	} catch (error) {
		console.error('❌ Error cleaning data:', error);
		throw error;
	}
}

/**
 * Database health check
 */
export async function healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
	const issues: string[] = [];

	try {
		// Check if we can connect
		await db.execute(sql`SELECT 1`);

		// Check if essential tables exist
		const tables = await db.execute(sql`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public';
		`);

		const tableNames = tables.map((row) => (row as any).table_name);
		const requiredTables = ['users', 'languages', 'tiers'];

		for (const table of requiredTables) {
			if (!tableNames.includes(table)) {
				issues.push(`Missing required table: ${table}`);
			}
		}

		// Check if we have basic seed data
		const languageCount = await db.execute(sql`SELECT COUNT(*) FROM languages`);
		if ((languageCount[0] as any).count === '0') {
			issues.push('No languages seeded');
		}

		const tierCount = await db.execute(sql`SELECT COUNT(*) FROM tiers`);
		if ((tierCount[0] as any).count === '0') {
			issues.push('No tiers seeded');
		}

		return {
			healthy: issues.length === 0,
			issues
		};
	} catch (error) {
		return {
			healthy: false,
			issues: [`Database connection failed: ${error}`]
		};
	}
}
