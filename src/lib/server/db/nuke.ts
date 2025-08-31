// 🔥 Database Reset Utility
// Enhanced with safety checks and environment awareness

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema/index';

// Load environment variables
dotenv.config();

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create database connection directly for this script
function createDbConnection() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is required');
	}

	const client = postgres(connectionString, {
		max: 1,
		ssl: process.env.NODE_ENV === 'production' ? 'require' : false
	});

	return drizzle(client, { schema });
}

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

	const db = createDbConnection();

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
				
				-- Drop all tables first (this will cascade to constraints)
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
				
				-- Drop all types last (after tables that might reference them)
				FOR r IN (
					SELECT typname 
					FROM pg_type 
					WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
					AND typtype = 'e'  -- Only enum types
				) LOOP
					EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
				END LOOP;
				
				-- Drop remaining types
				FOR r IN (
					SELECT typname 
					FROM pg_type 
					WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
					AND typtype != 'e'  -- Non-enum types
				) LOOP
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
export async function clearDataOnly(): Promise<void> {
	confirmEnvironment();

	console.log('🧹 Clearing all data (keeping schema)...');

	const db = createDbConnection();

	try {
		// Get all table names
		const tables = await db.execute(sql`
			SELECT tablename 
			FROM pg_tables 
			WHERE schemaname = 'public' 
			AND tablename NOT LIKE 'drizzle_%'
		`);

		if (tables.length === 0) {
			console.log('ℹ️  No tables found to clear');
			return;
		}

		// Clear data from each table
		for (const table of tables) {
			const tableName = (table as { tablename: string }).tablename;
			if (tableName && !tableName.startsWith('drizzle_')) {
				try {
					await db.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE`);
					console.log(`🧹 Cleared table: ${tableName}`);
				} catch (error) {
					console.warn(`⚠️  Could not clear table ${tableName}:`, error);
				}
			}
		}

		console.log('✅ Data cleared successfully');
	} catch (error) {
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
				await clearDataOnly();
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
