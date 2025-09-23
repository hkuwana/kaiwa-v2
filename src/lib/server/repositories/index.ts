// Repository layer - Business logic and data access
// This file exports all repositories for use throughout the application

// Core user management repositories
export { userRepository } from './user.repository';
export { languageRepository } from './language.repository';
export { userPreferencesRepository } from './user-preferences.repository';
export { userSettingsRepository } from './user-settings.repository';
export { sessionRepository } from './session.repository';
export { emailVerificationRepository } from './email-verification.repository';

// Content and learning repositories
export { scenarioRepository } from './scenario.repository';
export { conversationRepository } from './conversation.repository';
export { messagesRepository } from './messages.repository';
export { speakersRepository } from './speakers.repository';
export { scenarioAttemptsRepository } from './scenario-attempts.repository';
export { scenarioOutcomesRepository } from './scenario-outcomes.repository';

// Subscription and billing repositories
export { subscriptionRepository } from './subscription.repository';
export { paymentRepository } from './payment.repository';

// Usage tracking and analytics repositories
export { userUsageRepository } from './user-usage.repository';
export { conversationSessionsRepository } from './conversation-sessions.repository';
export { analyticsEventsRepository } from './analytics-events.repository';

// Note: Additional repositories can be added here as they are created:
// - vocabularyRepository (requires v2 schema exports)
// etc.
