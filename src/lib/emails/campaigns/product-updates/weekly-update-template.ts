/**
 * Weekly Product Update Email Template
 *
 * Clean, minimal template for weekly product updates and announcements.
 * Uses Kaiwa's unified email template for consistent branding.
 *
 * Usage:
 * 1. Edit THIS_WEEKS_EMAIL below
 * 2. Send via API or dashboard
 */

import { generateKaiwaEmail, type KaiwaEmailContent } from '$lib/emails/shared/base-template';

// Re-export for backward compatibility
export { generateKaiwaEmail, type KaiwaEmailContent };

/**
 * ✏️ EDIT THIS CONTENT FOR YOUR WEEKLY EMAIL
 *
 * Update this object each week with your latest product news.
 */
export const THIS_WEEKS_EMAIL: KaiwaEmailContent = {
	// Dark header
	headerCategory: 'Weekly Product Update',
	headerTitle: "What's New This Week",
	headerSubtitle: "New features, improvements, and what's coming next",

	preheader: "New features, improvements, and what's coming next",

	greeting: 'Hey 👋',
	intro: "Quick update on what we shipped this week and what's coming next.",

	sections: [
		{
			title: '✨ New This Week',
			items: [
				{
					heading: 'Faster conversation loading',
					description:
						'Removed a slow database join. Conversations now start ~1.5s faster, especially on older devices.',
					link: {
						text: 'See the changelog',
						url: 'https://trykaiwa.com/changelog/faster-loading'
					}
				},
				{
					heading: 'New family dinner scenario',
					description:
						'Practice navigating cultural questions with in-laws in a low-pressure setting.',
					link: { text: 'Try it now', url: 'https://trykaiwa.com/?scenario=family-dinner' }
				}
			]
		},
		{
			title: '🎯 Coming Soon',
			items: [
				{
					heading: 'Custom vocabulary packs',
					description:
						'Load partner-specific phrases before each session. Focus on what actually matters to you.'
				},
				{
					heading: 'Improved progress tracking',
					description: 'See your learning patterns and get personalized recommendations.'
				}
			]
		},
		{
			title: '📝 Your Feedback in Action',
			items: [
				{
					heading: 'Microphone timeout fix',
					description:
						'Changed auto-mute threshold to 90 seconds and added a visual timer. No more surprise disconnects.',
					link: {
						text: 'See the fix',
						url: 'https://trykaiwa.com/changelog/mic-timeout'
					}
				}
			]
		}
	],

	closingNote:
		"That's it for this week. If something's not working or you want to see a specific feature, just reply to this email.",

	signature: {
		name: 'Hiro',
		title: 'Founder',
		ps: 'P.S. Trying something new with this format—let me know if you prefer this over the old style.'
	}
};

/**
 * Quick helper to get this week's email
 */
export function getThisWeeksEmail(userName?: string): { subject: string; html: string } {
	return {
		subject: THIS_WEEKS_EMAIL.preheader || 'Kaiwa Weekly Update',
		html: generateKaiwaEmail(THIS_WEEKS_EMAIL, userName)
	};
}
