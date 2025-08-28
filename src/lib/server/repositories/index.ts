// Repository layer - Business logic and data access
// This file exports all repositories for use throughout the application

// Core user management repositories
export { userRepository } from './user.repository';
export { languageRepository } from './language.repository';
export { userPreferencesRepository } from './userPreferences.repository';
export { sessionRepository } from './session.repository';

// Content and learning repositories
export { scenarioRepository } from './scenario.repository';
export { conversationRepository } from './conversation.repository';
export { messagesRepository } from './messages.repository';

// Subscription and billing repositories
export { tierRepository } from './tier.repository';
export { subscriptionRepository } from './subscription.repository';
export { paymentRepository } from './payment.repository';

// Usage tracking and analytics repositories
export { userUsageRepository } from './userUsage.repository';
export { conversationSessionsRepository } from './conversationSessions.repository';

// Note: Additional repositories can be added here as they are created:
// - vocabularyRepository (requires v2 schema exports)
// - speakersRepository (for voice/speaker management)
// - scenarioOutcomesRepository (for scenario tracking)
// - analyticsEventsRepository (for event tracking)
// - sessionRepository (for session management)
// etc.
