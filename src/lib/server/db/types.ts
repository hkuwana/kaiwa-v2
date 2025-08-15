// Database types inferred from schemas
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

import {
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
} from './schema';

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof session>;
export type Language = InferSelectModel<typeof languages>;
export type Speaker = InferSelectModel<typeof speakers>;
export type Tier = InferSelectModel<typeof tiers>;
export type UserUsage = InferSelectModel<typeof userUsage>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type Payment = InferSelectModel<typeof payments>;
export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
export type Conversation = InferSelectModel<typeof conversations>;
export type Message = InferSelectModel<typeof messages>;
export type Scenario = InferSelectModel<typeof scenarios>;
export type ScenarioOutcome = InferSelectModel<typeof scenarioOutcomes>;
export type VocabularyProgress = InferSelectModel<typeof vocabularyProgress>;
export type ScenarioAttempt = InferSelectModel<typeof scenarioAttempts>;

// Insert types for creating new records
export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof session>;
export type NewLanguage = InferInsertModel<typeof languages>;
export type NewSpeaker = InferInsertModel<typeof speakers>;
export type NewTier = InferInsertModel<typeof tiers>;
export type NewUserUsage = InferInsertModel<typeof userUsage>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
export type NewPayment = InferInsertModel<typeof payments>;
export type NewAnalyticsEvent = InferInsertModel<typeof analyticsEvents>;
export type NewConversation = InferInsertModel<typeof conversations>;
export type NewMessage = InferInsertModel<typeof messages>;
export type NewScenario = InferInsertModel<typeof scenarios>;
export type NewScenarioOutcome = InferInsertModel<typeof scenarioOutcomes>;
export type NewVocabularyProgress = InferInsertModel<typeof vocabularyProgress>;
export type NewScenarioAttempt = InferInsertModel<typeof scenarioAttempts>;
