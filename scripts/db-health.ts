#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { sql } from 'drizzle-orm';

// Load environment variables
config();

async function healthCheck() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error('❌ DATABASE_URL environment variable is not set');
		process.exit(1);
	}

	try {
		console.log('🔍 Checking database connection...');

		// Create connection
		const client = postgres(databaseUrl);
		const db = drizzle(client);

		// Test connection with a simple query
		const result = await db.execute(sql`SELECT 1 as test`);

		if (result && result.length > 0) {
			console.log('✅ Database connection successful');
		} else {
			console.log('⚠️  Database connection test returned unexpected result');
		}

		// Close connection
		await client.end();

		console.log('✅ Database health check passed');
	} catch (error) {
		console.error('❌ Database health check failed:', error);
		process.exit(1);
	}
}

// Run health check
healthCheck().catch((error) => {
	console.error('❌ Health check script failed:', error);
	process.exit(1);
});
