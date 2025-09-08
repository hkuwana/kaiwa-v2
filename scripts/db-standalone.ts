// Standalone database connection for migration scripts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema/index.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
	max: 1,
	ssl: process.env.NODE_ENV === 'production' ? 'require' : false
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client };