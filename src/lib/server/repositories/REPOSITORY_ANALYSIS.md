# Repository Analysis & Update Plan

## Current Repository Status

### ✅ Existing Repositories (Updated)
- `conversation.repository.ts` - for `conversations` schema
- `conversationSessions.repository.ts` - for `conversationSessions` schema ✅ UPDATED (removed tierId)
- `language.repository.ts` - for `languages` schema
- `payment.repository.ts` - for `payments` schema
- `scenario.repository.ts` - for `scenarios` schema
- `subscription.repository.ts` - for `subscriptions` schema
- `tier.repository.ts` - for `tiers` schema
- `user.repository.ts` - for `users` schema ✅ UPDATED (removed defaultTier)
- `userUsage.repository.ts` - for `userUsage` schema ✅ UPDATED (removed tierId)
- `vocabulary.repository.ts` - for `vocabularyProgress` schema

### ✅ Newly Created Repositories
- `messages.repository.ts` - for `messages` schema ✅ CREATED
- `userPreferences.repository.ts` - for `userPreferences` schema ✅ CREATED

### ❌ Missing Repositories (Medium Priority)
- `speakers` - No repository exists
- `scenarioOutcomes` - No repository exists
- `scenarioAttempts` - No repository exists
- `analyticsEvents` - No repository exists
- `session` - No repository exists

### 🔄 V2 Schemas (Future Implementation)
- `v2/conversationSessions.ts` - Will need new repository
- `v2/userUsage.ts` - Will need new repository
- `v2/userLearningStats.ts` - Will need new repository
- `v2/userNotifications.ts` - Will need new repository
- `v2/vocabularyProgress.ts` - Will need new repository
- `v2/scenarioAttempts.ts` - Will need new repository
- `v2/scenarioOutcomes.ts` - Will need new repository

## Completed Updates

### 1. ✅ Updated `conversationSessions.repository.ts`
- Removed `tierId` references
- Removed tier-related analytics methods
- Simplified to focus on session tracking only

### 2. ✅ Updated `userUsage.repository.ts`
- Removed `tierId` parameter from methods
- Simplified tier-related logic
- Updated to use seconds instead of minutes
- Added banking functionality

### 3. ✅ Updated `user.repository.ts`
- Removed `defaultTier` references
- Removed tier-related methods
- Simplified to focus on basic user management

### 4. ✅ Created `messages.repository.ts`
- Full CRUD operations for messages
- Conversation-specific message queries
- Search and analytics functionality
- Type-safe preference handling

### 5. ✅ Created `userPreferences.repository.ts`
- Full CRUD operations for user preferences
- Type-safe preference getters/setters
- Upsert functionality
- Preference statistics

## Future Repository Creation Priority

### Medium Priority (Enhanced Features)
1. `speakers.repository.ts` - For voice/speaker management
2. `scenarioOutcomes.repository.ts` - For scenario tracking

### Low Priority (Analytics/Advanced)
3. `analyticsEvents.repository.ts` - For event tracking
4. `session.repository.ts` - For session management

## Schema-Repository Mapping

| Schema | Repository | Status | Notes |
|--------|------------|---------|-------|
| conversations | ✅ conversation.repository.ts | Complete | |
| conversationSessions | ✅ conversationSessions.repository.ts | Updated | Removed tierId |
| messages | ✅ messages.repository.ts | Complete | Newly created |
| users | ✅ user.repository.ts | Updated | Removed defaultTier |
| userUsage | ✅ userUsage.repository.ts | Updated | Removed tierId |
| userPreferences | ✅ userPreferences.repository.ts | Complete | Newly created |
| subscriptions | ✅ subscription.repository.ts | Complete | |
| tiers | ✅ tier.repository.ts | Complete | |
| languages | ✅ language.repository.ts | Complete | |
| scenarios | ✅ scenario.repository.ts | Complete | |
| speakers | ❌ None | Missing | Medium priority |
| payments | ✅ payment.repository.ts | Complete | |
| scenarioOutcomes | ❌ None | Missing | Medium priority |
| scenarioAttempts | ❌ None | Missing | Low priority |
| analyticsEvents | ❌ None | Missing | Low priority |
| session | ❌ None | Missing | Low priority |

## Next Steps

1. **Test the updated repositories** to ensure they work with the cleaned schemas
2. **Create medium-priority repositories** (speakers, scenarioOutcomes) when needed
3. **Plan v2 repository migration** for future advanced features
4. **Update any services** that might be using the old repository methods
