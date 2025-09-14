// Repository layer - Business logic and data access
// This file exports all repositories for use throughout the application

// Core user management repositories
export { userRepository } from './user.repository';
export { languageRepository } from './language.repository';
export { userPreferencesRepository } from './userPreferences.repository';
export { sessionRepository } from './session.repository';
export { emailVerificationRepository } from './emailVerification.repository';

// Content and learning repositories
export { scenarioRepository } from './scenario.repository';
export { conversationRepository } from './conversation.repository';
export { messagesRepository } from './messages.repository';
export { speakersRepository } from './speakers.repository';
export { scenarioAttemptsRepository } from './scenarioAttempts.repository';
export { scenarioOutcomesRepository } from './scenarioOutcomes.repository';

// Subscription and billing repositories
// Note: subscriptionRepository removed - using simplified payment.service.ts instead
export { paymentRepository } from './payment.repository';

// Usage tracking and analytics repositories
export { userUsageRepository } from './userUsage.repository';
export { conversationSessionsRepository } from './conversationSessions.repository';
export { analyticsEventsRepository } from './analyticsEvents.repository';

// Note: Additional repositories can be added here as they are created:
// - vocabularyRepository (requires v2 schema exports)
// etc.
