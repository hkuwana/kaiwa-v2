// Database connection and configuration
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Conditional import of SvelteKit env using top-level await
// This will work in SvelteKit runtime, but fail in standalone scripts
let svelteKitEnv: Record<string, string> | undefined;
try {
	const module = await import('$env/dynamic/private');
	svelteKitEnv = module.env;
} catch {
	// Not in SvelteKit context - standalone script mode
	// Will use process.env instead (loaded by dotenv in package.json scripts)
}

// Import all schemas
export * from './schema/index';

// Lazy initialization of database connection
let _db: PostgresJsDatabase<typeof schema> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Helper to get environment variables (works in both SvelteKit and standalone scripts)
function getEnv(key: string): string | undefined {
	// In SvelteKit: use $env/dynamic/private (loaded above)
	// In standalone tsx scripts: use process.env (loaded by dotenv CLI)
	return svelteKitEnv?.[key] || process.env[key];
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
