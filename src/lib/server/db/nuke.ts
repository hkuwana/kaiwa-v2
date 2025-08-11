// 🔥 Database Reset Utility
// Enhanced with safety checks and environment awareness

import { sql } from 'drizzle-orm';
import { db } from './index.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Safety check to prevent accidental production resets
 */
function confirmEnvironment(): void {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('🚨 DANGER: Cannot reset production database!');
	}

	if (!isDev && !isTest) {
		console.log('⚠️  Environment not set to development or test');
		console.log('Current NODE_ENV:', process.env.NODE_ENV);
		console.log('Are you sure you want to continue? (This is irreversible)');
	}
}

/**
 * Drop all tables, sequences, and functions in the public schema
 */
export async function dropAllTables(): Promise<void> {
	confirmEnvironment();

	console.log('🔥 Dropping all database objects...');

	try {
		// Drop everything in the correct order to handle dependencies
		await db.execute(sql`
			DO $$ 
			DECLARE
				r RECORD;
			BEGIN
				-- Drop all views first
				FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
					EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
				END LOOP;
				
				-- Drop all tables
				FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
					EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
				END LOOP;
				
				-- Drop all sequences
				FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
					EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
				END LOOP;
				
				-- Drop all functions
				FOR r IN (
					SELECT proname, oidvectortypes(proargtypes) as args
					FROM pg_proc 
					INNER JOIN pg_namespace ns ON (pg_proc.pronamespace = ns.oid) 
					WHERE ns.nspname = 'public'
				) LOOP
					EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
				END LOOP;
				
				-- Drop all types
				FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
					EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
				END LOOP;
			END $$;
		`);

		console.log('✅ All database objects dropped successfully');
	} catch (error) {
		console.error('❌ Error during database reset:', error);
		throw error;
	}
}

/**
 * Reset database to clean state
 */
export async function resetDatabase(): Promise<void> {
	console.log('🚀 Starting complete database reset...');
	console.log(`Environment: ${process.env.NODE_ENV}`);

	await dropAllTables();

	console.log('✅ Database reset complete!');
	console.log('');
	console.log('Next steps:');
	console.log('1. Run: pnpm db:push        # Recreate schema');
	console.log('2. Run: pnpm db:seed:dev    # Seed with initial data');
}

/**
 * Soft reset - only clear data, keep schema
 */
export async function clearData(): Promise<void> {
	confirmEnvironment();

	console.log('🧹 Clearing all data (keeping schema)...');

	try {
		// Get all table names
		const result = await db.execute(sql`
			SELECT tablename 
			FROM pg_tables 
			WHERE schemaname = 'public' 
			ORDER BY tablename;
		`);

		const tables = result.map((row) => (row as any).tablename);

		// Disable foreign key checks temporarily
		await db.execute(sql`SET session_replication_role = replica;`);

		// Truncate all tables
		for (const table of tables) {
			await db.execute(sql.raw(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`));
			console.log(`  Cleared: ${table}`);
		}

		// Re-enable foreign key checks
		await db.execute(sql`SET session_replication_role = DEFAULT;`);

		console.log('✅ All data cleared successfully');
		console.log('Schema preserved - you can now re-seed with: pnpm db:seed:dev');
	} catch (error) {
		// Make sure to re-enable foreign key checks even if something fails
		try {
			await db.execute(sql`SET session_replication_role = DEFAULT;`);
		} catch {}

		console.error('❌ Error clearing data:', error);
		throw error;
	}
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
	const command = process.argv[2];

	const runCommand = async () => {
		switch (command) {
			case 'reset':
			case 'nuke':
				await resetDatabase();
				break;
			case 'clear':
			case 'truncate':
				await clearData();
				break;
			default:
				console.log('Available commands:');
				console.log('  reset/nuke    - Drop all tables and recreate');
				console.log('  clear/truncate - Clear data but keep schema');
				console.log('');
				console.log('Usage: node nuke.ts [command]');
				process.exit(1);
		}
	};

	runCommand()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error('💥 Command failed:', error);
			process.exit(1);
		});
}
