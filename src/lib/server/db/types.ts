// Database types for all tables
// These types are derived from the Drizzle schema definitions

import type {
	users,
	session,
	languages,
	speakers,
	tiers,
	userUsage,
	subscriptions,
	payments,
	analyticsEvents,
	conversations,
	messages,
	scenarios,
	scenarioOutcomes,
	vocabularyProgress,
	scenarioAttempts
} from './schema/index';

// Core user management types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

// Language and speaker types
export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;
export type Speaker = typeof speakers.$inferSelect;
export type NewSpeaker = typeof speakers.$inferInsert;

// Tier and subscription types
export type Tier = typeof tiers.$inferSelect;
export type NewTier = typeof tiers.$inferInsert;
export type UserUsage = typeof userUsage.$inferSelect;
export type NewUserUsage = typeof userUsage.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// Analytics types
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// Conversation types
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Learning scenario types
export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;
export type ScenarioOutcome = typeof scenarioOutcomes.$inferSelect;
export type NewScenarioOutcome = typeof scenarioOutcomes.$inferInsert;
export type VocabularyProgress = typeof vocabularyProgress.$inferSelect;
export type NewVocabularyProgress = typeof vocabularyProgress.$inferInsert;
export type ScenarioAttempt = typeof scenarioAttempts.$inferSelect;
export type NewScenarioAttempt = typeof scenarioAttempts.$inferInsert;
