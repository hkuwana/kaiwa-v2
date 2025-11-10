/**
 * 🗄️ Main database schema exports file
 *
 * This file acts as the central hub for all database table definitions in the Kaiwa language learning app.
 * It exports all the schemas in dependency order, making them available throughout the application.
 * The schemas are organized into logical groups: user management, authentication, content/learning,
 * subscriptions/billing, usage tracking, and scenario management.
 *
 * **Schema Organization:**
 * - 👤 **User Management**: Core user data, preferences, and settings
 * - 🔐 **Authentication**: Sessions, email verification, and security
 * - 🌍 **Content & Learning**: Languages, speakers, conversations, and messages
 * - 💳 **Billing & Subscriptions**: Tiers, subscriptions, and payments
 * - 📊 **Analytics & Usage**: Tracking, events, and user behavior
 * - 🎭 **Scenarios**: Learning scenarios, attempts, and outcomes
 *
 * **Important Notes:**
 * - 📁 Advanced schemas are in `/v2` folder for future implementation
 * - 🔄 Deprecated schemas are marked with @deprecated JSDoc
 * - 🎯 All schemas include comprehensive JSDoc documentation
 * - ⚡ Performance indexes are optimized for common queries
 */

// 👤 Core user management
export { users } from './users';

// 🔐 Session and authentication
export { session } from './session';
export { emailVerification } from './email-verification';

// 🌍 Content and learning (MVP focused) - order matters for dependencies
export { languages } from './languages';
export { speakers, speakerGenderEnum } from './speakers';
export { scenarios, scenarioDifficultyEnum, scenarioVisibilityEnum } from './scenarios'; // Simplified for onboarding/comfort
export { conversations } from './conversations';
export { messages } from './messages';
export { messageAudioAnalysis } from './message-audio-analysis';
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

// 🎯 User preferences (depends on users and languages)
export {
	learningMotivationEnum,
	challengePreferenceEnum,
	correctionStyleEnum,
	userPreferences
} from './user-preferences';

// ⚙️ User settings (global preferences, not language-specific)
export {
	userSettings,
	audioModeEnum,
	pressBehaviorEnum,
	greetingModeEnum,
	themeEnum
	// practiceReminderFrequencyEnum, // TODO: Uncomment when DB migration is ready
	// dayOfWeekEnum // TODO: Uncomment when DB migration is ready
} from './user-settings';

// 💳 Subscription and billing (simplified)
export { tiers, memoryLevelEnum, phraseFrequencyEnum } from './tiers';
export { subscriptions, subscriptionTierEnum } from './subscriptions';
export { payments, paymentStatusEnum } from './payments';

// 📊 Usage tracking and analytics
export { userUsage } from './user-usage';
export { conversationSessions } from './conversation-sessions';
export { analyticsEvents } from './analytics-events';

// 🎭 Learning scenario tracking (replaced scenario-attempts & scenario-outcomes)
export { scenarioMetadata } from './scenario-metadata';
export { userScenarioProgress } from './user-scenario-progress';

// 📝 Note: Newsletter removed; preferences live on userPreferences

// 🚀 Advanced schemas moved to /v2 for future implementation:
// - userLearningStats, vocabularyProgress, etc.
// - These will be added back as the app grows beyond MVP
// - See v2/index.ts for available advanced schemas
