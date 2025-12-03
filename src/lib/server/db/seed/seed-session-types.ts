/**
 * Seed script for session types
 *
 * Run with: npx tsx src/lib/server/db/seed/seed-session-types.ts
 *
 * This populates the session_types table with the default session types
 * for the adaptive learning system.
 */

import { db } from '../index';
import { sessionTypes, DEFAULT_SESSION_TYPES } from '../schema';
import { sql } from 'drizzle-orm';

async function seedSessionTypes() {
	console.log('🌱 Seeding session types...\n');

	try {
		// Check if session types already exist
		const existing = await db.select({ count: sql<number>`count(*)` }).from(sessionTypes);
		const count = existing[0]?.count ?? 0;

		if (count > 0) {
			console.log(`ℹ️  Session types table already has ${count} records.`);
			console.log('   Use --force to overwrite.\n');

			if (!process.argv.includes('--force')) {
				console.log('✅ Skipping seed (use --force to overwrite)\n');
				return;
			}

			console.log('⚠️  --force flag detected, clearing existing records...\n');
			await db.delete(sessionTypes);
		}

		// Insert default session types
		console.log('📝 Inserting session types:\n');

		for (const sessionType of DEFAULT_SESSION_TYPES) {
			console.log(`   ${sessionType.icon} ${sessionType.name}`);
			console.log(
				`      Duration: ${sessionType.durationMinutesMin}-${sessionType.durationMinutesMax} min`
			);
			console.log(`      Category: ${sessionType.category}`);
			console.log(`      Exchanges: ${sessionType.targetExchanges}`);
			console.log('');
		}

		await db.insert(sessionTypes).values(
			DEFAULT_SESSION_TYPES.map((st) => ({
				...st,
				// Ensure the category is properly typed
				category: st.category as 'warmup' | 'practice' | 'challenge' | 'review'
			}))
		);

		console.log(`✅ Successfully seeded ${DEFAULT_SESSION_TYPES.length} session types!\n`);

		// Verify insertion
		const verification = await db.select().from(sessionTypes);
		console.log('📊 Verification:');
		console.log(`   Total records in table: ${verification.length}\n`);

		console.log('🎉 Session types seed complete!\n');
	} catch (error) {
		console.error('❌ Error seeding session types:', error);
		process.exit(1);
	}
}

// Run if called directly
seedSessionTypes()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

export { seedSessionTypes };
