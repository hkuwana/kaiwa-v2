// Service layer - Business logic and complex operations
// This file exports all services for use throughout the application

// User preferences service
export * as userPreferencesService from './userPreferences.service';

// User service
export * as userService from './user.service';

// Session service
export * as sessionService from './session.service';

// OpenAI service
export * as openaiService from './openai.service';

// Conversation summary service
export * as conversationSummaryService from './conversationSummary.service';

// Payment and subscription services
export { paymentService } from './payment.service';
export { subscriptionService } from './subscription.service';
export { stripeService } from './stripe.service';

// Email services
export * as emailService from './emailService';
export * as emailVerificationService from './emailVerificationService';

// Translation service
export * as translationService from './translation.service';

// Note: Additional services can be added here as they are created:
// - analyticsService (for analytics and reporting)
// - notificationService (for user notifications)
// etc.
