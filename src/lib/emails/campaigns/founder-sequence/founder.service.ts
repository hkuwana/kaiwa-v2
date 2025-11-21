import { logger } from '$lib/logger';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { EmailPermissionService } from '$lib/emails/shared/email-permission';
import type { User } from '$lib/server/db/types';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { languageRepository } from '$lib/server/repositories/language.repository';
import { CALENDAR_LINK } from '$lib/data/calendar';
import { generateKaiwaEmail, type KaiwaEmailContent } from '$lib/emails/shared/base-template';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

/**
 * Founder Personal Email Service
 *
 * Simplified two-email sequence:
 * - Day 1 (on signup): Warm welcome from founder
 * - Day 3 (2 days later): Personal offer for 15-min walkthrough call
 *
 * Key principles:
 * - Send from founder's email (hiro@trykaiwa.com)
 * - Personal, conversational tone
 * - Uses unified Kaiwa template with dark header
 * - Include calendar link on Day 3
 * - Easy reply for feedback
 */
export class FounderEmailService {
	public static readonly FOUNDER_EMAIL = 'hiro@trykaiwa.com'; // Using verified Resend domain
	public static readonly FOUNDER_NAME = 'Hiro';
	public static readonly CAL_LINK = CALENDAR_LINK;

	/**
	 * Send Day 1 welcome email if user hasn't practiced
	 */
	static async sendDay1Welcome(userId: string): Promise<boolean> {
		try {
			if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
				logger.warn('RESEND_API_KEY not configured, skipping email send');
				return true;
			}

			// Check email permissions from database
			if (!(await EmailPermissionService.canReceiveFounderEmails(userId))) {
				logger.warn(
					`User ${userId} not eligible for marketing emails (user not found or opted out)`
				);
				return false;
			}

			const user = await userRepository.findUserById(userId);
			if (!user) {
				return false;
			}

			// Check if user has practiced
			const sessions = await conversationSessionsRepository.getUserSessions(userId, 1);
			if (sessions.length > 0) {
				return false; // User already practiced, don't send
			}

			const languageName = await this.resolveTargetLanguageName(userId);
			const firstName = user.displayName?.split(' ')[0] || 'there';

			const result = await resend.emails.send({
				from: `${this.FOUNDER_NAME} <${this.FOUNDER_EMAIL}>`,
				replyTo: this.FOUNDER_EMAIL,
				to: [user.email],
				subject: languageName
					? `${firstName}, ready for your first ${languageName} conversation?`
					: `${firstName}, welcome to Kaiwa! (from Hiro)`,
				html: this.getDay1Email(user, languageName)
			});

			if (result.error) {
				logger.error('Failed to send Day 1 email:', result.error);
				return false;
			}

			logger.info('Day 1 founder email sent:', result.data?.id);
			return true;
		} catch (error) {
			logger.error('Error sending Day 1 email:', error);
			return false;
		}
	}

	/**
	 * Send Day 2 check-in - DEPRECATED: Removed to simplify sequence
	 * Now using Day 1 (signup) + Day 3 (2 days later) only
	 */
	static async sendDay2CheckIn(userId: string): Promise<boolean> {
		// Day 2 email removed - skip this step
		logger.info('Day 2 email skipped (deprecated) for user:', userId);
		return true;
	}

	/**
	 * Send Day 3 personal offer to talk
	 */
	static async sendDay3PersonalOffer(userId: string): Promise<boolean> {
		try {
			if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
				return true;
			}

			// Check email permissions from database
			if (!(await EmailPermissionService.canReceiveFounderEmails(userId))) {
				logger.warn(
					`User ${userId} not eligible for marketing emails (user not found or opted out)`
				);
				return false;
			}

			const user = await userRepository.findUserById(userId);
			if (!user) {
				return false;
			}

			// Check if user has practiced
			const sessions = await conversationSessionsRepository.getUserSessions(userId, 1);
			if (sessions.length > 0) {
				return false; // User practiced, don't send
			}

			const languageName = await this.resolveTargetLanguageName(userId);

			const result = await resend.emails.send({
				from: `${this.FOUNDER_NAME} <${this.FOUNDER_EMAIL}>`,
				replyTo: this.FOUNDER_EMAIL,
				to: [user.email],
				subject: `Can I help? (15 min chat)`,
				html: this.getDay3Email(user, languageName)
			});

			if (result.error) {
				logger.error('Failed to send Day 3 email:', result.error);
				return false;
			}

			logger.info('Day 3 founder email sent:', result.data?.id);
			return true;
		} catch (error) {
			logger.error('Error sending Day 3 email:', error);
			return false;
		}
	}

	/**
	 * Day 1: Warm welcome
	 */
	public static getDay1Email(user: User, languageName: string | null): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const appUrl = env.PUBLIC_APP_URL || 'https://trykaiwa.com';

		const content: KaiwaEmailContent = {
			headerCategory: 'Welcome to Kaiwa',
			headerTitle: `Hi ${firstName}, let's make this easy`,
			headerSubtitle: languageName
				? `Your first ${languageName} conversation starts here`
				: 'Your first conversation starts here',

			preheader: 'Welcome to Kaiwa - let's start with just 5 minutes',

			greeting: 'Hey 👋',
			intro: `Thanks for joining Kaiwa! I'm Hiro, and I built this to make speaking ${languageName || 'a new language'} feel less intimidating—especially when it's for the people you care about.`,

			sections: [
				{
					items: [
						{
							heading: "Here's the only goal for today",
							description: `Just aim for one 5-minute conversation. That's it. Don't worry about being perfect. The AI tutor is patient and won't judge you. I promise it's way less scary than it seems.`,
							link: {
								text: `Start My First ${languageName ? languageName + ' ' : ''}Conversation (5 min)`,
								url: appUrl
							}
						}
					]
				}
			],

			closingNote: `If something's not working or you have questions, just hit reply. I read every email and usually respond within a few hours.`,

			signature: {
				name: 'Hiro',
				title: 'Founder, Kaiwa',
				ps: "P.S. If Kaiwa isn't for you, no worries - just reply and I'll stop emailing."
			}
		};

		return generateKaiwaEmail(content, firstName);
	}

	/**
	 * Day 3: Personal offer for 15-min walkthrough (sent 2 days after signup)
	 */
	public static getDay3Email(user: User, languageName: string | null): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const appUrl = env.PUBLIC_APP_URL || 'https://trykaiwa.com';

		const content: KaiwaEmailContent = {
			headerCategory: 'Personal Invitation',
			headerTitle: 'Quick 15-minute walkthrough?',
			headerSubtitle: "I'm happy to personally show you around Kaiwa",

			preheader: 'Want a personal 15-min walkthrough of Kaiwa? Book a time with Hiro',

			greeting: 'Hey 👋',
			intro: `I wanted to reach out and see if you'd like to jump on a quick 15-minute call. I can walk you through the site and answer any questions you have about ${languageName ? `learning ${languageName}` : 'language learning'}.`,

			sections: [
				{
					title: 'What we can cover',
					items: [
						{
							heading: 'Personalized walkthrough',
							description:
								"I'll show you the best features for your specific learning goals and situation"
						},
						{
							heading: 'Answer your questions',
							description:
								'Anything confusing about the app, language learning, or how to practice effectively'
						},
						{
							heading: 'Get your feedback',
							description:
								"I'm genuinely curious what's working and what isn't. Your input helps me build a better product"
						}
					]
				},
				{
					items: [
						{
							heading: 'Book a time that works for you',
							description:
								'No pressure, no sales pitch. Just a friendly 15-minute chat where I can help you get the most out of Kaiwa.',
							link: {
								text: '📅 Book 15 Minutes with Hiro',
								url: this.CAL_LINK
							}
						}
					]
				}
			],

			closingNote: `And hey, if you're not interested in a call or trying Kaiwa, that's totally okay. Just reply and let me know. No hard feelings—I respect your time!`,

			signature: {
				name: 'Hiro',
				title: 'Founder, Kaiwa',
				ps: "P.S. You can also just reply to this email if you prefer. I read every message and usually respond within a few hours."
			}
		};

		return generateKaiwaEmail(content, firstName);
	}

	public static async resolveTargetLanguageName(userId: string): Promise<string | null> {
		const preferences = await userPreferencesRepository.getAllUserPreferences(userId);

		if (!preferences || preferences.length === 0) {
			return null;
		}

		const targetLanguage = await languageRepository.findLanguageById(
			preferences[0].targetLanguageId
		);

		return targetLanguage?.name ?? null;
	}
}
