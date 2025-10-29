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
	messageAudioAnalysis,
	scenarios,
	userPreferences,
	analyticsEvents,
	emailVerification,
	userSettings,
	linguisticMacroSkillEnum,
	linguisticFeatures,
	linguisticFeatureAliases,
	analysisSuggestionSeverityEnum,
	analysisFindingActionEnum,
	analysisFindings,
	userFeatureProfiles,
	scenarioVisibilityEnum,
	scenarioMetadata,
	userScenarioProgress
} from './schema';

// Tier type definitions
export type UserTier = 'free' | 'plus' | 'premium';

// Audio input mode type
export type AudioInputMode = 'vad' | 'ptt';

// Speech speed type
export type SpeechSpeed = 'auto' | 'very_slow' | 'slow' | 'normal' | 'fast' | 'native';

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
export type MessageAudioAnalysis = InferSelectModel<typeof messageAudioAnalysis>;
export type Scenario = InferSelectModel<typeof scenarios>;
export type UserPreferences = InferSelectModel<typeof userPreferences>;
export type ScenarioMetadata = InferSelectModel<typeof scenarioMetadata>;
export type UserScenarioProgress = InferSelectModel<typeof userScenarioProgress>;
export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
export type EmailVerification = InferSelectModel<typeof emailVerification>;
export type UserSettings = InferSelectModel<typeof userSettings>;
export type LinguisticMacroSkill = (typeof linguisticMacroSkillEnum.enumValues)[number];
export type LinguisticFeature = InferSelectModel<typeof linguisticFeatures>;
export type LinguisticFeatureAlias = InferSelectModel<typeof linguisticFeatureAliases>;
export type AnalysisSuggestionSeverity = (typeof analysisSuggestionSeverityEnum.enumValues)[number];
export type AnalysisFindingAction = (typeof analysisFindingActionEnum.enumValues)[number];
export type AnalysisFinding = InferSelectModel<typeof analysisFindings>;
export type UserFeatureProfile = InferSelectModel<typeof userFeatureProfiles>;

// Helper types for audio analysis
export type SpeechTiming = NonNullable<MessageAudioAnalysis['speechTimings']>[number];
export type PhonemeAnalysis = NonNullable<MessageAudioAnalysis['phonemeAnalysis']>[number];
export type ProblematicWord = NonNullable<MessageAudioAnalysis['problematicWords']>[number];

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
export type NewMessageAudioAnalysis = InferInsertModel<typeof messageAudioAnalysis>;
export type NewScenario = InferInsertModel<typeof scenarios>;
export type NewUserPreferences = InferInsertModel<typeof userPreferences>;
export type NewScenarioMetadata = InferInsertModel<typeof scenarioMetadata>;
export type NewUserScenarioProgress = InferInsertModel<typeof userScenarioProgress>;
export type NewAnalyticsEvent = InferInsertModel<typeof analyticsEvents>;
export type NewEmailVerification = InferInsertModel<typeof emailVerification>;
export type NewUserSettings = InferInsertModel<typeof userSettings>;
export type NewLinguisticFeature = InferInsertModel<typeof linguisticFeatures>;
export type NewLinguisticFeatureAlias = InferInsertModel<typeof linguisticFeatureAliases>;
export type NewAnalysisFinding = InferInsertModel<typeof analysisFindings>;
export type NewUserFeatureProfile = InferInsertModel<typeof userFeatureProfiles>;
export type ScenarioVisibility = (typeof scenarioVisibilityEnum.enumValues)[number];
