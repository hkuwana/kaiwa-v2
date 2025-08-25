// Database schema definitions - MVP Focused
// This file exports all table schemas for use throughout the application

// Core user management
export { users } from './users';
export { userPreferences } from './userPreferences';

// Session and authentication
export { session } from './session';

// Content and learning (MVP focused)
export { languages } from './languages';
export { speakers } from './speakers';
export { scenarios } from './scenarios'; // Simplified for onboarding/comfort
export { conversations } from './conversations';
export { messages } from './messages';

// Subscription and billing (simplified)
export { tiers } from './tiers';
export { subscriptions } from './subscriptions';
export { payments } from './payments';

// Usage tracking and analytics
export { userUsage } from './userUsage';
export { conversationSessions } from './conversationSessions';

// Note: Advanced schemas moved to /v2 for future implementation:
// - userLearningStats, vocabularyProgress, scenarioAttempts, etc.
// - These will be added back as the app grows beyond MVP
