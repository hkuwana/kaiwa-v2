// Database types inferred from schemas
import type { InferSelectModel } from 'drizzle-orm';
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
