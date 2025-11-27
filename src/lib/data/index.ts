/**
 * Central Data Exports
 *
 * Import from '$lib/data' to access all app data in one place.
 *
 * Example:
 *   import { CALENDAR_LINK, personalizedPathOffer, languages } from '$lib/data';
 */

// Calendar & Scheduling
export { CALENDAR_LINK } from './calendar';

// Marketing & Promotions
export {
	personalizedPathOffer,
	personalizedPathExamples,
	type PersonalizedPathOffer,
	type PersonalizedPathExample
} from './marketing';

// Languages
export { languages, type Language } from './languages';

// Scenarios
export { scenarios, type ScenarioData } from './scenarios';

// Speakers
export { speakers, type Speaker } from './speakers';

// Tiers & Pricing
export { defaultTierConfigs, type UserTier, type TierConfig } from './tiers';

// User Preferences
export {
	defaultPreferences,
	languageLevelOptions,
	practicalLevelOptions,
	learningGoalOptions,
	challengePreferenceOptions,
	correctionStyleOptions,
	type UserPreferences
} from './user-preferences';

// Community Stories
export { communityStories, type CommunityStory } from './community-stories';

// Survival Phrases
export { survivalPhrases, type SurvivalPhrase } from './survival-phrases';
