/**
 * Marketing & Promotional Data
 *
 * Centralized config for promotional offers, pricing experiments,
 * and marketing copy. Update here to change across the app.
 */

import { CALENDAR_LINK } from './calendar';

/**
 * Personalized Path Offer Configuration
 */
export const personalizedPathOffer = {
	// Pricing
	regularPrice: 99,
	foundingMemberPrice: 49,
	currency: 'USD',

	// Availability
	spotsAvailable: 5,
	availabilityPeriod: 'December',
	isActive: true,

	// Duration options
	durations: [
		{ days: 14, label: '2 weeks' },
		{ days: 28, label: '4 weeks' }
	],

	// What's included
	features: [
		{
			title: '15-minute discovery call',
			description: 'One-on-one with me to understand your exact situation',
			icon: 'mdi--account-voice'
		},
		{
			title: 'Custom scenario path',
			description: '14 or 28 days of practice built for YOUR goals',
			icon: 'mdi--road-variant'
		},
		{
			title: 'Premium access included',
			description: 'Unlimited practice time during your path',
			icon: 'mdi--crown'
		},
		{
			title: 'Mid-path check-in',
			description: "We'll review progress and adjust if needed",
			icon: 'mdi--chart-line'
		}
	],

	// CTA
	ctaText: 'Book Your Consultation',
	ctaSubtext: '15 min with me personally • Then $49 to unlock your path',
	calendarLink: CALENDAR_LINK,

	// Copy
	headline: 'Personalized Learning Path',
	tagline: 'Limited Spots Available',
	description:
		"Stop practicing random scenarios. In a 15-minute consultation, you'll tell me exactly what you're preparing for—meeting your partner's parents, a work trip, reconnecting with family. Then I build you a custom path with daily scenarios designed for YOUR situation.",

	// Value props for comparison
	comparisonPoints: [
		{
			generic: 'Practice ordering at a restaurant',
			personalized:
				"Practice meeting Takeshi's mom, who loves cooking and will ask about your job"
		},
		{
			generic: 'Learn travel phrases',
			personalized: 'Prepare for your Mexico City business dinner in 3 weeks'
		},
		{
			generic: 'Study vocabulary lists',
			personalized: "Finally talk to your grandmother before she forgets you don't speak French"
		}
	]
} as const;

/**
 * Example use cases for marketing
 */
export const personalizedPathExamples = [
	{
		emoji: '👨‍👩‍👧',
		situation: "Meeting my partner's Japanese parents next month",
		language: 'Japanese'
	},
	{
		emoji: '💼',
		situation: 'Business trip to Mexico City in 3 weeks',
		language: 'Spanish'
	},
	{
		emoji: '👵',
		situation: 'Want my kids to talk to their French grandmother',
		language: 'French'
	},
	{
		emoji: '🏠',
		situation: 'Moving to Germany and need to handle daily life',
		language: 'German'
	},
	{
		emoji: '💕',
		situation: "Learning Korean for my partner's family",
		language: 'Korean'
	}
] as const;

export type PersonalizedPathOffer = typeof personalizedPathOffer;
export type PersonalizedPathExample = (typeof personalizedPathExamples)[number];
