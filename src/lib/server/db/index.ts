// Database connection and configuration
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema/index';

// Import all schemas
export * from './schema/index';

// Database connection
const connectionString = env.DATABASE_URL;
if (!connectionString) {
	throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
// Note: Connection pool size - increase for better concurrency
// Development: 5 connections should be enough
// Production: Consider 10-20 depending on your database plan limits
const isProduction = env.NODE_ENV === 'production';
const client = postgres(connectionString, {
	max: isProduction ? 10 : 5,
	idle_timeout: 20, // Close idle connections after 20 seconds
	connect_timeout: 30, // 30 second connection timeout
	ssl: isProduction ? 'require' : false
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client };
