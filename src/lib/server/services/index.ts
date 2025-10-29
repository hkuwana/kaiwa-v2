// Service layer - Business logic and complex operations
// This file exports all services for use throughout theapplication

// User preferences service
export * as userPreferencesService from './user-preferences.service';

// User service
export * as userService from './user.service';

// Session service
export * as sessionService from './session.service';

// OpenAI service
export * as openaiService from './openai.service';

// Conversation summary service
export * as conversationSummaryService from './conversation-summary.service';

// Conversation memory service
export * as conversationMemoryService from './conversation-memory.service';

// Payment and Stripe services
export * as paymentService from './payment.service';
export { stripeService } from './stripe.service';

// Email services
export * as emailService from './email-service';
export * as emailVerificationService from './email-verification.service';

// Translation service
export * as translationService from './translation.service';
export * as userScenariosService from './scenarios/user-scenarios.server';

// Note: Additional services can be added here as they are created:
// - analyticsService (for analytics and reporting)
// - notificationService (for user notifications)
// etc.
