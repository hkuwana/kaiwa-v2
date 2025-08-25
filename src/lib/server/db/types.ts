// Database types inferred from schemas
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

import {
	users,
	session,
	languages,
	speakers,
	tiers,
	userUsage,
	conversationSessions,
	subscriptions,
	payments,
	conversations,
	messages,
	scenarios
} from './schema';

// Tier type definitions
export type UserTier = 'free' | 'plus' | 'premium';

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof session>;
export type Language = InferSelectModel<typeof languages>;
export type Speaker = InferSelectModel<typeof speakers>;
export type Tier = InferSelectModel<typeof tiers>;
export type UserUsage = InferSelectModel<typeof userUsage>;
export type ConversationSession = InferSelectModel<typeof conversationSessions>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type Payment = InferInsertModel<typeof payments>;
export type Conversation = InferSelectModel<typeof conversations>;
export type Message = InferSelectModel<typeof messages>;
export type Scenario = InferSelectModel<typeof scenarios>;

// Insert types for creating new records
export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof session>;
export type NewLanguage = InferInsertModel<typeof languages>;
export type NewSpeaker = InferInsertModel<typeof speakers>;
export type NewTier = InferInsertModel<typeof tiers>;
export type NewUserUsage = InferInsertModel<typeof userUsage>;
export type NewConversationSession = InferInsertModel<typeof conversationSessions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
export type NewPayment = InferInsertModel<typeof payments>;
export type NewConversation = InferInsertModel<typeof conversations>;
export type NewMessage = InferInsertModel<typeof messages>;
export type NewScenario = InferInsertModel<typeof scenarios>;
