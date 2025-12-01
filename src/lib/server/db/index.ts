// Database connection and configuration
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Import all schemas
export * from './schema/index';

// Lazy initialization of database connection
let _db: PostgresJsDatabase<typeof schema> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Helper to get environment variables (works in both SvelteKit and standalone scripts)
function getEnv(key: string): string | undefined {
	// Try to import SvelteKit env (only works in SvelteKit runtime)
	try {
		// Dynamic import that may fail in standalone scripts
		const { env } = require('$env/dynamic/private');
		return env[key];
	} catch {
		// Fall back to process.env for standalone scripts
		return process.env[key];
	}
}

function initializeDb() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	if (_db) return { db: _db, client: _client! };

	// Database connection
	const connectionString = getEnv('DATABASE_URL');
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is required');
	}

	// Create postgres client
	// Note: Connection pool size - increase for better concurrency
	// Development: 5 connections should be enough
	// Production: Consider 10-20 depending on your database plan limits
	const isProduction = getEnv('NODE_ENV') === 'production';
	_client = postgres(connectionString, {
		max: isProduction ? 10 : 5,
		idle_timeout: 20, // Close idle connections after 20 seconds
		connect_timeout: 30, // 30 second connection timeout
		ssl: isProduction ? 'require' : false
	});

	// Create drizzle instance with schema
	_db = drizzle(_client, { schema });

	return { db: _db, client: _client };
}

// Export lazy getters
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
	get(_target, prop) {
		const { db } = initializeDb();
		return db[prop as keyof typeof db];
	}
});

export const client = new Proxy({} as ReturnType<typeof postgres>, {
	get(_target, prop) {
		const { client } = initializeDb();
		return client[prop as keyof typeof client];
	}
});
