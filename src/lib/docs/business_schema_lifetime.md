# 📊 Suggested Lifetime Usage Schema

## Option 1: Enhanced userUsage (Recommended for MVP)

Add these fields to your existing `userUsage` table:

```typescript
// Feature usage (based on your tiers)
ankiExportsUsed: integer('anki_exports_used').default(0),
customPhrasesCreated: integer('custom_phrases_created').default(0),
advancedVoiceSeconds: integer('advanced_voice_seconds').default(0),
sessionExtensionsUsed: integer('session_extensions_used').default(0),

// Quality metrics
completedSessions: integer('completed_sessions').default(0),
averageSessionLength: integer('average_session_length').default(0),
longestSession: integer('longest_session').default(0),

// Revenue tracking
overageSeconds: integer('overage_seconds').default(0),
tierWhenUsed: text('tier_when_used').default('free'),

// Last activity
lastConversationAt: timestamp('last_conversation_at'),
lastRealtimeAt: timestamp('last_realtime_at'),
```

## Option 2: Separate userLifetimeStats Table

```typescript
export const userLifetimeStats = pgTable('user_lifetime_stats', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id),

	// All-time totals
	totalConversations: integer('total_conversations').default(0),
	totalSeconds: integer('total_seconds').default(0),
	totalRealtimeSessions: integer('total_realtime_sessions').default(0),

	// Feature usage lifetime
	totalAnkiExports: integer('total_anki_exports').default(0),
	totalCustomPhrases: integer('total_custom_phrases').default(0),
	totalAdvancedVoiceSeconds: integer('total_advanced_voice_seconds').default(0),
	totalSessionExtensions: integer('total_session_extensions').default(0),

	// Engagement metrics
	daysActive: integer('days_active').default(0),
	longestStreak: integer('longest_streak').default(0),
	currentStreak: integer('current_streak').default(0),
	averageSessionsPerMonth: integer('average_sessions_per_month').default(0),

	// Milestones
	firstConversationAt: timestamp('first_conversation_at'),
	lastActiveAt: timestamp('last_active_at'),

	// Subscription history
	monthsSubscribed: integer('months_subscribed').default(0),
	totalRevenue: decimal('total_revenue', { precision: 10, scale: 2 }).default('0.00'),
	highestTierReached: text('highest_tier_reached').default('free'),

	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});
```

## Option 3: Both (Recommended for Scale)

- **userUsage**: Monthly data with enhanced feature tracking
- **userLifetimeStats**: Aggregated lifetime metrics updated via triggers or cron jobs

## Key Benefits:

### 📈 **Analytics & Insights**

- Track feature adoption rates per tier
- Identify power users vs casual users
- See which features drive retention

### 💰 **Monetization**

- Track overage usage for potential billing
- Identify upgrade opportunities
- Measure feature value by tier

### 🎯 **Product Development**

- See which features are actually used
- Track session quality and engagement
- Identify drop-off points

### 📊 **User Experience**

- Show users their progress/milestones
- Gamification opportunities
- Personalized recommendations

## Implementation Priority:

1. **Phase 1**: Add feature usage to existing userUsage table
2. **Phase 2**: Add lifetime stats table for dashboard/analytics
3. **Phase 3**: Add advanced engagement metrics

## Example Usage Service Updates:

```typescript
// Record feature usage
await usageService.recordUsage(userId, {
	conversations: 1,
	seconds: 300,
	ankiExports: 1, // New
	customPhrasesCreated: 2, // New
	completedSessions: 1 // New
});

// Check feature limits
const canExport = await usageService.canUseFeature(userId, {
	type: 'anki_export',
	monthlyLimit: tierConfig.ankiExportLimit
});
```
