// Database connection and configuration
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema/index.js';

// Import all schemas
export * from './schema/index.js';

// Database connection
const connectionString = env.DATABASE_URL;
if (!connectionString) {
	throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
	max: 1,
	ssl: env.NODE_ENV === 'production' ? 'require' : false
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client };
