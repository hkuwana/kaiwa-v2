#!/usr/bin/env tsx

// 🗄️ Database Migration Script
// Runs the migration to add speakers table and enhance languages

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
	console.log('🚀 Starting database migration...');

	// Check for DATABASE_URL
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error('❌ DATABASE_URL environment variable is required');
		process.exit(1);
	}

	try {
		// Create database connection
		const client = postgres(databaseUrl);
		const db = drizzle(client);

		console.log('📖 Reading migration file...');

		// Read the migration SQL file
		const migrationPath = join(
			process.cwd(),
			'drizzle',
			'0001_add_speakers_and_enhance_languages.sql'
		);
		const migrationSQL = readFileSync(migrationPath, 'utf-8');

		console.log('🔧 Executing migration...');

		// Execute the migration
		await client.unsafe(migrationSQL);

		console.log('✅ Migration completed successfully!');
		console.log('📊 Added speakers table with 48 speakers');
		console.log('🌍 Enhanced languages table with 17 languages');
		console.log('🎯 Updated schema with writing systems and scripts');

		// Close connection
		await client.end();
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

// Run the migration
runMigration().catch(console.error);
