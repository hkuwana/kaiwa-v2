/**
 * Main database schema exports file
 *
 * This file acts as the central hub for all database table definitions in the Kaiwa language learning app.
 * It exports all the schemas in dependency order, making them available throughout the application.
 * The schemas are organized into logical groups: user management, authentication, content/learning,
 * subscriptions/billing, usage tracking, and scenario management.
 */

// Core user management
export { users } from './users';

// Session and authentication
export { session } from './session';
export { emailVerification } from './email-verification';

// Content and learning (MVP focused) - order matters for dependencies
export { languages } from './languages';
export { speakers } from './speakers';
export { scenarios } from './scenarios'; // Simplified for onboarding/comfort
export { conversations } from './conversations';
export { messages } from './messages';
export {
	linguisticMacroSkillEnum,
	linguisticFeatures,
	linguisticFeatureAliases
} from './linguistic-features';

export {
	analysisSuggestionSeverityEnum,
	analysisFindingActionEnum,
	analysisFindings
} from './analysis-findings';
export { userFeatureProfiles } from './user-feature-profiles';

// User preferences (depends on users and languages)
export {
	learningMotivationEnum,
	challengePreferenceEnum,
	correctionStyleEnum,
	userPreferences
} from './user-preferences';

// User settings (global preferences, not language-specific)
export { userSettings } from './user-settings';

// Subscription and billing (simplified)
export { tiers } from './tiers';
export { subscriptions } from './subscriptions';
export { payments } from './payments';

// Usage tracking and analytics
export { userUsage } from './user-usage';
export { conversationSessions } from './conversation-sessions';
export { analyticsEvents } from './analytics-events';

// Learning scenario tracking
export { scenarioAttempts } from './scenario-attempts';
export { scenarioOutcomes } from './scenario-outcomes';

// Newsletter removed; preferences live on userPreferences

// Note: Advanced schemas moved to /v2 for future implementation:
// - userLearningStats, vocabularyProgress, etc.
// - These will be added back as the app grows beyond MVP
