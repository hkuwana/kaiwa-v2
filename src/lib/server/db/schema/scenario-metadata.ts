import { pgTable, text, integer, real, timestamp, index } from 'drizzle-orm/pg-core';
import { scenarios } from './scenarios';

/**
 * 📊 Scenario Metadata table - App-wide aggregate metrics for scenarios
 *
 * This table stores denormalized metrics about each scenario at the app level.
 * It aggregates engagement data (saves, usage count, attempts) and quality metrics
 * (ratings, completion rate) across all users to enable fast queries for trending
 * or popular scenarios. This avoids expensive aggregation joins.
 *
 * **Key Features:**
 * - ✅ One row per scenario for O(1) metric lookups
 * - 📈 Aggregated engagement metrics across all users
 * - ⭐ Quality metrics (ratings, completion rate)
 * - 🚀 Fast queries for "trending", "most saved", "top rated"
 * - 📊 Incrementally updated (not recomputed from scratch)
 *
 * **Updates**:
 * - amountSavedCount: Incremented when user saves/unsaves
 * - totalTimesUsed: Incremented when user completes scenario
 * - totalAttempts: Incremented when user attempts scenario
 * - averageRating & ratingsCount: Updated when user rates
 * - completionRate: Computed as (totalTimesUsed / totalAttempts)
 *
 * @example
 * ```typescript
 * // Get trending scenarios (most used)
 * const trending = await db
 *   .select()
 *   .from(scenarioMetadata)
 *   .orderBy(desc(scenarioMetadata.totalTimesUsed))
 *   .limit(10);
 * ```
 */
export const scenarioMetadata = pgTable(
	'scenario_metadata',
	{
		// One row per scenario
		scenarioId: text('scenario_id')
			.primaryKey()
			.references(() => scenarios.id, { onDelete: 'cascade' }),

		// Engagement metrics (aggregate across all users)
		amountSavedCount: integer('amount_saved_count').default(0).notNull(),
		totalTimesUsed: integer('total_times_used').default(0).notNull(),
		totalAttempts: integer('total_attempts').default(0).notNull(),

		// Quality metrics
		averageRating: real('average_rating'), // 1-5 stars, null if no ratings
		ratingsCount: integer('ratings_count').default(0).notNull(),

		// Computed efficiency
		completionRate: real('completion_rate'), // percentage: (totalTimesUsed / totalAttempts) * 100
		averageTimeSpent: integer('average_time_spent'), // seconds, computed from all attempts

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// Quick access to most popular scenarios
		index('scenario_metadata_saved_count_idx').on(table.amountSavedCount),
		index('scenario_metadata_times_used_idx').on(table.totalTimesUsed),
		index('scenario_metadata_rating_idx').on(table.averageRating)
	]
);
